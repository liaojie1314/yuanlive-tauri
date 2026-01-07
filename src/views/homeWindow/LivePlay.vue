<template>
  <div class="live-play-container relative w-full h-full bg-black flex flex-col">
    <!-- 顶部信息栏 固定高度 -->
    <div class="top-info-bar w-full h-12 bg-black/80 flex items-center justify-between px-4 z-10">
      <!-- 返回按钮和主播信息 -->
      <div class="flex items-center gap-3">
        <button
          @click="handleBack"
          class="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label="返回">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- 主播信息 -->
        <div class="host-info flex items-center gap-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
          <div class="avatar w-8 h-8 rounded-full overflow-hidden border-2 border-red-500">
            <img src="https://picsum.photos/id/1/100/100" alt="主播头像" class="w-full h-full object-cover" />
          </div>
          <div class="host-info-text flex flex-col">
            <div class="host-name text-white font-medium">千年 (万年之主)</div>
            <div class="host-stats flex items-center gap-2 text-white/70 text-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>2.9万</span>
            </div>
          </div>
          <button
            class="follow-btn bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition-colors">
            关注
          </button>
          <button
            class="group-btn bg-green-500 text-white text-xs px-3 py-1 rounded-full hover:bg-green-600 transition-colors">
            加粉丝团
          </button>
          <button
            class="vip-btn bg-purple-500 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-600 transition-colors">
            加会员
          </button>
          <button
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
          </button>
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
      <video ref="videoRef" class="video-js vjs-big-play-centered object-contain" autoplay playsinline preload="auto">
        <source src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" type="application/x-mpegURL" />
        您的浏览器不支持视频播放。
      </video>
    </div>

    <!-- 送礼区 固定高度 -->
    <div class="gift-area w-full h-20 bg-gradient-to-t from-black to-transparent flex items-center px-4 z-10">
      <!-- 礼物列表 -->
      <n-scrollbar x-scrollable class="flex-shrink-0 flex-grow">
        <div class="gift-list flex items-center gap-3 px-2">
          <n-popover
            v-for="gift in gifts"
            :key="gift.id"
            trigger="hover"
            placement="top"
            :show-arrow="false"
            :raw="true"
            v-model:show="popoverVisible[gift.id]">
            <template #trigger>
              <div
                class="gift-item flex flex-col items-center cursor-pointer hover:scale-110 transition-transform duration-200 px-1">
                <div
                  class="gift-icon w-12 h-12 rounded-full flex items-center justify-center mb-1 transition-all duration-300 hover:bg-red-500/30">
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
                    class="text-white transition-all duration-300 hover:scale-125">
                    <path :d="gift.path" />
                  </svg>
                </div>
                <div
                  class="gift-name text-white text-xs truncate max-w-[60px] transition-colors duration-300 hover:text-red-400">
                  {{ gift.name }}
                </div>
              </div>
            </template>
            <div class="gift-amount-popover bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-white/10">
              <div class="gift-amount-grid grid grid-cols-4 gap-2">
                <button
                  v-for="amount in amountOptions"
                  :key="amount.value"
                  @click="sendGiftWithAmount(gift, amount.value)"
                  class="amount-btn px-4 py-2 bg-white/10 hover:bg-red-500/30 text-white rounded-full transition-all duration-200 hover:transform hover:scale-105">
                  {{ amount.label }}
                </button>
              </div>
            </div>
          </n-popover>
        </div>
      </n-scrollbar>
    </div>

    <!-- 礼物动画容器 -->
    <div class="gift-animation-container absolute inset-0 pointer-events-none overflow-hidden z-20"></div>
  </div>
</template>

<script setup lang="ts">
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { NScrollbar, NPopover } from "naive-ui";

const router = useRouter();
const videoRef = ref<HTMLVideoElement | null>(null);
let player: any = null;

// 跟踪每个popover的显示状态
const popoverVisible = ref<Record<number, boolean>>({});

// 礼物数据
const gifts = [
  {
    id: 1,
    name: "爱心",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
  },
  {
    id: 3,
    name: "雪花",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
  },
  {
    id: 4,
    name: "大啤酒",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2l1.41 1.41L16.83 7H21v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7h4.17L10.59 3.41L12 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
  },
  { id: 6, name: "鲜花", icon: "http://www.w3.org/2000/svg", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  {
    id: 7,
    name: "热气球",
    icon: "http://www.w3.org/2000/svg",
    path: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
  },
  {
    id: 8,
    name: "比心小兔",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
  },
  {
    id: 9,
    name: "热球",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"
  },
  {
    id: 11,
    name: "闪耀星辰",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"
  },
  {
    id: 12,
    name: "跑车",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2l1.41 1.41L16.83 7H21v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V7h4.17L10.59 3.41L12 2zm0 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"
  },
  {
    id: 13,
    name: "爱的纸鹤",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"
  },
  {
    id: 15,
    name: "爱情海",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"
  },
  { id: 16, name: "送你花", icon: "http://www.w3.org/2000/svg", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  {
    id: 17,
    name: "玫瑰",
    icon: "http://www.w3.org/2000/svg",
    path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
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

onMounted(() => {
  // 初始化video.js播放器
  if (videoRef.value) {
    player = videojs(videoRef.value, {
      controls: true,
      autoplay: true,
      preload: "auto",
      responsive: true,
      fluid: false,
      bigPlayButton: true,
      controlBar: {
        volumePanel: {
          inline: false
        },
        playbackRateMenuButton: true
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
});
</script>

<style scoped>
.live-play-container {
  overflow: hidden;
}

.player-container {
  position: relative;
}

.gift-area {
  flex-shrink: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.gift-area::-webkit-scrollbar {
  height: 4px;
}

.gift-area::-webkit-scrollbar-track {
  background: transparent;
}

.gift-area::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.gift-list {
  flex: 1;
  min-width: 0;
}

.gift-item {
  transition: all 0.2s ease;
}

.gift-item:hover {
  transform: scale(1.1);
}

/* 主播信息样式 */
.avatar {
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.host-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.host-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.host-name {
  font-size: 14px;
  font-weight: 500;
}

.host-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.follow-btn,
.group-btn,
.vip-btn {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.more-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

/* 观众数量样式 */
.audience-count {
  font-size: 14px;
  font-weight: 500;
}

/* 礼物动画样式 */
.gift-animation-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 20;
}

.gift-animation-item {
  position: absolute;
  z-index: 100;
}

.gift-animation-content {
  display: flex;
  align-items: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
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
:deep(.n-scrollbar) {
  max-width: 100%;
}

:deep(.n-scrollbar__rail--horizontal) {
  background: transparent !important;
  height: 6px !important;
}

:deep(.n-scrollbar__thumb--horizontal) {
  background: rgba(255, 255, 255, 0.3) !important;
  border-radius: 3px !important;
  height: 6px !important;
}

:deep(.n-scrollbar__thumb--horizontal:hover) {
  background: rgba(255, 255, 255, 0.5) !important;
}

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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
</style>
