<template>
  <div class="video-player-container" :class="{ paused: !isPlaying }" @click="handleContainerClick">
    <div ref="videoContainerRef" class="video-container"></div>

    <!-- Danmaku Container -->
    <div v-if="danmakuStore.enabled" ref="danmakuContainerRef" class="danmaku-container">
      <div
        v-for="danmaku in activeDanmakus"
        :key="danmaku.id"
        class="danmaku-item danmaku-scroll"
        :style="{
          fontSize: `${danmakuStore.fontSize}px`,
          opacity: danmakuStore.opacity / 100,
          '--speed': danmakuStore.speed,
          top: danmaku.top,
          marginLeft: danmaku.horizontalOffset ? `${danmaku.horizontalOffset}px` : '0px'
        }"
        @mouseenter="showDanmakuActions(danmaku.id)"
        @mouseleave="hideDanmakuActions()"
        @click.stop>
        <span class="danmaku-content">{{ danmaku.content }}</span>
        <div v-if="hoveredDanmakuId === danmaku.id" class="danmaku-actions">
          <span
            class="danmaku-action-btn like-btn"
            :class="{ liked: danmaku.isLiked }"
            @click="toggleDanmakuLike(danmaku.id)"
            title="点赞">
            <i-material-symbols-favorite v-if="danmaku.isLiked" class="iconify-icon" />
            <i-material-symbols-favorite-outline v-else class="iconify-icon" />
          </span>
          <span class="danmaku-action-btn report-btn" @click="openDanmakuReportDialog(danmaku.id)" title="举报">
            <i-mdi-alert-outline class="iconify-icon" />
          </span>
        </div>
      </div>
    </div>

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
          :is-danmaku-enabled="danmakuStore.enabled"
          @send-danmaku="sendDanmaku"
          @toggle-danmaku="toggleDanmaku"
          @toggle-danmaku-list="toggleDanmakuList" />
      </div>

      <!-- Right Controls: All Other Controls -->
      <div class="right-controls">
        <!-- Autoplay Toggle -->
        <div class="control-item">
          <span class="control-text">连播</span>
          <n-switch v-model:value="videoStore.autoplay" @update:value="toggleAutoplay" class="control-switch" />
        </div>

        <!-- Clear Screen Toggle -->
        <div class="control-item">
          <span class="control-text">清屏</span>
          <n-switch v-model:value="videoStore.clearScreen" @update:value="toggleClearScreen" class="control-switch" />
        </div>

        <!-- Resolution Control -->
        <div class="control-item">
          <n-dropdown :options="resolutionOptions" @select="switchResolution">
            <div class="control-icon">{{ videoStore.resolution }}</div>
          </n-dropdown>
        </div>

        <!-- Playback Rate Control -->
        <div class="control-item">
          <n-dropdown :options="playbackRateOptions" @select="setPlaybackRate">
            <div class="control-icon">{{ videoStore.playbackRate }}x</div>
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
              <i-ph-speaker-slash v-if="videoStore.muted || videoStore.volume === 0" class="iconify-icon" />
              <i-ph-speaker-low v-else-if="videoStore.volume / 100 < 0.5" class="iconify-icon" />
              <i-ph-speaker-high v-else class="iconify-icon" />
            </span>
          </div>
          <div
            class="volume-slider-container"
            v-show="showVolumeSlider"
            @mouseenter="showVolumeSlider = true"
            @mouseleave="showVolumeSlider = false">
            <n-slider v-model:value="videoStore.volume" :min="0" :max="100" @update:value="setVolume" vertical />
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
import { useDanmakuStore } from "@/stores/danmaku";
import { useVideoStore } from "@/stores/video";

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

// Danmaku Types
interface Danmaku {
  id: string;
  time: string;
  content: string;
  isLiked: boolean;
  createdAt: number;
  startTime?: number; // Track when the danmaku animation started
  remainingDuration?: number; // Track remaining animation duration when hovered
  top?: string; // 固定的垂直位置
  horizontalOffset?: number; // 水平偏移量，用于避免同时出现的弹幕重叠
}

// Refs
const videoContainerRef = ref<HTMLDivElement | null>(null);
const playerRef = ref<any>(null);
const danmakuContainerRef = ref<HTMLDivElement | null>(null);
const leftControlsRef = ref<HTMLDivElement | null>(null);
const hoveredDanmakuId = ref<string | null>(null);

// States for custom controls
const isMiniWindow = ref(false);
const isPlaying = ref(false);
const isFullscreen = ref(false);
const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

// Danmaku List Dialog
const showDanmakuListDialog = ref(false);
const showDanmakuReportDialog = ref(false);
const selectedDanmakuIndex = ref(-1);
const danmakuList = ref<Danmaku[]>([
  {
    id: "1",
    time: "00:00",
    content: "快跑 这期有脏东西（云耀欧了）",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "2",
    time: "00:00",
    content: "不对劲还我植物大战僵尸",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "3",
    time: "00:00",
    content: "《关于我开盒自己这件事》",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "4",
    time: "00:00",
    content: "我是不是有什么问题",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "5",
    time: "00:00",
    content: "我都没看出来是你自己",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "6",
    time: "00:02",
    content: "云耀，你在吗云耀",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "7",
    time: "00:02",
    content: "现在知道自己多搞笑了吧",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "8",
    time: "00:02",
    content: "云耀：我炸了",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "9",
    time: "00:02",
    content: "你在教我做事？",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "10",
    time: "00:21",
    content: "云耀的小表情太可爱了",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "11",
    time: "00:21",
    content: "节目效果拉满",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "12",
    time: "00:21",
    content: "我笑出眼泪了",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "13",
    time: "00:36",
    content: "这波操作666",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "14",
    time: "00:36",
    content: "主播反应太真实了",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "15",
    time: "00:37",
    content: "我已经截图了",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "16",
    time: "00:40",
    content: "这个视频我看了10遍",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "17",
    time: "00:41",
    content: "弹幕大军来袭",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "18",
    time: "00:42",
    content: "前方高能预警",
    isLiked: true,
    createdAt: Date.now()
  },
  {
    id: "19",
    time: "00:43",
    content: "我来了我来了",
    isLiked: false,
    createdAt: Date.now()
  },
  {
    id: "20",
    time: "00:45",
    content: "打卡打卡",
    isLiked: true,
    createdAt: Date.now()
  }
]);

// Active Danmakus that are currently displayed
const activeDanmakus = ref<Danmaku[]>([]);

// Get danmaku settings from store
const danmakuStore = useDanmakuStore();
const videoStore = useVideoStore();

// Open report dialog
const openDanmakuReportDialog = (arg: number | string) => {
  if (typeof arg === "number") {
    // Called with index (from DanmakuListDialog)
    selectedDanmakuIndex.value = arg;
    showDanmakuReportDialog.value = true;
  } else {
    // Called with danmakuId (string) from video player
    const index = danmakuList.value.findIndex((d) => d.id === arg);
    if (index !== -1) {
      selectedDanmakuIndex.value = index;
      showDanmakuReportDialog.value = true;
    }
  }
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

// Refs to track danmaku timers and display status
const danmakuTimers = new Map<string, NodeJS.Timeout>();
const displayedDanmakuIds = new Set<string>(); // Track which danmakus have been displayed

// Show danmaku actions on hover
const showDanmakuActions = (danmakuId: string) => {
  hoveredDanmakuId.value = danmakuId;

  // Find the danmaku and calculate remaining duration
  const danmaku = activeDanmakus.value.find((d) => d.id === danmakuId);
  if (danmaku && danmaku.startTime) {
    // Get current timer if exists
    const timer = danmakuTimers.get(danmakuId);
    if (timer) {
      // Clear existing timer
      clearTimeout(timer);
      danmakuTimers.delete(danmakuId);

      // Calculate elapsed time and remaining duration
      const elapsed = Date.now() - danmaku.startTime;
      const totalDuration = 16000 / danmakuStore.speed;
      danmaku.remainingDuration = Math.max(0, totalDuration - elapsed);
    }
  }
};

// Hide danmaku actions when not hovering
const hideDanmakuActions = () => {
  const prevHoveredId = hoveredDanmakuId.value;
  hoveredDanmakuId.value = null;

  // If we were hovering over a danmaku, restart its animation timer
  if (prevHoveredId) {
    const danmaku = activeDanmakus.value.find((d) => d.id === prevHoveredId);
    if (danmaku && danmaku.remainingDuration !== undefined && danmaku.remainingDuration > 0) {
      // Set a new timer with remaining duration
      const timer = setTimeout(() => {
        const index = activeDanmakus.value.findIndex((d) => d.id === prevHoveredId);
        if (index !== -1) {
          activeDanmakus.value.splice(index, 1);
        }
        danmakuTimers.delete(prevHoveredId);
      }, danmaku.remainingDuration);

      // Store the timer
      danmakuTimers.set(prevHoveredId, timer);

      // Reset remaining duration as it's now being used
      danmaku.remainingDuration = undefined;
    }
  }
};

// Toggle danmaku like status
const toggleDanmakuLike = (danmakuId: string) => {
  const danmaku = danmakuList.value.find((d) => d.id === danmakuId);
  if (danmaku) {
    danmaku.isLiked = !danmaku.isLiked;
  }

  // Update active danmakus as well
  const activeDanmaku = activeDanmakus.value.find((d) => d.id === danmakuId);
  if (activeDanmaku) {
    activeDanmaku.isLiked = !activeDanmaku.isLiked;
  }
};
const playbackRateOptions = playbackRates.map((rate) => ({ label: `${rate}x`, key: rate }));
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
  videoStore.setVolume(newVolume);
  if (playerRef.value) {
    playerRef.value.volume(newVolume / 100);
  }
};

const toggleMute = () => {
  videoStore.toggleMute();
  if (playerRef.value) {
    playerRef.value.muted(videoStore.muted);
    playerRef.value.volume(videoStore.volume / 100);
  }
};

// 切换播放速度
const setPlaybackRate = (key: number) => {
  videoStore.setPlaybackRate(key);
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

    // Reset danmaku state when seeking
    // Clear displayed danmaku IDs to allow them to be shown again
    displayedDanmakuIds.clear();
    // Clear active danmakus
    activeDanmakus.value = [];
    // Clear danmaku timers
    danmakuTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    danmakuTimers.clear();
    // Reset line management state
    lineDanmakus.clear();
    currentLineIndex.value = 0;
  }
};

const sendDanmaku = (content: string, isImage?: boolean) => {
  if (content) {
    emit("danmaku-send", content, isImage);
  }
};

const toggleAutoplay = (val: boolean) => {
  videoStore.setAutoplay(val);
  emit("autoplay-change", val);
};

const toggleClearScreen = (val: boolean) => {
  videoStore.setClearScreen(val);
  emit("clear-screen-change", val);
};

const toggleDanmaku = () => {
  const newState = !danmakuStore.enabled;
  danmakuStore.setEnabled(newState);
  emit("danmaku-toggle", newState);
};

// Danmaku settings are now managed by the danmakuStore

// Convert time string (mm:ss) to seconds
const timeStringToSeconds = (timeStr: string): number => {
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes * 60 + seconds;
};

// 弹幕行管理，使用轮询方式分配行
const lineHeight = ref<number>(40); // 固定行高，确保足够的垂直间距

// 当前行索引，用于轮询分配行
const currentLineIndex = ref<number>(0);

// 记录每行的活跃弹幕，用于计算水平偏移
const lineDanmakus = new Map<number, Danmaku[]>();

// 更新行高，根据当前字体大小
const updateLineHeight = () => {
  // 固定行高，确保足够的垂直间距，考虑字体大小和行间距
  // 增加行高系数，确保垂直方向有足够的间距，避免重叠
  lineHeight.value = Math.max(45, danmakuStore.fontSize * 3.5);
};

// 获取当前容器的最大行数
const getMaxLines = (): number => {
  const containerHeight = danmakuContainerRef.value?.offsetHeight || 0;

  // 根据displayArea计算最大行数
  let maxLines: number;
  switch (danmakuStore.displayArea) {
    case 1: // 一行
      maxLines = 1;
      break;
    case 2: // 两行
      maxLines = 2;
      break;
    case 3: // 25%
      maxLines = Math.max(1, Math.floor((containerHeight * 0.25) / lineHeight.value));
      break;
    case 4: // 50%
      maxLines = Math.max(1, Math.floor((containerHeight * 0.5) / lineHeight.value));
      break;
    case 5: // 80%
      maxLines = Math.max(1, Math.floor((containerHeight * 0.8) / lineHeight.value));
      break;
    default:
      maxLines = Math.max(1, Math.floor((containerHeight * 0.5) / lineHeight.value));
  }

  // 确保最大行数至少为1
  return Math.max(1, maxLines);
};

// 使用轮询方式分配行，确保弹幕均匀分布
const assignLine = (): number => {
  const maxLines = getMaxLines();
  const lineIndex = currentLineIndex.value;

  // 递增行索引，循环使用
  currentLineIndex.value = (currentLineIndex.value + 1) % maxLines;

  return lineIndex;
};

// 测量弹幕内容的宽度
const measureDanmakuWidth = (content: string): number => {
  // 创建一个临时元素来测量文本宽度
  const tempElement = document.createElement("div");
  tempElement.textContent = content;
  tempElement.style.fontSize = `${danmakuStore.fontSize}px`;
  tempElement.style.position = "absolute";
  tempElement.style.visibility = "hidden";
  tempElement.style.whiteSpace = "nowrap";
  tempElement.style.padding = "4px 8px";
  document.body.appendChild(tempElement);

  const width = tempElement.offsetWidth;
  document.body.removeChild(tempElement);

  return width;
};

// 生成新的弹幕对象，包含固定的垂直位置和水平偏移
const generateDanmaku = (danmaku: Danmaku): Danmaku => {
  // 更新行高
  updateLineHeight();

  // 使用轮询方式分配行
  const targetLineIndex = assignLine();

  // 计算垂直位置，确保足够的垂直间距
  const top = `${targetLineIndex * lineHeight.value}px`;

  // 不再使用累积的偏移量，为每个弹幕生成独立的偏移量
  // 只考虑当前活跃的同一行弹幕，计算水平偏移量
  const currentLineActiveDanmakus = activeDanmakus.value.filter((d) => {
    // 获取当前弹幕的top值，与目标行比较
    const danmakuTop = parseInt(d.top || "0", 10);
    const targetTop = targetLineIndex * lineHeight.value;
    return danmakuTop === targetTop;
  });

  // 计算当前行已占用的总宽度，只考虑当前活跃的弹幕
  const totalWidth = currentLineActiveDanmakus.reduce((sum, d) => {
    return sum + (measureDanmakuWidth(d.content) + 20); // 20px作为弹幕之间的间距
  }, 0);

  // 计算水平偏移量，确保与前一个弹幕有20px的间距
  const horizontalOffset = totalWidth;

  // 不再使用lineDanmakus存储，避免累积偏移量
  // 直接使用activeDanmakus来管理当前活跃的弹幕

  return {
    ...danmaku,
    top, // 存储固定的垂直位置
    horizontalOffset // 存储水平偏移量，用于调整初始位置
  };
};

// Update active danmakus based on current video time
const updateActiveDanmakus = () => {
  if (!playerRef.value || !danmakuStore.enabled) {
    return;
  }

  const currentTime = playerRef.value.currentTime();

  // Process all danmakus to check if they should be displayed now
  danmakuList.value.forEach((danmaku) => {
    const danmakuTime = timeStringToSeconds(danmaku.time);

    // Check if this danmaku should be displayed now
    // The danmaku should be added when current time reaches its time
    // and it hasn't been added yet and hasn't been displayed before
    const isAlreadyActive = activeDanmakus.value.some((d) => d.id === danmaku.id);
    const hasBeenDisplayed = displayedDanmakuIds.has(danmaku.id);

    // Only add if not already active, hasn't been displayed, and current time is within a window of danmaku time
    // Use a 1s window to ensure danmakus appear at the correct time point, increasing tolerance for video playback variations
    // Special handling for 00:00 danmakus to ensure they are displayed
    const timeWindow = 1;
    const isZeroTimeDanmaku = danmakuTime === 0;
    const isWithinTimeWindow = currentTime >= danmakuTime && currentTime - danmakuTime < timeWindow;
    const shouldAdd =
      !isAlreadyActive && !hasBeenDisplayed && (isWithinTimeWindow || (isZeroTimeDanmaku && currentTime < timeWindow));
    if (shouldAdd) {
      const newDanmaku = generateDanmaku(danmaku);
      // Calculate animation duration based on speed from store
      const animationDuration = 12000 / danmakuStore.speed;

      // Add to active danmakus list
      activeDanmakus.value.push(newDanmaku);
      // Mark as displayed to prevent repeat display
      displayedDanmakuIds.add(danmaku.id);

      // Function to set timer for danmaku removal
      const setDanmakuTimer = (danmakuId: string, duration: number) => {
        // Set the start time for this danmaku
        const danmaku = activeDanmakus.value.find((d) => d.id === danmakuId);
        if (danmaku) {
          danmaku.startTime = Date.now();
        }

        // Set a timer to remove the danmaku after specified duration
        const timer = setTimeout(() => {
          // Only remove if not currently hovered
          if (hoveredDanmakuId.value !== danmakuId) {
            const index = activeDanmakus.value.findIndex((d) => d.id === danmakuId);
            if (index !== -1) {
              activeDanmakus.value.splice(index, 1);
            }
            danmakuTimers.delete(danmakuId);
          }
        }, duration);

        // Store the timer reference
        danmakuTimers.set(danmakuId, timer);
      };

      // Initial timer setup
      setDanmakuTimer(newDanmaku.id, animationDuration);
    }
  });

  // No need for cleanup based on time difference anymore
  // We're only adding danmakus at their correct time points and they'll be removed by their own timers
  // Only remove hovered danmakus when they're no longer hovered
  activeDanmakus.value = activeDanmakus.value.filter((danmaku) => {
    // Keep danmaku if:
    // 1. It has a timer (still active), OR
    // 2. It's currently being hovered
    return danmakuTimers.has(danmaku.id) || hoveredDanmakuId.value === danmaku.id;
  });
};

const toggleDanmakuList = () => {
  console.log("Toggle danmaku list");
  showDanmakuListDialog.value = true;
};

// Switch resolution
const switchResolution = (key: string) => {
  videoStore.setResolution(key);
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
    muted: videoStore.muted,
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

    // Set initial volume from videoStore
    player.volume(videoStore.volume / 100);
    player.muted(videoStore.muted);

    // Emit ready event
    emit("ready", player);

    // Event listeners
    player.on("play", () => {
      isPlaying.value = true;
      showPauseOverlay.value = false;
      emit("play");

      // Resume all danmaku timers when video plays
      activeDanmakus.value.forEach((danmaku) => {
        // Only resume if danmaku has remaining duration (was paused)
        if (danmaku.remainingDuration !== undefined && danmaku.remainingDuration > 0) {
          // Set a new timer with remaining duration
          const timer = setTimeout(() => {
            // Only remove if not currently hovered
            if (hoveredDanmakuId.value !== danmaku.id) {
              const index = activeDanmakus.value.findIndex((d) => d.id === danmaku.id);
              if (index !== -1) {
                activeDanmakus.value.splice(index, 1);
              }
              danmakuTimers.delete(danmaku.id);
            }
          }, danmaku.remainingDuration);

          // Store the timer reference
          danmakuTimers.set(danmaku.id, timer);

          // Clear remaining duration since timer is now active
          danmaku.remainingDuration = undefined;
        }
      });
    });

    player.on("pause", () => {
      isPlaying.value = false;
      showPauseOverlay.value = true;
      emit("pause");

      // Pause all danmaku timers when video pauses
      danmakuTimers.forEach((timer, danmakuId) => {
        // Clear the timer
        clearTimeout(timer);
        danmakuTimers.delete(danmakuId);

        // Calculate remaining duration
        const danmaku = activeDanmakus.value.find((d) => d.id === danmakuId);
        if (danmaku && danmaku.startTime) {
          const elapsed = Date.now() - danmaku.startTime;
          const totalDuration = 12000 / danmakuStore.speed;
          danmaku.remainingDuration = Math.max(0, totalDuration - elapsed);
        }
      });
    });

    player.on("ended", () => {
      emit("ended");

      // Reset danmaku state for replaying
      displayedDanmakuIds.clear();
      activeDanmakus.value = [];

      // Clear all danmaku timers
      danmakuTimers.forEach((timer) => {
        clearTimeout(timer);
      });
      danmakuTimers.clear();

      // Reset line management state
      lineDanmakus.clear();
      currentLineIndex.value = 0;
    });

    player.on("error", (error: any) => {
      console.error("Video player error:", error);
      emit("error", error);
    });

    // Track if we've already reset the danmaku state for this play session
    let hasResetThisSession = false;

    player.on("timeupdate", () => {
      const current = player.currentTime() || 0;
      const total = player.duration() || 0;
      currentTime.value = current;
      duration.value = total;
      emit("timeupdate", current, total);

      // Reset danmaku state when video starts playing from the beginning, but only once per session
      if (current < 0.5 && !hasResetThisSession) {
        displayedDanmakuIds.clear();
        activeDanmakus.value = [];

        // Clear all danmaku timers
        danmakuTimers.forEach((timer) => {
          clearTimeout(timer);
        });
        danmakuTimers.clear();

        // Reset line management state
        lineDanmakus.clear();
        currentLineIndex.value = 0;

        // Mark as reset for this session
        hasResetThisSession = true;
      }
      // Reset the flag when video is not at the beginning anymore
      else if (current >= 0.5) {
        hasResetThisSession = false;
      }

      // Update active danmakus based on current time
      updateActiveDanmakus();
    });

    player.on("volumechange", () => {
      const playerVolume = player.volume() || 0;
      const volumeValue = Math.round(playerVolume * 100);
      videoStore.setVolume(volumeValue);
      emit("volumechange", playerVolume);
    });

    // 监听视频加载事件
    player.on("loadedmetadata", () => {
      console.log("Video metadata loaded successfully");
    });

    player.on("loadeddata", () => {
      console.log("Video data loaded successfully");

      // Show 00:00 danmakus immediately when video data is loaded
      // This ensures danmakus appear right when the video starts
      if (playerRef.value) {
        // Reset danmaku state first
        displayedDanmakuIds.clear();
        activeDanmakus.value = [];

        // Clear danmaku timers
        danmakuTimers.forEach((timer) => {
          clearTimeout(timer);
        });
        danmakuTimers.clear();

        // Reset line management state
        lineDanmakus.clear();
        currentLineIndex.value = 0;

        // Process 00:00 danmakus immediately
        danmakuList.value.forEach((danmaku) => {
          const danmakuTime = timeStringToSeconds(danmaku.time);
          if (danmakuTime === 0) {
            const isAlreadyActive = activeDanmakus.value.some((d) => d.id === danmaku.id);
            const hasBeenDisplayed = displayedDanmakuIds.has(danmaku.id);
            if (!isAlreadyActive && !hasBeenDisplayed) {
              const newDanmaku = generateDanmaku(danmaku);
              const animationDuration = 12000 / danmakuStore.speed;

              activeDanmakus.value.push(newDanmaku);
              displayedDanmakuIds.add(danmaku.id);

              const setDanmakuTimer = (danmakuId: string, duration: number) => {
                const danmaku = activeDanmakus.value.find((d) => d.id === danmakuId);
                if (danmaku) {
                  danmaku.startTime = Date.now();
                }

                const timer = setTimeout(() => {
                  if (hoveredDanmakuId.value !== danmakuId) {
                    const index = activeDanmakus.value.findIndex((d) => d.id === danmakuId);
                    if (index !== -1) {
                      activeDanmakus.value.splice(index, 1);
                    }
                    danmakuTimers.delete(danmakuId);
                  }
                }, duration);

                danmakuTimers.set(danmakuId, timer);
              };

              setDanmakuTimer(newDanmaku.id, animationDuration);
            }
          }
        });
      }
    });

    player.on("waiting", () => {
      console.log("Video waiting for data");
    });

    player.on("stalled", () => {
      console.log("Video playback stalled");
    });

    player.on("seeked", () => {
      console.log("Video seeked to new position");

      // Update active danmakus after seeking completes
      // This ensures danmakus at the new time position are displayed
      updateActiveDanmakus();
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

  // Cleanup all danmaku timers to prevent memory leaks
  danmakuTimers.forEach((timer) => {
    clearTimeout(timer);
  });
  danmakuTimers.clear();

  // Clear displayed danmaku IDs to reset for next playback
  displayedDanmakuIds.clear();
});

// Update player when src changes
watch(
  () => props.src,
  (newSrc) => {
    // Clear displayed danmaku IDs when video source changes
    displayedDanmakuIds.clear();
    // Clear active danmakus
    activeDanmakus.value = [];
    // Clear all danmaku timers
    danmakuTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    danmakuTimers.clear();

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

// Danmaku Styles
.danmaku-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 80px);
  pointer-events: none;
  overflow: hidden;
  z-index: 80;
}

.danmaku-item {
  position: absolute;
  white-space: nowrap;
  font-size: 16px;
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  cursor: pointer;
  pointer-events: auto;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  margin: 0;
  line-height: 1.4;
  box-sizing: border-box;
  overflow: visible;
}

.danmaku-item {
  animation-play-state: running;
  transition: animation-play-state 0.1s ease;
}

.danmaku-item:hover {
  background-color: rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
  z-index: 1000 !important;
  animation-play-state: paused !important;
}

.video-player-container.paused .danmaku-item {
  animation-play-state: paused;
}

.danmaku-scroll {
  left: 100%;
  animation: danmaku-scroll linear forwards;
  animation-duration: calc(12s / var(--speed, 1));
  animation-fill-mode: forwards;
  animation-timing-function: linear;
  animation-play-state: running;
}

.danmaku-top,
.danmaku-bottom {
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.3);
  padding: 4px 12px;
  border-radius: 16px;
}

.danmaku-top {
  top: 10px;
}

.danmaku-bottom {
  bottom: 10px;
  top: auto;
}

@keyframes danmaku-scroll {
  from {
    left: 100%; /* Start from outside the right edge */
  }
  to {
    left: -300%; /* Move completely outside the left edge, using a larger value to ensure even long弹幕 disappear */
  }
}

.danmaku-content {
  flex: 1;
  line-height: 1.4;
}

.danmaku-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 2px 8px;
  border-radius: 12px;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.danmaku-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
  color: #ffffff;
}

.like-btn {
  color: #ff0050;
}

.like-btn.liked {
  color: #ff0050;
  animation: heartBeat 0.3s ease;
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.report-btn {
  color: #ffcc00;
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
