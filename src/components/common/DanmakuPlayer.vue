<template>
  <div
    ref="containerRef"
    v-show="store.settings.enabled"
    class="danmaku-container pointer-events-none absolute inset-0 z-20 overflow-hidden"
    :class="{ 'is-paused': isPaused }"
    :style="{ '--container-width': `${width}px` }">
    <div
      v-for="item in activeDanmakus"
      class="danmaku-track-item absolute whitespace-nowrap will-change-transform"
      :key="item.id"
      :class="[`type-${item.type}`]"
      :style="{
        /* 顶部安全距离 10px 防止贴边太死 */
        top: item.type === 'bottom' ? 'auto' : `${item.top + 10}px`,
        /* 底部增加 80px 安全高度，完美避开控制栏 */
        bottom: item.type === 'bottom' ? `${item.top + 80}px` : 'auto',
        animationDuration: `${item.duration}s`,
        zIndex: item.id
      }"
      @mouseenter="interactive ? (hoveredId = item.id) : null"
      @mouseleave="interactive ? (hoveredId = null) : null"
      @animationend.self="handleAnimationEnd(item.id)">
      <div
        class="danmaku-inner flex-y-center gap-2 rounded-full px-3.5 py-1 transition-all duration-200"
        :class="{
          'border-gray border-2': item.isMe,
          'pointer-events-auto cursor-pointer': interactive,
          'is-hovered': hoveredId === item.id
        }"
        :style="{
          fontSize: `${store.actualFontSize}px`,
          opacity: hoveredId === item.id ? 1 : store.settings.opacity / 100
        }">
        <span v-if="!item.gift" class="danmaku-content flex-1 leading-relaxed">{{ item.text }}</span>

        <div v-else class="danmaku-gift text-[#ff6b9d] flex items-center gap-1.5 font-bold tracking-wide">
          <img v-if="item.gift.icon" alt="gift-icon" class="h-5 w-5 object-contain" :src="item.gift.icon" />
          <i-mdi-gift v-else class="text-lg" />
          <span>{{ item.gift.userName }}</span>
          <span class="font-normal">送出</span>
          <span>{{ item.gift.giftName }}</span>
          <span class="text-lg italic ml-0.5">x {{ item.gift.count }}</span>
        </div>

        <span
          v-if="item.count > 1"
          class="combo-badge animate-pop ml-1 rounded bg-[#ff0050] px-1.5 py-0 text-xs font-bold text-white"
          :key="item.comboKey">
          x{{ item.count }}
        </span>

        <div v-if="interactive && hoveredId === item.id" class="danmaku-actions">
          <span
            class="danmaku-action-btn like-btn"
            :class="{ liked: item.isLiked }"
            :title="t('components.videoPlayer.like')"
            @click.stop="handleLike(item)">
            <i-material-symbols-favorite v-if="item.isLiked" class="iconify-icon" />
            <i-material-symbols-favorite-outline v-else class="iconify-icon" />
          </span>
          <span
            class="danmaku-action-btn report-btn"
            :title="t('components.videoPlayer.report')"
            @click.stop="handleReport(item)">
            <i-mdi-alert-outline class="iconify-icon" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useElementSize } from "@vueuse/core";

import { useDanmakuStore } from "@/stores/danmaku";

defineOptions({ name: "DanmakuPlayer" });

const { t } = useI18n();
const store = useDanmakuStore();

const props = defineProps<{
  interactive?: boolean; // 是否开启点赞/举报交互
  isPaused?: boolean; // 是否暂停动画 (跟随视频播放状态)
  enableCombo?: boolean; // 是否开启 Combo 系统
}>();

const emit = defineEmits<{
  (e: "like", id: string | number): void;
  (e: "report", id: string | number): void;
}>();

let danmakuIdCounter = 0;

const containerRef = ref<HTMLElement | null>(null);
const { width, height } = useElementSize(containerRef);
const activeDanmakus = ref<any[]>([]);
const hoveredId = ref<string | number | null>(null);

// 隔离三种轨道的冷却时间，防止顶部/底部和滚动弹幕重叠
const trackCooldowns = ref({
  scroll: {} as Record<number, number>,
  top: {} as Record<number, number>,
  bottom: {} as Record<number, number>
});

const isComboEnabled = computed(() => {
  return props.enableCombo !== undefined ? props.enableCombo : store.settings.enableCombo;
});

/**
 * 添加一条弹幕
 * @param text 弹幕内容
 * @param isMe 是否是自己发送的弹幕
 * @param id 弹幕唯一标识 (可选)
 * @param isLiked 是否已点赞 (可选)
 * @param danmakuType 弹幕类型 (可选，默认跟进 store)
 */
const addDanmaku = (
  text: string,
  isMe: boolean = false,
  id?: string | number,
  isLiked: boolean = false,
  danmakuType?: "scroll" | "top" | "bottom",
  giftData?: { icon?: string; userName: string; giftName: string; count: number | string }
) => {
  if (!store.settings.enabled) return;

  const now = Date.now();
  const type = danmakuType || store.position; // 优先使用传入类型，其次使用全局 Store 类型

  // ================= 1. 同屏同词合并检测 (Combo 系统) =================
  // 倒序遍历，寻找屏幕上最新出现的相同类型且相同内容的弹幕
  if (isComboEnabled.value) {
    for (let i = activeDanmakus.value.length - 1; i >= 0; i--) {
      const d = activeDanmakus.value[i];
      if (d.text === text && d.type === type) {
        d.count++;
        d.comboKey = now; // 更新 key 强制触发 CSS pop 弹跳动画
        return; // 命中合并，不再创建新弹幕 DOM
      }
    }
  }

  // ================= 2. 轨道计算 =================
  const actualHeight = height.value || containerRef.value?.clientHeight || 300;
  const trackHeight = store.actualFontSize + 8;
  let maxTracks = 1;

  switch (store.settings.displayArea) {
    case 1:
      maxTracks = 1;
      break;
    case 2:
      maxTracks = 2;
      break;
    case 3:
      maxTracks = Math.max(1, Math.floor((actualHeight * 0.25) / trackHeight));
      break;
    case 4:
      maxTracks = Math.max(1, Math.floor((actualHeight * 0.5) / trackHeight));
      break;
    case 5:
      maxTracks = Math.max(1, Math.floor((actualHeight * 0.8) / trackHeight));
      break;
  }

  const baseCooldown = store.settings.antiBlock ? 2500 : 300;
  const currentCooldowns = trackCooldowns.value[type];
  const availableTracks: number[] = [];

  for (let i = 0; i < maxTracks; i++) {
    const cd = currentCooldowns[i] || 0;
    if (now - cd > baseCooldown) {
      availableTracks.push(i);
    }
  }

  let selectedTrack = 0;
  if (availableTracks.length > 0) {
    if (type === "scroll") {
      // 滚动弹幕继续使用随机轨道，均匀分布在屏幕上，避免扎堆
      selectedTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    } else {
      // 顶部和底部弹幕绝对不能随机！必须从最边缘（第0轨、第1轨）紧凑地挨个排列
      selectedTrack = availableTracks[0];
    }
  } else {
    // 没空闲轨道时找最老的（挤一挤总比不出来好）
    let minCd = Infinity;
    for (let i = 0; i < maxTracks; i++) {
      const cd = currentCooldowns[i] || 0;
      if (cd < minCd) {
        minCd = cd;
        selectedTrack = i;
      }
    }
  }

  currentCooldowns[selectedTrack] = now;

  // 顶部/底部悬停弹幕默认停留 4 秒，滚动弹幕受速度滑块控制
  const duration = type === "scroll" ? (store.settings.speed === 1 ? 10 : store.settings.speed === 2 ? 7 : 4) : 4;

  activeDanmakus.value.push({
    id: id ?? danmakuIdCounter++,
    text,
    top: selectedTrack * trackHeight, // 对于 bottom 类型，这里存的值会在 template 里绑定给 bottom 属性
    duration,
    isMe,
    isLiked,
    type,
    count: 1, // Combo 计数器
    comboKey: now, // 动画激活用 Key
    gift: giftData // 礼物数据，可选
  });
};

const handleAnimationEnd = (id: string | number) => {
  const index = activeDanmakus.value.findIndex((d) => d.id === id);
  if (index !== -1) {
    activeDanmakus.value.splice(index, 1);
  }
};

const handleLike = (item: any) => {
  item.isLiked = !item.isLiked;
  emit("like", item.id);
};

const handleReport = (item: any) => {
  emit("report", item.id);
};

const clear = () => {
  activeDanmakus.value = [];
};

defineExpose({ addDanmaku, clear });
</script>

<style scoped>
.danmaku-track-item {
  pointer-events: none; /* 让鼠标穿透，由内层承接悬停事件 */
  color: #fff;
}

/* 1. 滚动类型 */
.type-scroll {
  left: 100%;
  animation: slide-left linear forwards;
}

/* 2. 悬停顶部/底部类型 */
.type-top,
.type-bottom {
  left: 50%;
  transform: translate3d(-50%, 0, 0); /* 强制开启 GPU 居中 */
  animation: fade-stay linear forwards;
}

/* 外层响应视频/交互的暂停状态 */
.danmaku-track-item:hover,
.is-paused .danmaku-track-item {
  animation-play-state: paused !important;
  z-index: 1000 !important;
}

.danmaku-inner {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  transform-origin: center center;
}

/* 让滚动弹幕悬浮缩放的中心点更自然 */
.type-scroll .danmaku-inner {
  transform-origin: left center;
}

/* 开启鼠标交互 */
.danmaku-inner.pointer-events-auto {
  pointer-events: auto;
}

/* Hover 时的胶囊毛玻璃 */
.danmaku-inner.is-hovered {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  transform: scale(1.05);
  text-shadow: none;
}

/* 滚动动画 */
@keyframes slide-left {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(calc(var(--container-width) * -1 - 100%), 0, 0);
  }
}

/* 顶部/底部 停留消失动画 */
@keyframes fade-stay {
  0% {
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Combo 徽章弹跳动画 */
@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1);
  }
}
.animate-pop {
  animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.danmaku-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 6px;
}

.danmaku-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  transition: all 0.2s ease;
}

.danmaku-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.like-btn {
  color: #ffffff;
}
.like-btn.liked {
  color: #ff0050;
  background-color: rgba(255, 0, 80, 0.1);
}
.report-btn {
  color: #ffcc00;
}
</style>
