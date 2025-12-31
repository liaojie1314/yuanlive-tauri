<template>
  <div class="video-player-container" @click="handleContainerClick">
    <div ref="videoContainerRef" class="video-container"></div>

    <!-- Center Pause Icon -->
    <div v-if="showPauseOverlay" class="pause-overlay" @click.stop="togglePlay">
      <div class="pause-icon-container">
        <i-material-symbols-play-arrow-rounded class="pause-icon" />
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar-container" @click.stop>
      <n-slider
        v-model:value="currentTime"
        :max="duration"
        :step="0.1"
        :tooltip="false"
        @update:value="seek"
        class="progress-bar"
        :show-input="false"
        :show-tooltip="false" />
    </div>

    <!-- Custom Controls -->
    <div class="custom-controls" @click.stop>
      <!-- Left Controls: Play Button and Progress -->
      <div class="left-controls" ref="leftControlsRef">
        <!-- Play/Pause Button -->
        <div class="control-item" @click="togglePlay">
          <span class="control-icon play-icon">
            <i-material-symbols-pause-rounded v-if="isPlaying" class="iconify-icon" />
            <i-material-symbols-play-arrow-rounded v-else class="iconify-icon" />
          </span>
        </div>

        <!-- Playback Progress -->
        <div class="control-item">
          <span class="progress-text">
            {{ formatTime(currentTime) }}
            <span v-if="!isLeftControlsCompact">/ {{ formatTime(duration) }}</span>
          </span>
        </div>

        <!-- Danmaku Input -->
        <DanmakuInput
          class="control-item"
          :is-enabled="true"
          :is-danmaku-enabled="isDanmakuEnabled"
          @send-danmaku="sendDanmaku"
          @toggle-danmaku="toggleDanmaku"
          @danmaku-settings-change="handleDanmakuSettingsChange"
          @toggle-danmaku-list="toggleDanmakuList" />
      </div>

      <!-- Right Controls: All Other Controls -->
      <div class="right-controls">
        <!-- Autoplay Toggle -->
        <div class="control-item">
          <span class="control-text">连播</span>
          <n-switch v-model:value="isAutoplay" @update:value="toggleAutoplay" class="control-switch" />
        </div>

        <!-- Clear Screen Toggle -->
        <div class="control-item">
          <span class="control-text">清屏</span>
          <n-switch v-model:value="isClearScreen" @update:value="toggleClearScreen" class="control-switch" />
        </div>

        <!-- Resolution Control -->
        <div class="control-item">
          <n-dropdown :options="resolutionOptions" @select="switchResolution">
            <div class="control-icon">{{ currentResolution }}</div>
          </n-dropdown>
        </div>

        <!-- Playback Rate Control -->
        <div class="control-item">
          <n-dropdown :options="playbackRateOptions" @select="setPlaybackRate">
            <div class="control-icon">{{ playbackRate }}x</div>
          </n-dropdown>
        </div>

        <!-- Mini Window Toggle -->
        <div class="control-item" @click="toggleMiniWindow">
          <span class="control-icon" :class="{ active: isMiniWindow }">
            <i-mdi-dock-window class="iconify-icon" />
          </span>
        </div>

        <!-- Volume Control -->
        <div class="control-item volume-control">
          <div @click="toggleMute" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
            <span class="control-icon">
              <i-ph-speaker-slash v-if="isMuted || volume === 0" class="iconify-icon" />
              <i-ph-speaker-low v-else-if="volume < 0.5" class="iconify-icon" />
              <i-ph-speaker-high v-else class="iconify-icon" />
            </span>
          </div>
          <div
            class="volume-slider-container"
            v-show="showVolumeSlider"
            @mouseenter="showVolumeSlider = true"
            @mouseleave="showVolumeSlider = false">
            <n-slider v-model:value="volume" :min="0" :max="1" :step="0.05" @update:value="setVolume" vertical />
          </div>
        </div>

        <!-- Fullscreen Button -->
        <div class="control-item" @click="toggleFullscreen">
          <span class="control-icon fullscreen-icon">
            <i-mdi-fullscreen-exit v-if="isFullscreen" class="iconify-icon" />
            <i-mdi-fullscreen v-else class="iconify-icon" />
          </span>
        </div>
      </div>
    </div>
  </div>
  <DanmakuListDialog
    v-model:show="showDanmakuListDialog"
    :danmaku-list="danmakuList"
    @open-report="openDanmakuReportDialog" />
  <DanmakuReportDialog
    v-model:show="showDanmakuReportDialog"
    :danmaku-index="selectedDanmakuIndex"
    @submit-report="handleDanmakuReport" />
</template>

<script setup lang="ts">
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { NSwitch, NDropdown, NSlider } from "naive-ui";
import DanmakuInput from "../common/DanmakuInput.vue";
import DanmakuListDialog from "../common/DanmakuListDialog.vue";
import DanmakuReportDialog from "../common/DanmakuReportDialog.vue";

// Props
const props = defineProps<{
  src: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "none" | "metadata" | "auto";
}>();

// Emits
const emit = defineEmits<{
  (e: "ready", player: any): void;
  (e: "play"): void;
  (e: "pause"): void;
  (e: "ended"): void;
  (e: "error", error: any): void;
  (e: "timeupdate", currentTime: number, duration: number): void;
  (e: "volumechange", volume: number): void;
  (e: "danmaku-send", text: string, isImage?: boolean): void;
  (e: "autoplay-change", value: boolean): void;
  (e: "clear-screen-change", value: boolean): void;
  (e: "danmaku-toggle", value: boolean): void;
  (e: "danmaku-settings-change", settings: any): void;
  (e: "danmaku-list-toggle"): void;
}>();

// Refs
const videoContainerRef = ref<HTMLDivElement | null>(null);
const playerRef = ref<any>(null);
const leftControlsRef = ref<HTMLDivElement | null>(null);

// States for custom controls
const isAutoplay = ref(false);
const isClearScreen = ref(false);
const isDanmakuEnabled = ref(true);
const isMiniWindow = ref(false);
const isPlaying = ref(false);
const isFullscreen = ref(false);
const playbackRate = ref(1.0);
const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

// Danmaku List Dialog
const showDanmakuListDialog = ref(false);
const showDanmakuReportDialog = ref(false);
const selectedDanmakuIndex = ref(-1);
const danmakuList = ref([
  { time: "00:00", content: "快跑 这期有脏东西（云耀欧了）", isLiked: true },
  { time: "00:00", content: "不对劲还我植物大战僵尸", isLiked: false },
  { time: "00:01", content: "《关于我开盒自己这件事》", isLiked: true },
  { time: "00:01", content: "我是不是有什么问题", isLiked: false },
  { time: "00:02", content: "我都没看出来是你自己", isLiked: false },
  { time: "00:02", content: "云耀，你在吗云耀", isLiked: true },
  { time: "00:03", content: "现在知道自己多搞笑了吧", isLiked: false },
  { time: "00:03", content: "云耀：我炸了", isLiked: true },
  { time: "00:04", content: "你在教我做事？", isLiked: false },
  { time: "00:04", content: "云耀的小表情太可爱了", isLiked: true },
  { time: "00:05", content: "节目效果拉满", isLiked: false },
  { time: "00:05", content: "我笑出眼泪了", isLiked: true },
  { time: "00:06", content: "这波操作666", isLiked: false },
  { time: "00:06", content: "主播反应太真实了", isLiked: true },
  { time: "00:07", content: "我已经截图了", isLiked: false },
  { time: "00:07", content: "这个视频我看了10遍", isLiked: true },
  { time: "00:08", content: "弹幕大军来袭", isLiked: false },
  { time: "00:08", content: "前方高能预警", isLiked: true },
  { time: "00:09", content: "我来了我来了", isLiked: false },
  { time: "00:09", content: "打卡打卡", isLiked: true }
]);

// Open report dialog
const openDanmakuReportDialog = (index: number) => {
  selectedDanmakuIndex.value = index;
  showDanmakuReportDialog.value = true;
};

// Handle report submission
const handleDanmakuReport = (index: number, type: string, description: string) => {
  console.log("Report submitted:", {
    danmakuIndex: index,
    reportType: type,
    description: description
  });
  showDanmakuReportDialog.value = false;
};
const playbackRateOptions = playbackRates.map((rate) => ({ label: `${rate}x`, key: rate }));
const volume = ref(0.8);
const isMuted = ref(false);
const showVolumeSlider = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isLeftControlsCompact = ref(false);
const showPauseOverlay = ref(false);

const handleContainerClick = () => {
  if (playerRef.value) {
    if (isPlaying.value) {
      playerRef.value.pause();
    } else {
      playerRef.value.play();
    }
  }
};

// Format time from seconds to mm:ss format
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const checkLeftControlsWidth = () => {
  if (leftControlsRef.value) {
    const width = leftControlsRef.value.offsetWidth;
    isLeftControlsCompact.value = width < 190;
  }
};

// Resolution options
const resolutionOptions = [
  { label: "超清2K", key: "2k" },
  { label: "高清1080P", key: "1080p" },
  { label: "高清720P", key: "720p" },
  { label: "标清540P", key: "540p" },
  { label: "智能", key: "auto" }
];
const currentResolution = ref(resolutionOptions[4].key); // 默认智能

// 全屏切换
const toggleFullscreen = () => {
  if (!playerRef.value) return;

  if (isFullscreen.value) {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  } else {
    // 进入全屏
    const videoElement = playerRef.value.el();
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if ((videoElement as any).webkitRequestFullscreen) {
      (videoElement as any).webkitRequestFullscreen();
    } else if ((videoElement as any).mozRequestFullScreen) {
      (videoElement as any).mozRequestFullScreen();
    } else if ((videoElement as any).msRequestFullscreen) {
      (videoElement as any).msRequestFullscreen();
    }
  }
};

// 监听全屏状态变化
document.addEventListener("fullscreenchange", () => {
  isFullscreen.value = !!document.fullscreenElement;
});
document.addEventListener("webkitfullscreenchange", () => {
  isFullscreen.value = !!(document as any).webkitFullscreenElement;
});
document.addEventListener("mozfullscreenchange", () => {
  isFullscreen.value = !!(document as any).mozFullScreenElement;
});
document.addEventListener("MSFullscreenChange", () => {
  isFullscreen.value = !!(document as any).msFullscreenElement;
});

// 音量控制
const setVolume = (newVolume: number) => {
  volume.value = newVolume;
  if (playerRef.value) {
    playerRef.value.volume(newVolume);
    playerRef.value.muted(false);
    isMuted.value = false;
  }
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  if (playerRef.value) {
    playerRef.value.muted(isMuted.value);
  }
};

// 切换播放速度
const setPlaybackRate = (key: number) => {
  playbackRate.value = key;
  if (playerRef.value) {
    playerRef.value.playbackRate(key);
  }
};

// Custom control methods
const togglePlay = () => {
  if (playerRef.value) {
    if (playerRef.value.paused()) {
      playerRef.value.play();
    } else {
      playerRef.value.pause();
    }
  }
};

const seek = (time: number) => {
  if (playerRef.value) {
    playerRef.value.currentTime(time);
  }
};

const sendDanmaku = (content: string, isImage?: boolean) => {
  if (content) {
    emit("danmaku-send", content, isImage);
  }
};

const toggleAutoplay = () => {
  console.log(isAutoplay.value);
  emit("autoplay-change", isAutoplay.value);
};

const toggleClearScreen = () => {
  console.log(isClearScreen.value);
  emit("clear-screen-change", isClearScreen.value);
};

const toggleDanmaku = () => {
  isDanmakuEnabled.value = !isDanmakuEnabled.value;
  emit("danmaku-toggle", isDanmakuEnabled.value);
};

const handleDanmakuSettingsChange = (settings: any) => {
  console.log("Danmaku settings changed:", settings);
  emit("danmaku-settings-change", settings);
};

const toggleDanmakuList = () => {
  console.log("Toggle danmaku list");
  showDanmakuListDialog.value = true;
};

// Switch resolution
const switchResolution = (key: string) => {
  currentResolution.value = key;
  if (playerRef.value && props.src) {
    // 假设不同分辨率对应不同URL，实际需根据业务逻辑调整
    const newSrc = `${props.src}?resolution=${key}`;
    playerRef.value.src(newSrc);
    playerRef.value.load();
    if (isPlaying.value) {
      playerRef.value.play();
    }
  }
};

const toggleMiniWindow = () => {
  isMiniWindow.value = !isMiniWindow.value;
  if (playerRef.value) {
    if (isMiniWindow.value) {
      // Create mini window
      const miniWindow = document.createElement("div");
      miniWindow.className = "video-mini-window";
      miniWindow.style.position = "fixed";
      miniWindow.style.bottom = "100px";
      miniWindow.style.right = "20px";
      miniWindow.style.width = "320px";
      miniWindow.style.height = "180px";
      miniWindow.style.backgroundColor = "#000";
      miniWindow.style.borderRadius = "8px";
      miniWindow.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.8)";
      miniWindow.style.zIndex = "9999";
      miniWindow.style.cursor = "move";

      // Append player to mini window
      if (videoContainerRef.value) {
        const playerElement = videoContainerRef.value.querySelector(".video-js");
        if (playerElement) {
          miniWindow.appendChild(playerElement);
          document.body.appendChild(miniWindow);

          // Make mini window draggable
          let isDragging = false;
          let startX = 0;
          let startY = 0;

          miniWindow.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.clientX - miniWindow.offsetLeft;
            startY = e.clientY - miniWindow.offsetTop;
          });

          document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            miniWindow.style.left = `${e.clientX - startX}px`;
            miniWindow.style.top = `${e.clientY - startY}px`;
            miniWindow.style.bottom = "auto";
            miniWindow.style.right = "auto";
          });

          document.addEventListener("mouseup", () => {
            isDragging = false;
          });
        }
      }
    } else {
      // Return player to original container
      const miniWindow = document.querySelector(".video-mini-window");
      if (miniWindow && videoContainerRef.value) {
        const playerElement = miniWindow.querySelector(".video-js");
        if (playerElement) {
          videoContainerRef.value.appendChild(playerElement);
          document.body.removeChild(miniWindow);
        }
      }
    }

    // Update player size
    playerRef.value.trigger("resize");
  }
};

// Initialize video.js player
onMounted(() => {
  if (!videoContainerRef.value) return;

  // Create video element
  const videoElement = document.createElement("video");
  videoElement.classList.add("video-js");
  videoElement.classList.add("vjs-big-play-centered");
  videoContainerRef.value.appendChild(videoElement);

  // Validate video source
  if (!props.src) {
    console.error("Video source is required");
    emit("error", { code: "NO_SOURCE", message: "Video source is required" });
    return;
  }

  // Player options
  const options: any = {
    controls: false, // 隐藏自带控制栏
    autoplay: props.autoplay || false,
    muted: props.muted || false,
    loop: props.loop || false,
    preload: props.preload || "metadata", // 使用metadata预加载以提高性能
    poster: props.poster || "",
    sources: [
      {
        src: props.src,
        type: "video/mp4"
      }
    ],
    fluid: true,
    responsive: true,
    language: "zh-CN",
    userActions: {
      hotkeys: true
    }
  };

  try {
    // Initialize player
    const player = videojs(videoElement, options);
    playerRef.value = player;

    // Emit ready event
    emit("ready", player);

    // Event listeners
    player.on("play", () => {
      isPlaying.value = true;
      showPauseOverlay.value = false;
      emit("play");
    });

    player.on("pause", () => {
      isPlaying.value = false;
      showPauseOverlay.value = true;
      emit("pause");
    });

    player.on("ended", () => {
      emit("ended");
    });

    player.on("error", (error: any) => {
      console.error("Video player error:", error);
      emit("error", error);
    });

    player.on("timeupdate", () => {
      const current = player.currentTime() || 0;
      const total = player.duration() || 0;
      currentTime.value = current;
      duration.value = total;
      emit("timeupdate", current, total);
    });

    player.on("volumechange", () => {
      const volume = player.volume() || 0;
      emit("volumechange", volume);
    });

    // 监听视频加载事件
    player.on("loadedmetadata", () => {
      console.log("Video metadata loaded successfully");
    });

    player.on("loadeddata", () => {
      console.log("Video data loaded successfully");
    });

    player.on("waiting", () => {
      console.log("Video waiting for data");
    });

    player.on("stalled", () => {
      console.log("Video playback stalled");
    });
  } catch (error) {
    console.error("Failed to initialize video player:", error);
    emit("error", error);
  }

  checkLeftControlsWidth();
  if (leftControlsRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      checkLeftControlsWidth();
    });
    resizeObserver.observe(leftControlsRef.value);
    onBeforeUnmount(() => {
      resizeObserver.disconnect();
    });
  }
});

// Cleanup
onBeforeUnmount(() => {
  if (playerRef.value) {
    playerRef.value.dispose();
    playerRef.value = null;
  }
});

// Update player when src changes
watch(
  () => props.src,
  (newSrc) => {
    if (playerRef.value) {
      playerRef.value.src(newSrc);
      playerRef.value.load();
    }
  }
);

// Update poster when props changes
watch(
  () => props.poster,
  (newPoster) => {
    if (playerRef.value && newPoster) {
      playerRef.value.poster(newPoster);
    }
  }
);

// Expose player methods
defineExpose({
  play: () => playerRef.value?.play(),
  pause: () => playerRef.value?.pause(),
  togglePlay: () => {
    if (playerRef.value) {
      if (playerRef.value.paused()) {
        playerRef.value.play();
      } else {
        playerRef.value.pause();
      }
    }
  },
  seek: (time: number) => playerRef.value?.currentTime(time),
  setVolume: (volume: number) => playerRef.value?.volume(volume),
  toggleFullscreen: () => playerRef.value?.requestFullscreen(),
  getPlayer: () => playerRef.value
});
</script>

<style scoped lang="scss">
.video-player-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
  position: relative;
  overflow: hidden;
  border-radius: 0;
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 50;
  cursor: pointer;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.pause-icon-container {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 0, 80, 0.9);
  border-radius: 50%;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(255, 0, 80, 0.6);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 40px rgba(255, 0, 80, 0.8);
  }
}

.pause-icon {
  width: 40px;
  height: 40px;
  color: #fff;
}

.video-container {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;

  :deep(.video-js) {
    width: 100%;
    height: 100%;
    font-size: 14px;
    color: #fff;

    .vjs-control-bar {
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      height: 60px;
      padding: 0 12px;
      bottom: 0;
      display: flex;
      align-items: center;
      transition: opacity 0.3s ease;
      border-radius: 0;
    }

    .vjs-play-control {
      width: 40px;
      height: 40px;
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .vjs-progress-control {
      height: 4px;
      margin: 0 10px;
      flex: 1;
      align-self: center;
    }

    .vjs-progress-holder {
      height: 4px;
      border-radius: 2px;
    }

    .vjs-progress-bar {
      height: 4px;
      border-radius: 2px;
    }

    .vjs-play-progress {
      background-color: #ff0050;
    }

    .vjs-load-progress {
      background-color: rgba(255, 255, 255, 0.3);
    }

    .vjs-volume-panel {
      width: auto;
      height: 40px;
      display: flex;
      align-items: center;
      margin-right: 10px;
    }

    .vjs-fullscreen-control {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
    }

    .vjs-current-time-display,
    .vjs-duration-display {
      font-size: 12px;
      line-height: 50px;
      padding: 0 8px;
      min-width: 45px;
      display: inline-flex;
      align-items: center;
    }

    .vjs-remaining-time-display {
      display: none;
    }

    .vjs-big-play-button {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.6);
      border: none;
      transition: all 0.3s ease;
      box-shadow: 0 0 20px rgba(255, 0, 80, 0.5);

      &:hover {
        background-color: rgba(255, 0, 80, 0.9);
        transform: scale(1.15);
        border-color: #ff0050;
        box-shadow: 0 0 30px rgba(255, 0, 80, 0.8);
      }
    }

    // Playback rate button style
    .vjs-playback-rate-menu-button {
      width: auto;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      color: #fff;

      .vjs-playback-rate-value {
        font-size: 12px;
        padding: 0 5px;
      }
    }

    // Ensure all controls are visible
    .vjs-control {
      display: flex !important;
      align-items: center;
      justify-content: center;
      opacity: 1;
    }
  }
}

// Danmaku Controls
.danmaku-controls {
  position: absolute;
  bottom: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
}

.danmaku-toggle-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  backdrop-filter: blur(5px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.danmaku-toggle-container:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.danmaku-toggle-text {
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
}

.danmaku-toggle-switch {
  --n-switch-on-color: #ff0050;
}

.danmaku-settings-container {
  position: relative;
}

.danmaku-settings-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  backdrop-filter: blur(5px);
  cursor: pointer;
  transition: all 0.3s ease;
}

.danmaku-settings-button:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.danmaku-settings-text {
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
}

.danmaku-settings-icon {
  width: 18px;
  height: 18px;
  color: #fff;
}

.danmaku-settings-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 10px;
  padding: 15px;
  background-color: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  width: 280px;
  z-index: 1000;
}

.danmaku-settings-item {
  margin-bottom: 15px;
}

.danmaku-settings-item:last-child {
  margin-bottom: 0;
}

.settings-label {
  display: block;
  color: #fff;
  font-size: 14px;
  margin-bottom: 8px;
}

.settings-slider {
  width: 100%;
  --n-slider-bar-background: rgba(255, 255, 255, 0.3);
  --n-slider-rail-background: rgba(255, 255, 255, 0.1);
  --n-slider-handle-background: #fff;
}

// Progress Bar
.progress-bar-container {
  position: absolute;
  bottom: 38px;
  left: 0;
  width: 100%;
  z-index: 90;
  margin: 0;
  box-sizing: border-box;
  overflow: visible;
}

.progress-bar {
  width: 100% !important;
  height: 2px;
  margin-bottom: 4px;
  margin-left: 0;
  margin-right: 0;
  transition: height 0.2s ease;

  &:hover {
    height: 4px;
  }

  :deep(.n-slider-rail) {
    height: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  :deep(.n-slider-rail__fill) {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 2px;
    transition: background-color 0.2s ease;
  }

  :deep(.n-slider-handle) {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover {
    :deep(.n-slider-rail__fill) {
      background-color: #ff0050;
    }

    :deep(.n-slider-handle) {
      opacity: 1;
    }
  }
}

// Custom Controls
.custom-controls {
  width: 100%;
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-between;
  gap: 8px;
  z-index: 100;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 25px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
  transition: all 0.3s ease;
  max-width: 95vw;
  flex-wrap: nowrap;
  padding: 0 16px;
}

.left-controls {
  display: flex;
  gap: 4px;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: visible;

  :deep(.danmaku-input-container) {
    flex: 1;
    min-width: 40px;
    max-width: 400px;
    flex-shrink: 1;
  }
}

.right-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

// Volume Control
.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.volume-slider-container {
  position: absolute;
  bottom: calc(100% - 2px);
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 120px;
  z-index: 101;
  background-color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);

  :deep(.n-slider) {
    height: 90% !important;
  }
}

.control-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  gap: 6px;
  margin-bottom: 3px;
  padding: 2px 2px;
  border-radius: 18px;
  white-space: nowrap;
  flex-shrink: 0;
}

.control-text {
  font-size: 16px;
  border-radius: 15px;
  transition: all 0.3s ease;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.control-switch {
  transform: scale(0.8);
  --n-switch-button-color: #fff;
  --n-switch-button-color-active: #ff0050;
  --n-switch-background-color: rgba(255, 255, 255, 0.2);
  --n-switch-background-color-active: rgba(255, 0, 80, 0.8);
  transition: all 0.3s ease;
}

.control-switch:hover {
  transform: scale(0.85);
}

.control-icon {
  font-size: 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
}

.iconify-icon {
  font-size: 24px;
  vertical-align: middle;
  color: currentColor;
  width: 24px;
  height: 24px;
}
</style>
