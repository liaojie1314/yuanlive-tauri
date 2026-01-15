<template>
  <div
    data-tauri-drag-region
    class="live-play-container relative w-full h-full bg-black flex flex-col"
    :class="{ 'more-gifts-open': moreGiftsVisible }">
    <!-- 顶部信息栏 固定高度 -->
    <div class="top-info-bar w-full h-12 bg-black/80 flex items-center justify-between px-2 z-999">
      <!-- 返回按钮和主播信息 -->
      <div class="flex items-center gap-3">
        <div
          @click="handleBack"
          class="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label="返回">
          <i-mdi-arrow-left class="w-6 h-6" />
        </div>

        <!-- 主播信息 -->
        <div class="host-info flex items-center gap-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <div class="avatar w-8 h-8 rounded-full overflow-hidden border-2 border-red-500">
            <img src="https://picsum.photos/id/1/100/100" alt="主播头像" class="w-full h-full object-cover" />
          </div>
          <div class="host-info-text flex flex-col">
            <div class="host-name text-white font-medium">千年 (万年之主)</div>
            <div class="host-stats flex items-center gap-2 text-white/70 text-xs">
              <i-mdi-heart-outline class="w-3 h-3" />
              <span>2.9万</span>
            </div>
          </div>
          <div
            class="follow-btn bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition-colors">
            关注
          </div>
          <div
            class="group-btn bg-green-500 text-white text-xs px-3 py-1 rounded-full hover:bg-green-600 transition-colors">
            加粉丝团
          </div>
          <div
            class="vip-btn bg-purple-500 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-600 transition-colors">
            加会员
          </div>
          <div
            class="more-btn w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 观众数量 -->
      <div class="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full mr-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-white">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span class="audience-count text-white font-medium">1234</span>
      </div>
    </div>

    <!-- 视频播放器区域 自适应剩余高度 -->
    <div class="player-container relative w-full flex-grow overflow-hidden">
      <video
        ref="videoRef"
        class="video-js vjs-big-play-centered object-contain"
        autoplay
        playsinline
        preload="auto"
        :controls="false">
        您的浏览器不支持视频播放。
      </video>
    </div>

    <!-- 送礼区 固定高度 -->
    <div class="gift-area w-full h-20 bg-black/90 flex items-center p-2 z-999">
      <!-- 礼物列表 -->
      <div ref="giftListRef" class="gift-list bg-amber flex items-center flex-1 rounded-md">
        <!-- 礼物容器，用于隐藏溢出的礼物 -->
        <div class="gifts-container flex items-center overflow-hidden w-full">
          <n-popover
            v-for="(gift, index) in displayGifts"
            :key="gift.id"
            trigger="hover"
            placement="top"
            :show-arrow="false"
            :raw="true"
            v-model:show="popoverVisible[gift.id]">
            <template #trigger>
              <div
                class="gift-item-container flex flex-col items-center cursor-pointer flex-1 h-full relative overflow-visible transition-all duration-300">
                <!-- 竖线分割 -->
                <div
                  v-if="index > 0"
                  class="gift-divider absolute left-0 top-1/2 transform -translate-y-1/2 h-10 w-[1px] bg-white/20"></div>
                <div
                  class="gift-item-content flex flex-col items-center justify-center h-full px-2 transition-all duration-300">
                  <div class="gift-icon rounded-full flex items-center justify-center mb-1">
                    <svg
                      :xmlns="gift.icon"
                      :width="24"
                      :height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="text-white">
                      <path :d="gift.path" />
                    </svg>
                  </div>
                  <div class="gift-name text-white text-xs truncate max-w-full text-center transition-all duration-300">
                    {{ gift.name }}
                  </div>
                  <div class="gift-cost text-white text-xs opacity-70">{{ gift.cost }}钻</div>
                </div>
                <!-- 赠送按钮 -->
                <div
                  class="gift-send-btn-container transition-all duration-300 opacity-0 transform translate-y-2 flex justify-center">
                  <div
                    class="gift-send-btn bg-red-500 text-white text-xs font-medium py-1 px-4 rounded-md cursor-pointer text-center"
                    @click="sendGiftWithAmount(gift, 1)">
                    赠送
                  </div>
                </div>
              </div>
            </template>
            <div class="gift-amount-popover bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-white/10">
              <div class="gift-amount-grid grid grid-cols-4 gap-2">
                <div
                  v-for="amount in amountOptions"
                  :key="amount.value"
                  @click="sendGiftWithAmount(gift, amount.value)"
                  class="amount-btn cursor-pointer px-4 py-2 bg-white/10 text-white rounded-full transition-all">
                  {{ amount.label }}
                </div>
              </div>
            </div>
          </n-popover>

          <!-- 更多按钮 -->
          <div
            v-if="showMoreBtn"
            class="gift-item-container gift-more-container flex flex-col items-center cursor-pointer flex-1 h-full relative"
            @click="toggleMoreGifts">
            <!-- 竖线分割 -->
            <div
              v-if="displayGifts.length > 0"
              class="gift-divider absolute left-0 top-1/2 transform -translate-y-1/2 h-10 w-[1px] bg-white/20"></div>
            <div class="gift-item gift-more flex flex-col items-center justify-center h-full px-2">
              <div class="gift-icon rounded-full flex items-center justify-center mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-white">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div class="gift-name text-white text-xs truncate text-center">更多</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 充值按钮 -->
      <div
        class="cursor-pointer recharge-btn bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm px-3 h-full flex flex-col items-center justify-center rounded-md hover:opacity-90 transition-opacity ml-3 mr-5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="mb-1">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        充值 &gt;
      </div>
    </div>

    <!-- 礼物动画容器 -->
    <div class="gift-animation-container absolute inset-0 pointer-events-none overflow-hidden z-20"></div>

    <!-- 更多礼物弹窗 -->
    <div
      v-if="moreGiftsVisible"
      class="more-gifts-popup absolute bottom-25 right-0 bg-black/95 backdrop-blur-sm rounded-lg border border-white/10 z-1000"
      style="width: 320px; max-height: 400px">
      <!-- 弹窗头部 -->
      <div class="more-gifts-header flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 class="text-white font-medium">更多礼物</h3>
        <div
          @click="closeMoreGifts"
          class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="关闭">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      </div>

      <!-- 礼物列表 -->
      <div class="more-gifts-content p-2">
        <n-scrollbar height="340px" style="border-radius: 4px">
          <div class="more-gifts-grid grid grid-cols-4 gap-2">
            <n-popover
              v-for="gift in remainingGifts"
              :key="gift.id"
              trigger="hover"
              placement="top"
              :show-arrow="false"
              :raw="true"
              v-model:show="popoverVisible[gift.id]">
              <template #trigger>
                <div
                  class="gift-item-container flex flex-col items-center cursor-pointer p-2 bg-white/5 rounded-md hover:bg-white/10">
                  <div class="gift-icon rounded-full flex items-center justify-center my-1">
                    <svg
                      :xmlns="gift.icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="text-white">
                      <path :d="gift.path" />
                    </svg>
                  </div>
                  <div class="gift-name text-white text-xs truncate max-w-full text-center">
                    {{ gift.name }}
                  </div>
                  <div class="gift-cost text-white text-xs opacity-70">{{ gift.cost }}钻</div>
                  <!-- 赠送按钮 -->
                  <div class="gift-send-btn-container mt-2">
                    <div
                      class="gift-send-btn bg-red-500 text-white text-xs font-medium py-1 px-4 rounded-md w-full cursor-pointer hover:bg-red-600 transition-colors text-center"
                      @click="sendGiftWithAmount(gift, 1)">
                      赠送
                    </div>
                  </div>
                </div>
              </template>
              <div class="gift-amount-popover bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                <div class="gift-amount-grid grid grid-cols-4 gap-2">
                  <div
                    v-for="amount in amountOptions"
                    :key="amount.value"
                    @click="sendGiftWithAmount(gift, amount.value)"
                    class="amount-btn px-4 py-2 bg-white/10 text-white rounded-full transition-all cursor-pointer hover:bg-white/20">
                    {{ amount.label }}
                  </div>
                </div>
              </div>
            </n-popover>
          </div>
        </n-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/http-streaming";
import { NPopover, NScrollbar } from "naive-ui";
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useResizeObserver } from "@/hooks/useResizeObserver";

const router = useRouter();
const videoRef = ref<HTMLVideoElement | null>(null);
const giftListRef = ref<HTMLElement | null>(null);
let player: any = null;

// 跟踪每个popover的显示状态
const popoverVisible = ref<Record<number, boolean>>({});

// 控制更多礼物弹窗的显示状态
const moreGiftsVisible = ref(false);

// 计算剩余未显示的礼物列表
const remainingGifts = computed(() => {
  return gifts.slice(visibleGiftCount.value - 1);
});

// 切换更多礼物弹窗
const toggleMoreGifts = () => {
  moreGiftsVisible.value = !moreGiftsVisible.value;
};

// 关闭更多礼物弹窗
const closeMoreGifts = () => {
  moreGiftsVisible.value = false;
};

// 礼物数据
const gifts = [
  {
    id: 1,
    name: "爱心",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    cost: 1
  },
  {
    id: 2,
    name: "人气榜",
    icon: "http://www.w3.org/2000/svg",
    path: "M16 3.13a4 4 0 0 1 0 7.75 4 4 0 0 1 0-7.75zM9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2H5z",
    cost: 1
  },
  {
    id: 3,
    name: "雪落花",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z",
    cost: 99
  },
  {
    id: 4,
    name: "Thuglife",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2l1.41 1.41L16.83 7H21v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7h4.17L10.59 3.41L12 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z",
    cost: 99
  },
  {
    id: 5,
    name: "大啤酒",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2l1.41 1.41L16.83 7H21v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7h4.17L10.59 3.41L12 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z",
    cost: 2
  },
  {
    id: 6,
    name: "冬雪之爱",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z",
    cost: 99
  },
  {
    id: 7,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 10,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 11,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 12,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 13,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 14,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 15,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 16,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 17,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 18,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 19,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 20,
    name: "加油鸭",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 15
  },
  {
    id: 8,
    name: "鲜花",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    cost: 10
  },
  {
    id: 9,
    name: "拯救爱播",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z",
    cost: 299
  }
];

// 礼物数量选项
const amountOptions = [
  { label: "1个", value: 1 },
  { label: "10个", value: 10 },
  { label: "66个", value: 66 },
  { label: "188个", value: 188 },
  { label: "520个", value: 520 },
  { label: "999个", value: 999 },
  { label: "1314个", value: 1314 }
];

// 可显示的礼物数量
const visibleGiftCount = ref(4);

// 计算显示的礼物列表
const displayGifts = computed(() => {
  return gifts.slice(0, visibleGiftCount.value - 1);
});

// 是否显示更多按钮
const showMoreBtn = computed(() => {
  return gifts.length > visibleGiftCount.value - 1;
});

// 计算可显示的礼物数量
const calculateVisibleGiftCount = () => {
  if (!giftListRef.value) return;

  // 获取礼物列表宽度
  const giftListWidth = giftListRef.value.clientWidth;
  // 单个礼物项最小宽度（包含图标、文字和内边距）
  const minGiftWidth = 80;

  // 计算可显示的礼物数量
  let count = Math.floor(giftListWidth / minGiftWidth);

  // 确保至少显示2个礼物和1个更多按钮
  count = Math.max(count, 2);

  visibleGiftCount.value = count;
};

// 返回上一页
const handleBack = () => {
  router.back();
};

// 赠送礼物带数量
const sendGiftWithAmount = (gift: any, amount: number) => {
  console.log(`赠送礼物：${gift.name} x ${amount}`);
  // 这里可以添加礼物发送的逻辑，比如调用API等
  // 发送成功后可以添加礼物动画效果
  createGiftAnimation(gift, amount);
  // 关闭对应的popover
  popoverVisible.value[gift.id] = false;
};

// 创建礼物动画
const createGiftAnimation = (gift: any, amount: number) => {
  const container = document.querySelector(".gift-animation-container");
  if (!container) return;

  // 创建礼物动画元素
  const animationEl = document.createElement("div");
  animationEl.className = "gift-animation-item absolute";
  animationEl.innerHTML = `
    <div class="gift-animation-content flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
      <div class="gift-icon w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
          <path d="${gift.path}"/>
        </svg>
      </div>
      <span class="gift-name text-white text-sm">${gift.name} x ${amount}</span>
    </div>
  `;

  // 设置初始位置
  animationEl.style.bottom = "10%";
  animationEl.style.left = "50px";
  animationEl.style.transform = "translateY(100%)";
  animationEl.style.opacity = "0";

  container.appendChild(animationEl);

  // 添加动画
  setTimeout(() => {
    animationEl.style.transition = "all 0.5s cubic-bezier(0.17, 0.55, 0.55, 1)";
    animationEl.style.transform = "translateY(-50px)";
    animationEl.style.opacity = "1";
  }, 100);

  // 移除动画元素
  setTimeout(() => {
    animationEl.style.transition = "all 0.5s ease-out";
    animationEl.style.transform = "translateY(-100px)";
    animationEl.style.opacity = "0";

    setTimeout(() => {
      if (animationEl.parentNode) {
        animationEl.parentNode.removeChild(animationEl);
      }
    }, 500);
  }, 2000);
};

// 使用ResizeObserver监听礼物列表宽度变化
useResizeObserver(giftListRef, calculateVisibleGiftCount);

onMounted(() => {
  // 初始化video.js播放器
  if (videoRef.value) {
    player = videojs(videoRef.value, {
      controls: false,
      autoplay: true,
      preload: "auto",
      responsive: true,
      fluid: false,
      bigPlayButton: false,
      controlBar: false,
      loadingSpinner: false,
      posterImage: false,
      textTrackDisplay: false,
      errorDisplay: false,
      pictureInPictureToggle: false,
      fullscreenToggle: false,
      // 添加FLV支持配置
      sources: [
        {
          src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          type: "application/x-mpegURL"
        }
      ],
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true
        }
      }
    });

    // 确保播放器尺寸正确
    player.on("ready", () => {
      const resizePlayer = () => {
        if (videoRef.value && player) {
          const container = videoRef.value.parentElement;
          if (container) {
            const rect = container.getBoundingClientRect();
            player.width(rect.width);
            player.height(rect.height);
          }
        }
      };

      resizePlayer();
      window.addEventListener("resize", resizePlayer);
    });
  }

  // 初始化礼物列表宽度计算
  calculateVisibleGiftCount();

  // 添加点击外部关闭更多礼物弹窗的事件监听
  const handleClickOutside = (event: MouseEvent) => {
    const moreGiftsPopup = document.querySelector(".more-gifts-popup");
    const moreBtn = document.querySelector(".gift-more-container");
    if (
      moreGiftsVisible.value &&
      moreGiftsPopup &&
      !moreGiftsPopup.contains(event.target as Node) &&
      moreBtn &&
      !moreBtn.contains(event.target as Node)
    ) {
      closeMoreGifts();
    }
  };

  document.addEventListener("click", handleClickOutside);

  // 清理事件监听
  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
});

onUnmounted(() => {
  // 清理工作已由useResizeObserver自动处理
});
</script>

<style scoped>
.live-play-container {
  overflow: hidden;
}

/* 送礼区样式 */
.gift-area {
  flex-shrink: 0;
}

.gift-list {
  min-width: 0;
  height: 100%;
}

/* 礼物容器，用于隐藏溢出的礼物 */
.gifts-container {
  min-width: 0;
  height: 100%;
}

.recharge-btn {
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* 礼物项容器 */
.gift-item-container {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: visible;
  transition: all 0.3s ease;
  padding: 4px 0;
}

/* 竖线分割 */
.gift-divider {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.2);
}

.gift-name {
  font-size: 10px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  margin-top: 2px;
  transition: all 0.3s ease;
}

.gift-cost {
  font-size: 9px;
  opacity: 0.7;
  margin-top: 1px;
}

/* 赠送按钮容器 */
.gift-send-btn-container {
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(2px);
  margin-top: 4px;
  width: 100%;
  pointer-events: none;
  height: 0;
  overflow: hidden;
  padding: 0 8px;
}

/* 赠送按钮样式 */
.gift-send-btn {
  font-size: 10px;
  font-weight: 500;
  padding: 4px 0;
  background-color: #ff0050;
  color: white;
  border-radius: 4px;
  width: 100%;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.2s ease;
}

/* 悬停效果 */
.gift-item-container:hover {
  height: auto;
  padding: 14px 0 14px 0;
  background-color: rgba(255, 0, 80, 0.1);
  border-radius: 4px;
  margin: -10px 0;
}

.gift-item-container:hover .gift-name {
  opacity: 0;
  height: 0;
  margin: 0;
  padding: 0;
  visibility: hidden;
}

.gift-item-container:hover .gift-send-btn-container {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  height: auto;
}

/* 更多按钮样式 - 固定，不需要动画 */
.gift-more-container {
  transition: none !important;
}

.gift-more-container:hover {
  height: 100% !important;
  padding: 4px 0 !important;
  background-color: transparent !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

.gift-more-container:hover .gift-name {
  opacity: 1 !important;
  height: auto !important;
  margin-top: 2px !important;
  padding: 0 !important;
  visibility: visible !important;
}

.gift-more {
  transition: none !important;
}

/* 观众数量样式 */
.audience-count {
  font-size: 14px;
  font-weight: 500;
}

/* 礼物动画样式 */
.gift-animation-container {
  pointer-events: none;
  overflow: hidden;
  z-index: 20;
}

.gift-animation-item {
  z-index: 100;
}

.gift-animation-content {
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.gift-animation-content .gift-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.gift-animation-content .gift-name {
  font-size: 14px;
  color: white;
  font-weight: 500;
}

/* 自定义video.js样式 */
:deep(.video-js) {
  width: 100%;
  height: 100%;
  --vjs-theme-sea-primary: #ff0000;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}

:deep(.vjs-tech) {
  object-fit: contain !important;
  width: 100% !important;
  height: 100% !important;
}

:deep(.vjs-control-bar) {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%);
  padding: 10px 20px;
}

:deep(.vjs-button) {
  color: #fff;
  font-size: 16px;
}

:deep(.vjs-button:hover) {
  color: #ff0000;
}

:deep(.vjs-play-progress) {
  background-color: #ff0000;
}

:deep(.vjs-slider-bar) {
  background-color: #ff0000;
}

:deep(.vjs-big-play-button) {
  background-color: rgba(255, 0, 0, 0.7);
  border-color: #fff;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  margin-left: -40px;
  margin-top: -40px;
}

:deep(.vjs-big-play-button:hover) {
  background-color: rgba(255, 0, 0, 0.9);
  border-color: #fff;
  transform: scale(1.1);
}

:deep(.vjs-loading-spinner) {
  border-color: rgba(255, 0, 0, 0.5);
}

/* 自定义naive-ui样式 */
:deep(.n-popover) {
  z-index: 1000 !important;
}

.amount-btn {
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 500;
}

/* 礼物数量弹出框样式 */
.gift-amount-popover {
  min-width: 300px;
}

.gift-amount-grid {
  gap: 8px;
}

/* 更多礼物弹窗样式 */
.more-gifts-popup {
  transition: all 0.3s ease;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
}

/* 更多礼物弹窗头部样式 */
.more-gifts-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 更多礼物网格布局 */
.more-gifts-grid {
  gap: 8px;
}

/* 弹窗打开时，调整视频容器布局 */
.live-play-container.more-gifts-open .player-container {
  margin-right: 320px; /* 与弹窗宽度一致 */
  transition: margin-right 0.3s ease;
}

/* 弹窗礼物项基础样式 - 固定高度并添加上下间距 */
.more-gifts-grid .gift-item-container {
  height: 80px !important;
  border-radius: 4px !important;
  transition: background-color 0.2s ease !important;
}

/* 弹窗礼物项hover效果 - 保持固定高度 */
.more-gifts-grid .gift-item-container:hover {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px !important;
  margin: 2px 0 !important;
  border-radius: 4px !important;
}

/* 确保弹窗礼物项的名称在hover时隐藏 */
.more-gifts-grid .gift-item-container:hover .gift-name {
  opacity: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  visibility: hidden !important;
}

/* 确保弹窗礼物项的赠送按钮容器样式正确 */
.more-gifts-grid .gift-item-container:hover .gift-send-btn-container {
  opacity: 1 !important;
  transform: none !important;
  pointer-events: auto !important;
  height: auto !important;
  margin-top: 2px !important;
}

/* 确保弹窗内的礼物数量弹窗层级更高 */
.more-gifts-popup :deep(.n-popover) {
  z-index: 1001 !important;
}
</style>
