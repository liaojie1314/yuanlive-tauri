<template>
  <div
    ref="containerRef"
    class="danmaku-container absolute inset-0 pointer-events-none overflow-hidden z-20"
    v-show="store.settings.enabled">
    <div
      v-for="item in activeDanmakus"
      :key="item.id"
      class="danmaku-item text-white font-medium whitespace-nowrap"
      :class="{
        'border-2 border-gray px-2 py-0.5 rounded-md': item.isMe
      }"
      :style="{
        top: `${item.top}px`,
        fontSize: `${store.actualFontSize}px`,
        opacity: store.settings.opacity / 100,
        animationDuration: `${item.duration}s`,
        zIndex: item.id
      }"
      @animationend="handleAnimationEnd(item.id)">
      {{ item.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from "@vueuse/core";

import { useDanmakuStore } from "@/stores/danmaku";

const store = useDanmakuStore();

let danmakuId = 0;

const containerRef = ref<HTMLElement | null>(null);
const { height } = useElementSize(containerRef);
// 活跃的弹幕列表
const activeDanmakus = ref<any[]>([]);
// 轨道冷却时间记录 { trackIndex: timestamp }
const trackCooldowns = ref<Record<number, number>>({});

/**
 * 添加一条弹幕
 * @param text 弹幕内容
 * @param isMe 是否是自己发送的弹幕
 */
const addDanmaku = (text: string, isMe: boolean = false) => {
  if (!store.settings.enabled) return;

  // 加入保底高度，防止初始化瞬间 height.value 为 0 导致只能算出行数为 1
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

  const now = Date.now();
  // 开启防挡时冷却时间大幅增加，保证长弹幕错开
  const baseCooldown = store.settings.antiBlock ? 2500 : 300;

  // 1. 收集当前所有空闲的轨道
  const availableTracks: number[] = [];
  for (let i = 0; i < maxTracks; i++) {
    const cd = trackCooldowns.value[i] || 0;
    if (now - cd > baseCooldown) {
      availableTracks.push(i);
    }
  }

  let selectedTrack = 0;
  if (availableTracks.length > 0) {
    // 核心修复：从所有空闲轨道中随机挑一个，让弹幕均匀分布在整个区域
    selectedTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
  } else {
    // 2. 如果都没空闲（弹幕太密集），找最久没用的那条轨道
    let minCd = Infinity;
    for (let i = 0; i < maxTracks; i++) {
      const cd = trackCooldowns.value[i] || 0;
      if (cd < minCd) {
        minCd = cd;
        selectedTrack = i;
      }
    }
  }

  trackCooldowns.value[selectedTrack] = now;

  // 速度映射：值越小跑得越慢
  const duration = store.settings.speed === 1 ? 10 : store.settings.speed === 2 ? 7 : 4;

  activeDanmakus.value.push({
    id: danmakuId++,
    text,
    top: selectedTrack * trackHeight,
    duration,
    isMe
  });
};

/**
 * 动画结束钩子：彻底销毁 DOM 节点，防止内存泄漏
 * @param id 弹幕 ID
 */
const handleAnimationEnd = (id: number) => {
  const index = activeDanmakus.value.findIndex((d) => d.id === id);
  if (index !== -1) {
    activeDanmakus.value.splice(index, 1);
  }
};

// 暴露方法给外部组件调用
defineExpose({
  addDanmaku
});
</script>

<style scoped>
.danmaku-item {
  position: absolute;
  /* 描边让白字在各种背景下都清晰可见 */
  text-shadow:
    1px 1px 2px rgba(0, 0, 0, 0.8),
    -1px -1px 2px rgba(0, 0, 0, 0.8);
  /* 开启硬件加速 */
  will-change: transform;
  animation-name: slide-left;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

/* 弹幕运动轨迹：从屏幕最右侧 100% 运动到最左侧 -100% 完全出去 */
@keyframes slide-left {
  0% {
    transform: translateX(0);
    left: 100%;
  }
  100% {
    transform: translateX(-100%);
    left: 0;
  }
}
</style>
