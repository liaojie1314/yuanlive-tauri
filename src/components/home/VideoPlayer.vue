<template>
  <context-menu
    class="video-context-wrapper"
    :menu="videoMenuOptions"
    :ignore-teleport="isFullscreen"
    @select="handleMenuSelect">
    <div class="video-player-container" :class="{ paused: !isPlaying }" @click="handleContainerClick">
      <div ref="videoContainerRef" class="video-container"></div>
      <div v-if="isFullscreen" class="exit-fullscreen-btn" @click.stop="toggleFullscreen">
        <i-mdi-chevron-left class="iconify-icon" />
        <span>{{ t("components.videoPlayer.exitFullscreen") }}</span>
      </div>

      <!-- Danmaku Container -->
      <danmaku-player
        ref="danmakuPlayerRef"
        :interactive="true"
        :is-paused="!isPlaying"
        :enable-combo="false"
        @like="toggleDanmakuLike"
        @report="openDanmakuReportDialog" />

      <!-- Right Side Interaction Panel -->
      <div v-if="!videoStore.clearScreen" class="interaction-panel" @click.stop>
        <n-tooltip placement="left" trigger="hover" :raw="true">
          <template #trigger>
            <div class="interaction-item avatar-item" @click="emit('open-panel', 'detail')">
              <div class="avatar-container">
                <img src="https://picsum.photos/60/60" alt="Avatar" class="avatar" />
              </div>
            </div>
          </template>
          <div class="tooltip-content">{{ t("components.videoPlayer.userInfo") }}</div>
        </n-tooltip>

        <n-tooltip placement="left" trigger="hover" :raw="true">
          <template #trigger>
            <div class="interaction-item like-item" @click="toggleLike">
              <div class="interaction-icon like-icon" :class="{ liked: isLiked }">
                <i-material-symbols-favorite class="iconify-icon" />
              </div>
              <div class="interaction-count">{{ likeCount }}</div>
            </div>
          </template>
          <div class="tooltip-content">{{ t("components.videoPlayer.like") }}</div>
        </n-tooltip>

        <n-tooltip placement="left" trigger="hover" :raw="true">
          <template #trigger>
            <div class="interaction-item comment-item" @click="emit('open-panel', 'comment')">
              <div class="interaction-icon comment-icon">
                <i-material-symbols-chat-outline class="iconify-icon" />
              </div>
              <div class="interaction-count">{{ commentCount }}</div>
            </div>
          </template>
          <div class="tooltip-content">{{ t("components.videoPlayer.comment") }}</div>
        </n-tooltip>

        <n-tooltip
          placement="left"
          trigger="hover"
          v-model:show="showCollectionTooltip"
          :raw="true"
          :show-arrow="false">
          <template #trigger>
            <div class="interaction-item favorite-item" @click="toggleFavorite">
              <div class="interaction-icon favorite-icon" :class="{ favorited: isFavorited }">
                <i-material-symbols-star class="iconify-icon" />
              </div>
              <div class="interaction-count">{{ favoriteCount }}</div>
            </div>
          </template>

          <div class="collection-tooltip">
            <div class="collection-header">
              <span>{{ t("components.videoPlayer.collectionFolder") }}</span>
              <div class="new-folder-btn" @click="onNewFolderClick">+ {{ t("components.videoPlayer.newFolder") }}</div>
            </div>
            <div v-if="collectionFolders.length === 0" class="no-collections">
              <div class="no-collections-icon">
                <i-material-symbols-folder-outline class="iconify-icon" />
              </div>
              <div class="no-collections-text">{{ t("components.videoPlayer.noCollections") }}</div>
            </div>
            <div v-else class="collection-list">
              <div v-for="folder in collectionFolders" class="collection-item" :key="folder.id">
                <div class="folder-info">
                  <i-material-symbols-folder class="iconify-icon folder-icon" />
                  <div class="folder-name">{{ folder.name }}</div>
                  <div class="folder-count">{{ folder.count }}</div>
                </div>
                <n-checkbox
                  class="square-checkbox"
                  v-model:checked="folder.isSelected"
                  @update:checked="updateSelectedFolder(folder.id, $event)" />
              </div>
            </div>

            <div class="collection-footer">
              <div class="footer-btn only-collect-btn" @click="onlyCollectVideo">
                {{ t("components.videoPlayer.onlyCollectVideo") }}
              </div>
              <div class="footer-btn collect-to-folder-btn" @click="collectToFolder">
                {{ t("components.videoPlayer.collectToFolder") }}
              </div>
            </div>
          </div>
        </n-tooltip>

        <n-tooltip placement="left" trigger="hover" v-model:show="showShareTooltip" :raw="true" :show-arrow="false">
          <template #trigger>
            <div class="interaction-item share-item" @click="toggleShare">
              <div class="interaction-icon share-icon">
                <i-material-symbols-share-outline class="iconify-icon" />
              </div>
              <div class="interaction-count">{{ shareCount }}</div>
            </div>
          </template>
          <div class="share-tooltip">
            <div class="share-btn copy-link-btn" @click="copyLink">
              <i-material-symbols-link class="iconify-icon share-btn-icon" />
              <span class="share-btn-text">{{ t("components.videoPlayer.copyLink") }}</span>
            </div>
            <div class="share-btn download-btn" @click="downloadVideo">
              <template v-if="isDownloading">
                <i-mdi-loading class="iconify-icon share-btn-icon animate-spin" />
                <span class="share-btn-text ml-2">{{ downloadProcess }}%</span>
              </template>
              <template v-else>
                <i-material-symbols-download class="iconify-icon share-btn-icon" />
              </template>
            </div>
            <div class="share-btn qr-code-btn" @click="showQRCode">
              <i-material-symbols-qr-code class="iconify-icon share-btn-icon" />
            </div>
          </div>
        </n-tooltip>

        <n-tooltip placement="left" trigger="hover" :raw="true">
          <template #trigger>
            <div class="interaction-item listen-item" @click="toggleShare">
              <div class="interaction-icon listen-icon">
                <i-material-symbols-headphones class="iconify-icon" />
              </div>
              <div class="interaction-count">{{ t("components.videoPlayer.listenVideo") }}</div>
            </div>
          </template>
          <div class="tooltip-content">{{ t("components.videoPlayer.listenVideo") }}</div>
        </n-tooltip>

        <n-tooltip placement="left-end" trigger="hover" v-model:show="showMoreTooltip" :raw="true" :show-arrow="false">
          <template #trigger>
            <div class="more-item" @click="toggleMoreOptions">
              <div class="more-icon">
                <i-material-symbols-more-horiz class="iconify-icon more-icon" />
              </div>
            </div>
          </template>
          <div class="more-tooltip">
            <button class="more-btn recommend-btn" @click="recommendVideo">
              <div class="more-btn-icon-container">
                <i-material-symbols-thumb-up class="iconify-icon more-btn-icon" />
              </div>
              <span class="more-btn-text">{{ t("components.videoPlayer.recommend") }}</span>
            </button>

            <button class="more-btn dislike-btn" @click="dislikeVideo">
              <div class="more-btn-icon-container">
                <i-material-symbols-thumb-down class="iconify-icon more-btn-icon" />
              </div>
              <span class="more-btn-text">{{ t("components.videoPlayer.dislike") }}</span>
            </button>
            <button class="more-btn unfollow-btn" @click="toggleFollow">
              <div class="more-btn-icon-container">
                <i-material-symbols-person-remove v-if="isFollowed" class="iconify-icon more-btn-icon" />
                <i-material-symbols-person-add v-else class="iconify-icon more-btn-icon" />
              </div>
              <span class="more-btn-text">{{ t("components.videoPlayer.unfollow") }}</span>
            </button>

            <button class="more-btn report-btn" @click="reportVideo">
              <div class="more-btn-icon-container">
                <i-material-symbols-warning class="iconify-icon more-btn-icon" />
              </div>
              <span class="more-btn-text">{{ t("components.videoPlayer.report") }}</span>
            </button>

            <button class="more-btn shortcuts-btn" @click="showShortcuts">
              <div class="more-btn-icon-container">
                <i-material-symbols-keyboard class="iconify-icon more-btn-icon" />
              </div>
              <span class="more-btn-text">{{ t("components.videoPlayer.shortcuts") }}</span>
            </button>
          </div>
        </n-tooltip>
      </div>

      <!-- Center Pause Icon -->
      <div v-if="showPauseOverlay" class="pause-overlay" @click.stop="togglePlay">
        <div class="pause-icon-container">
          <i-material-symbols-play-arrow-rounded class="pause-icon" />
        </div>
      </div>

      <!-- Progress Bar -->
      <div
        v-show="showChapterPanel"
        style="bottom: 155px"
        class="absolute left-4 z-[130] flex max-h-[300px] w-[220px] flex-col overflow-hidden rounded-xl border border-[var(--line-color)] bg-[var(--bg-popover)] shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-300"
        @click.stop>
        <div
          class="flex shrink-0 items-center justify-between border-b border-[var(--line-color)] bg-[var(--bg-setting-item)] px-3 py-2.5">
          <span class="text-[13px] font-medium tracking-wide text-[var(--text-color)]">
            {{ t("components.videoPlayer.videoChapters") }} ({{ computedChapters.length }})
          </span>
          <i-mdi-close
            class="cursor-pointer text-[16px] text-[var(--user-text-color)] transition-colors hover:text-[#ff0050]"
            @click="showChapterPanel = false" />
        </div>

        <n-scrollbar class="flex-1">
          <div class="flex flex-col gap-0.5 p-1.5">
            <div
              v-for="(chap, index) in computedChapters"
              class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 transition-all duration-200"
              :key="index"
              :class="
                currentChapterIndex === index ? 'bg-[var(--bg-setting-item)]' : 'hover:bg-[var(--bg-left-menu-hover)]'
              "
              @click="selectChapter(chap)">
              <div
                class="shrink-0 font-mono text-[12px]"
                :class="currentChapterIndex === index ? 'text-[#ff0050]' : 'text-[var(--user-text-color)]'">
                {{ formatSecondsToTimeStr(chap.startTime) }}
              </div>
              <div
                class="flex-1 truncate text-[12px] leading-snug"
                :class="currentChapterIndex === index ? 'font-medium text-[#ff0050]' : 'text-[var(--text-color)]'">
                {{ chap.title }}
              </div>
              <div v-if="currentChapterIndex === index" class="flex shrink-0 items-center justify-center">
                <i-mdi-chart-bar class="animate-pulse text-[14px] text-[#ff0050]" />
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>

      <div
        v-if="computedChapters.length > 1 && currentChapter"
        style="bottom: 115px"
        class="pointer-events-auto absolute left-4 z-[100] flex-y-center overflow-hidden rounded-full border border-[var(--line-color)] bg-[var(--bg-popover)] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors">
        <div
          class="group/chapter flex cursor-pointer items-center rounded-l-full px-3 py-1.5 transition-colors"
          :class="showChapterPanel ? 'bg-[var(--bg-left-menu-hover)]' : 'hover:bg-[var(--bg-left-menu-hover)]'"
          :title="t('components.videoPlayer.viewAllChapters')"
          @click.stop="showChapterPanel = !showChapterPanel">
          <i-mdi-format-list-bulleted
            class="mr-1.5 text-[15px] transition-colors"
            :class="
              showChapterPanel ? 'text-[#ff0050]' : 'text-[var(--user-text-color)] group-hover/chapter:text-[#ff0050]'
            " />
          <span
            class="max-w-[120px] truncate text-[12px] font-medium transition-colors"
            :class="
              showChapterPanel ? 'text-[#ff0050]' : 'text-[var(--text-color)] group-hover/chapter:text-[#ff0050]'
            ">
            {{ currentChapter.title }}
          </span>
          <i-mdi-chevron-up
            class="ml-0.5 text-[16px] transition-transform duration-300"
            :class="
              showChapterPanel
                ? 'rotate-180 text-[#ff0050]'
                : 'text-[var(--user-text-color)] group-hover/chapter:text-[#ff0050]'
            " />
        </div>

        <template v-if="nextChapter">
          <div class="h-[12px] w-[1px] bg-[var(--line-color)]"></div>
          <div
            class="group/next flex cursor-pointer items-center rounded-r-full px-3 py-1.5 text-[12px] text-[var(--user-text-color)] transition-colors hover:bg-[var(--bg-left-menu-hover)] hover:text-[var(--text-color)]"
            :title="t('components.videoPlayer.jumpToNextChapter')"
            @click.stop="jumpToNextChapter">
            <span>{{ t("components.videoPlayer.nextChapter") }}</span>
            <i-mdi-chevron-right class="text-[15px] transition-transform group-hover/next:translate-x-0.5" />
          </div>
        </template>
      </div>

      <div
        ref="progressContainerRef"
        class="progress-bar-container group"
        @click.stop
        @mouseenter="hoveringProgress = true"
        @mouseleave="hoveringProgress = false"
        @mousemove="handleProgressMouseMove">
        <div
          v-show="hoveringProgress"
          class="pointer-events-none absolute bottom-full z-[120] mb-2 flex -translate-x-1/2 transform flex-col items-center rounded-[6px] border border-[var(--line-color)] bg-[var(--bg-popover)] px-3 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-opacity duration-200"
          :style="{ left: hoverX + 'px' }">
          <span v-if="hoverChapterTitle" class="mb-0.5 text-[12px] font-bold whitespace-nowrap text-[#ff0050]">
            {{ hoverChapterTitle }}
          </span>
          <span class="font-mono text-[12px] leading-none text-[var(--text-color)]">
            {{ formatSecondsToTimeStr(hoverTime) }}
          </span>
        </div>

        <div
          class="pointer-events-none absolute top-1/2 z-10 flex h-[3px] w-full -translate-y-1/2 transform gap-[2px] transition-all duration-200 group-hover:h-[4px]">
          <div
            v-for="(chap, index) in computedChapters"
            class="relative h-full overflow-hidden rounded-[2px] bg-[rgba(255,255,255,0.2)]"
            :key="index"
            :style="{ width: chap.durationRatio * 100 + '%' }">
            <div
              class="absolute top-0 left-0 h-full rounded-[2px] bg-[#ff0050]"
              :style="{ width: getChapterPlayedRatio(chap) * 100 + '%' }"></div>
          </div>
        </div>

        <n-slider
          class="progress-bar-slider z-20"
          v-model:value="currentTime"
          :max="duration"
          :step="0.1"
          :tooltip="false"
          :show-input="false"
          :show-tooltip="false"
          @update:value="seek">
          <template #thumb>
            <div
              class="custom-thumb-icon flex -translate-y-[1px] scale-100 items-center justify-center transition-transform duration-200 group-hover:scale-[1.2]">
              <i-mdi-cat class="text-[20px] text-[#ff0050] drop-shadow-[0_0_4px_rgba(255,0,80,0.6)] filter" />
            </div>
          </template>
        </n-slider>
      </div>

      <!-- Custom Controls -->
      <div class="custom-controls" @click.stop>
        <!-- Left Controls: Play Button and Progress -->
        <div v-resize="checkLeftControlsWidth" class="left-controls">
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
              {{ formatSecondsToTimeStr(currentTime) }}
              <span v-if="!isLeftControlsCompact">/ {{ formatSecondsToTimeStr(duration) }}</span>
            </span>
          </div>

          <!-- Danmaku Input -->
          <danmaku-input
            class="control-item"
            :is-danmaku-enabled="danmakuStore.settings.enabled"
            @send-danmaku="sendDanmaku"
            @toggle-danmaku="toggleDanmaku"
            @toggle-danmaku-list="toggleDanmakuList" />
        </div>

        <div class="right-controls">
          <div v-show="!isPanelOpen || isFullscreen" class="control-item">
            <span class="control-text">{{ t("components.videoPlayer.autoplay") }}</span>
            <n-switch class="control-switch" v-model:value="videoStore.autoplay" @update:value="toggleAutoplay" />
          </div>
          <div v-show="!isPanelOpen || isFullscreen" class="control-item">
            <span class="control-text">{{ t("components.videoPlayer.clearScreen") }}</span>
            <n-switch class="control-switch" v-model:value="videoStore.clearScreen" @update:value="toggleClearScreen" />
          </div>
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
          <div class="control-item volume-control" @wheel.prevent="handleWheelVolume">
            <div @click="toggleMute" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
              <span class="control-icon">
                <i-ph-speaker-slash v-if="videoStore.muted || videoStore.volume === 0" class="iconify-icon" />
                <i-ph-speaker-low v-else-if="videoStore.volume / 100 < 0.5" class="iconify-icon" />
                <i-ph-speaker-high v-else class="iconify-icon" />
              </span>
            </div>

            <div
              v-show="showVolumeSlider"
              class="volume-slider-container"
              @mouseenter="showVolumeSlider = true"
              @mouseleave="showVolumeSlider = false">
              <n-slider vertical v-model:value="videoStore.volume" :min="0" :max="100" @update:value="setVolume" />
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
  </context-menu>

  <danmaku-list-dialog
    v-model:show="showDanmakuListDialog"
    :danmaku-list="danmakuList"
    @open-report="openDanmakuReportDialog" />

  <danmaku-report-dialog
    v-model:show="showDanmakuReportDialog"
    :danmaku-index="selectedDanmakuIndex"
    @submit-report="handleDanmakuReport" />

  <video-report-dialog
    v-model:show="showVideoReportDialog"
    :video-id="playlistStore.currentVideo?.id"
    @submit-report="handleVideoReport" />

  <collection-folder-dialog v-model:show="showNewFolderDialog" @create-folder="handleCreateFolder" />

  <shortcuts-dialog v-model:show="showShortcutsDialog" v-model="shortcutStore.shortcuts" @save="handleSaveShortcuts" />
</template>

<script setup lang="ts">
import videojs from "video.js";
import { useI18n } from "vue-i18n";
import "video.js/dist/video-js.css";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

import { useDownload } from "@/hooks/useDownload";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useVideoStore } from "@/stores/video";
import { useDanmakuStore } from "@/stores/danmaku";
import { usePlaylistStore } from "@/stores/playlist";
import { useShortcutStore, type ShortcutConfig } from "@/stores/shortcut";
import { formatSecondsToTimeStr } from "@/utils/FormattingUtils";
import { unfollowApi } from "@/api/follow";
import { cancelLikeVideoApi, likeVideoApi, recommendVideoApi, unlikeVideoApi } from "@/api/video";

const { t } = useI18n();
const { isFullscreen } = useFullscreen();
const shortcutStore = useShortcutStore();
const playlistStore = usePlaylistStore();
const danmakuStore = useDanmakuStore();
const videoStore = useVideoStore();
const { downloadFile, cancelDownload, process: downloadProcess, isDownloading, onLoaded } = useDownload();

const props = defineProps<{
  poster?: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: "none" | "metadata" | "auto";
  isPanelOpen?: boolean;
}>();

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
  (e: "open-panel", tab: "detail" | "comment"): void;
  (e: "toggle-fullscreen"): void;
}>();

interface Danmaku {
  id: string;
  time: string;
  content: string;
  isLiked: boolean;
  createdAt: number;
  type?: "scroll" | "top" | "bottom";
}

let unFollowing = false;
const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const playbackRateOptions = playbackRates.map((rate) => ({ label: `${rate}x`, key: rate }));
const displayedDanmakuIds = new Set<string>();
const eventListeners = new Map<string, (event: Event) => void>();

const isFollowed = ref(true);
const videoContainerRef = ref<HTMLDivElement | null>(null);
const playerRef = ref<any>(null);
const isMiniWindow = ref(false);
const isPlaying = ref(false);
// 进度条容器引用
const progressContainerRef = ref<HTMLElement | null>(null);
// 模拟视频章节数据
const chapters = ref([
  { startTime: 0, title: "开场介绍" },
  { startTime: 10, title: "高能预警名场面" },
  { startTime: 20, title: "核心原理解析" },
  { startTime: 30, title: "片尾感谢与彩蛋" }
]);
// 进度条 Hover 预览状态
const hoveringProgress = ref(false);
const showChapterPanel = ref(false);
const hoverX = ref(0);
const hoverTime = ref(0);
const hoverChapterTitle = ref("");
// 交互状态
const isLiked = ref(false);
const likeCount = ref(0);
const commentCount = ref(0);
const isFavorited = ref(false);
const favoriteCount = ref(0);
const shareCount = ref(0);
// 收藏夹状态
const showCollectionTooltip = ref(false);
const collectionFolders = ref([{ id: 1, name: "12", count: 0, isSelected: true }]);
const showNewFolderDialog = ref(false);
const selectedFolderId = ref<number | null>(1);
// 分享状态
const showShareTooltip = ref(false);
// 更多操作状态
const showMoreTooltip = ref(false);
// 弹幕列表状态
const danmakuPlayerRef = ref<any>(null);
const showDanmakuListDialog = ref(false);
const showDanmakuReportDialog = ref(false);
const showVideoReportDialog = ref(false);
const selectedDanmakuIndex = ref(-1);
const showShortcutsDialog = ref(false);
const danmakuList = ref<Danmaku[]>([
  // 0秒：常规滚动开场
  { id: "1", time: "00:00", content: "前方高能，请带好护目镜！", isLiked: true, createdAt: Date.now(), type: "scroll" },
  { id: "2", time: "00:00", content: "第一第一第一", isLiked: false, createdAt: Date.now(), type: "scroll" },

  // 1秒：测试顶部和底部专属悬停轨道
  {
    id: "3",
    time: "00:01",
    content: "【顶部】颜表立！红红火火恍恍惚惚",
    isLiked: true,
    createdAt: Date.now(),
    type: "top"
  },
  {
    id: "4",
    time: "00:01",
    content: "【底部】空降指挥部在此！",
    isLiked: false,
    createdAt: Date.now(),
    type: "bottom"
  },

  // 2秒：测试同屏 Combo 合并功能 (相同时间、相同文本、密集出现) -> 屏幕上只会显示一条，旁边出现 "x6"
  { id: "5", time: "00:02", content: "哈哈哈哈哈哈", isLiked: false, createdAt: Date.now(), type: "scroll" },
  { id: "6", time: "00:02", content: "哈哈哈哈哈哈", isLiked: false, createdAt: Date.now(), type: "scroll" },
  { id: "7", time: "00:02", content: "哈哈哈哈哈哈", isLiked: false, createdAt: Date.now(), type: "scroll" },
  { id: "8", time: "00:02", content: "哈哈哈哈哈哈", isLiked: true, createdAt: Date.now(), type: "scroll" },
  { id: "9", time: "00:02", content: "哈哈哈哈哈哈", isLiked: false, createdAt: Date.now(), type: "scroll" },
  { id: "10", time: "00:02", content: "哈哈哈哈哈哈", isLiked: false, createdAt: Date.now(), type: "scroll" },

  // 3秒：测试顶部弹幕的 Combo 合并
  { id: "11", time: "00:03", content: "绝了！", isLiked: true, createdAt: Date.now(), type: "top" },
  { id: "12", time: "00:03", content: "绝了！", isLiked: false, createdAt: Date.now(), type: "top" },
  { id: "13", time: "00:03", content: "绝了！", isLiked: false, createdAt: Date.now(), type: "top" },

  // 4秒：混合穿插
  { id: "14", time: "00:04", content: "主播反应太真实了", isLiked: true, createdAt: Date.now(), type: "scroll" },
  { id: "15", time: "00:04", content: "我已经截图了", isLiked: false, createdAt: Date.now(), type: "bottom" }
]);
const showVolumeSlider = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isLeftControlsCompact = ref(false);
const showPauseOverlay = ref(false);
const videoMenuOptions = computed(() => [
  { label: t("components.videoPlayer.menu.playPause"), action: "play-pause" },
  { label: t("components.videoPlayer.menu.watchLater"), action: "watch-later" },
  { label: t("components.videoPlayer.menu.mute"), action: "mute" },
  { label: t("components.videoPlayer.menu.pip"), action: "pip" },
  { label: t("components.videoPlayer.menu.fullscreen"), action: "fullscreen" }
]);
const resolutionOptions = computed(() => [
  { label: t("components.videoPlayer.resolution.2k"), key: "2k" },
  { label: t("components.videoPlayer.resolution.1080p"), key: "1080p" },
  { label: t("components.videoPlayer.resolution.720p"), key: "720p" },
  { label: t("components.videoPlayer.resolution.540p"), key: "540p" },
  { label: t("components.videoPlayer.resolution.auto"), key: "auto" }
]);
// 动态计算每个章节的占比和结束时间
const computedChapters = computed(() => {
  // 如果没有章节数据，就生成一个占满全长的默认章节
  if (!duration.value || chapters.value.length === 0) {
    return [{ startTime: 0, endTime: Math.max(duration.value, 1), title: "", durationRatio: 1 }];
  }
  return chapters.value.map((chap, index) => {
    const endTime = index < chapters.value.length - 1 ? chapters.value[index + 1].startTime : duration.value;
    const validDuration = duration.value > 0 ? duration.value : 1;
    return {
      ...chap,
      endTime,
      durationRatio: Math.max(0, (endTime - chap.startTime) / validDuration)
    };
  });
});

// 计算当前处于哪个章节索引
const currentChapterIndex = computed(() => {
  if (computedChapters.value.length <= 1) return -1;
  const index = computedChapters.value.findIndex(
    (c) => currentTime.value >= c.startTime && currentTime.value < c.endTime
  );
  return index !== -1 ? index : computedChapters.value.length - 1;
});

// 获取当前章节数据
const currentChapter = computed(() => {
  if (currentChapterIndex.value === -1) return null;
  return computedChapters.value[currentChapterIndex.value];
});

// 获取下一章节数据
const nextChapter = computed(() => {
  if (currentChapterIndex.value === -1 || currentChapterIndex.value >= computedChapters.value.length - 1) return null;
  return computedChapters.value[currentChapterIndex.value + 1];
});

/**
 * 在章节列表中选择某个章节
 * @param chap 要选择的章节数据对象
 */
const selectChapter = (chap: any) => {
  if (playerRef.value) {
    seek(chap.startTime);
    if (!isPlaying.value) togglePlay();
    showChapterPanel.value = false; // 跳转后自动关闭面板
  }
};

/** 执行跳转到下一章 */
const jumpToNextChapter = () => {
  if (nextChapter.value && playerRef.value) {
    seek(nextChapter.value.startTime);
    if (!isPlaying.value) togglePlay();
  }
};

/**
 * 计算某个章节内部的已播放进度 (0% - 100%)
 * @param chap 章节数据对象
 * @returns 已播放进度比例 (0-1之间的浮点数)
 */
const getChapterPlayedRatio = (chap: any) => {
  if (currentTime.value <= chap.startTime) return 0;
  if (currentTime.value >= chap.endTime) return 1;
  const range = chap.endTime - chap.startTime;
  return range > 0 ? (currentTime.value - chap.startTime) / range : 0;
};

/**
 * 处理鼠标在进度条上移动，计算悬浮时间和章节
 * @param e 鼠标移动事件对象
 */
const handleProgressMouseMove = (e: MouseEvent) => {
  if (!progressContainerRef.value || duration.value === 0) return;
  const rect = progressContainerRef.value.getBoundingClientRect();
  let percent = (e.clientX - rect.left) / rect.width;
  percent = Math.max(0, Math.min(1, percent)); // 限制在 0-1 之间

  hoverX.value = percent * rect.width;
  hoverTime.value = percent * duration.value;

  // 找到当前悬停的章节
  const chap = computedChapters.value.find((c) => hoverTime.value >= c.startTime && hoverTime.value < c.endTime);
  hoverChapterTitle.value = chap?.title || "";
};

/**
 * 局部快捷键分发中心
 * @param e 键盘事件对象
 */
const handleShortcutKeyDown = (e: KeyboardEvent) => {
  // 如果焦点在输入框（输入弹幕或评论），绝对不触发快捷键！
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
    return;
  }

  // 如果按键设置弹窗开着，也不触发播放器的快捷键
  if (showShortcutsDialog.value) return;

  // 将当前按键转为配置表中对应的格式
  let currentKey = e.key.toUpperCase();

  if (e.code === "Space") {
    currentKey = "Space";
  }
  // 1. 修复方向键：保持原生驼峰大小写，不转大写
  else if (e.key.startsWith("Arrow")) {
    currentKey = e.key;
  }
  // 2. 修复音量加：匹配纯 '+' 号，或者 Shift + '='
  else if (e.key === "+" || (e.shiftKey && e.key === "=")) {
    currentKey = "Shift+";
  }
  // 3. 修复音量减：匹配纯 '_' 号，或者 Shift + '-'
  else if (e.key === "_" || (e.shiftKey && e.key === "-")) {
    currentKey = "Shift-";
  }

  const config = shortcutStore.shortcuts;

  // 根据匹配到的按键执行对应逻辑
  switch (currentKey) {
    case config.like:
      e.preventDefault();
      toggleLike();
      break;
    case config.favorite:
      e.preventDefault();
      toggleFavorite();
      break;
    case config.follow:
      e.preventDefault();
      toggleFollow();
      break;
    case config.profile:
      e.preventDefault();
      emit("open-panel", "detail");
      break;
    case config.comment:
      e.preventDefault();
      emit("open-panel", "comment");
      break;
    case config.copyLink:
      e.preventDefault();
      copyLink();
      break;
    case config.recommend:
      e.preventDefault();
      recommendVideo();
      break;
    case config.dislike:
      e.preventDefault();
      dislikeVideo();
      break;
    case config.toggleDanmaku:
      e.preventDefault();
      toggleDanmaku();
      break;
    case config.clearScreen:
      e.preventDefault();
      toggleClearScreen(!videoStore.clearScreen);
      break;
    case config.autoPlay:
      e.preventDefault();
      toggleAutoplay(!videoStore.autoplay);
      break;
    case config.fullscreen:
      e.preventDefault();
      toggleFullscreen();
      break;
    case config.miniWindow:
      e.preventDefault();
      toggleMiniWindow();
      break;
    case config.playPause:
      e.preventDefault();
      togglePlay();
      break;
    case config.watchLater:
      e.preventDefault();
      watchLater();
      break;
    case config.volumeUp:
      e.preventDefault();
      // 音量每次增加 5%，最大不超过 100%
      setVolume(Math.min(100, videoStore.volume + 5));
      // 如果之前是静音状态，调大音量时自动取消静音
      if (videoStore.muted && videoStore.volume > 0) {
        toggleMute();
      }
      break;
    case config.volumeDown:
      e.preventDefault();
      // 音量每次减少 5%，最小不低于 0%
      setVolume(Math.max(0, videoStore.volume - 5));
      break;
    case config.forward:
      e.preventDefault();
      if (playerRef.value) {
        // 快进 5 秒，不超过视频总时长
        seek(Math.min(duration.value, currentTime.value + 5));
      }
      break;
    case config.backward:
      e.preventDefault();
      if (playerRef.value) {
        // 后退 5 秒，不低于 0 秒
        seek(Math.max(0, currentTime.value - 5));
      }
      break;
    case config.pageDown:
      // 播放下一个视频
      playlistStore.playNext();
      e.preventDefault();
      break;
    case config.pageUp:
      e.preventDefault();
      // 播放上一个视频 (检查是否已经是第一个)
      if (playlistStore.currentVideoIndex > 0) {
        playlistStore.currentVideoIndex--;
      } else {
        window.$message?.info(t("components.videoPlayer.msg.alreadyFirstVideo"));
      }
      break;
  }
};

/**
 * 处理保存快捷键配置
 * @param newConfig 新的快捷键配置对象
 */
const handleSaveShortcuts = (newConfig: ShortcutConfig) => {
  shortcutStore.shortcuts = newConfig;
  window.$message?.success(t("components.videoPlayer.msg.shortcutsSaveSuccess"));
};

/** 打开快捷键弹窗 */
const showShortcuts = () => {
  showMoreTooltip.value = false;
  showShortcutsDialog.value = true;
};

/**
 * 处理右键菜单项的点击事件
 * @param item 右键菜单项对象，包含 label 和 action 属性
 */
const handleMenuSelect = (item: any) => {
  // item 就是我们在 videoMenuOptions 中定义的对象
  switch (item.action) {
    case "play-pause":
      togglePlay();
      break;
    case "watch-later":
      watchLater();
      break;
    case "mute":
      toggleMute();
      break;
    case "pip":
      toggleMiniWindow();
      break;
    case "fullscreen":
      toggleFullscreen();
      break;
  }
};

/** 添加到稍后再看列表 */
const watchLater = () => {
  // TODO
};

/**
 * 打开弹幕举报对话框
 * @param arg 弹幕索引或弹幕ID
 */
const openDanmakuReportDialog = (arg: number | string) => {
  if (typeof arg === "number") {
    selectedDanmakuIndex.value = arg;
    showDanmakuReportDialog.value = true;
  } else {
    const index = danmakuList.value.findIndex((d) => d.id === arg);
    if (index !== -1) {
      selectedDanmakuIndex.value = index;
      showDanmakuReportDialog.value = true;
    }
  }
};

/**
 * 处理弹幕举报
 * @param index 弹幕索引
 * @param type 报告类型
 * @param description 报告描述
 */
const handleDanmakuReport = (index: number, type: string, description: string) => {
  console.log("Report submitted:", {
    danmakuIndex: index,
    reportType: type,
    description: description
  });
  showDanmakuReportDialog.value = false;
};

/**
 * 处理视频举报
 * @param videoId 视频id
 * @param type 报告类型
 * @param description 报告描述
 */
const handleVideoReport = (videoId: string | number, type: string, description: string) => {
  console.log("Report submitted:", {
    videoIndex: videoId,
    reportType: type,
    description: description
  });
  showVideoReportDialog.value = false;
};

/**
 * 切换弹幕点赞状态
 * @param danmakuId 弹幕ID
 */
const toggleDanmakuLike = (danmakuId: string | number) => {
  const danmaku = danmakuList.value.find((d) => d.id === danmakuId);
  if (danmaku) {
    danmaku.isLiked = !danmaku.isLiked;
  }
};

/** 更新当前活跃的弹幕列表 */
const updateActiveDanmakus = () => {
  if (!playerRef.value || !danmakuStore.settings.enabled) return;

  const currentTime = playerRef.value.currentTime();
  danmakuList.value.forEach((danmaku) => {
    const danmakuTime = timeStringToSeconds(danmaku.time);

    // 如果还未被推送过，且进入了匹配窗口
    if (!displayedDanmakuIds.has(danmaku.id)) {
      if (currentTime >= danmakuTime && currentTime - danmakuTime < 1) {
        danmakuPlayerRef.value?.addDanmaku(
          danmaku.content,
          false,
          danmaku.id,
          danmaku.isLiked,
          danmaku.type || "scroll"
        );
        displayedDanmakuIds.add(danmaku.id);
      }
    }
  });
};

/**
 * 跳转视频时间
 * @param time 跳转时间（秒）
 */
const seek = (time: number) => {
  if (playerRef.value) {
    playerRef.value.currentTime(time);
    displayedDanmakuIds.clear();
    danmakuPlayerRef.value?.clear(); // 调用子组件清屏
  }
};

/** 处理容器点击事件，切换播放状态 */
const handleContainerClick = () => {
  // 如果章节面板开着，点击视频任意区域则只关闭面板，不暂停视频
  if (showChapterPanel.value) {
    showChapterPanel.value = false;
    return;
  }

  if (playerRef.value) {
    if (isPlaying.value) {
      playerRef.value.pause();
    } else {
      playerRef.value.play();
    }
  }
};

/**
 * 检查左侧控制条宽度是否紧凑
 * @param width 左侧控制条宽度
 */
const checkLeftControlsWidth = ({ width }: any) => {
  isLeftControlsCompact.value = width < 190;
};

/** 切换全屏状态 */
const toggleFullscreen = () => {
  emit("toggle-fullscreen");
};

/**
 * 设置音量
 * @param newVolume 新音量值（0-100）
 */
const setVolume = (newVolume: number) => {
  videoStore.setVolume(newVolume);
  if (playerRef.value) {
    playerRef.value.volume(newVolume / 100);
  }
};

/** 切换静音状态 */
const toggleMute = () => {
  videoStore.toggleMute();
  if (playerRef.value) {
    playerRef.value.muted(videoStore.muted);
    playerRef.value.volume(videoStore.volume / 100);
  }
};

/** * 处理鼠标滚轮调整音量
 * @param e 滚轮事件对象
 */
const handleWheelVolume = (e: WheelEvent) => {
  // 定义每次滚动的音量步长（比如 5%）
  const step = 5;
  let newVolume = videoStore.volume;
  // e.deltaY < 0 表示滚轮向上推（增大音量）
  // e.deltaY > 0 表示滚轮向下拉（减小音量）
  if (e.deltaY < 0) {
    newVolume = Math.min(100, newVolume + step);
  } else if (e.deltaY > 0) {
    newVolume = Math.max(0, newVolume - step);
  }
  // 如果音量已经到顶或到底，没有发生变化，就不做处理
  if (newVolume === videoStore.volume) return;
  // 如果当前是静音状态，且用户向上滚动增大了音量，自动解除静音
  if (videoStore.muted && newVolume > 0) {
    videoStore.toggleMute();
    if (playerRef.value) {
      playerRef.value.muted(false);
    }
  }
  // 调用已有的设置音量方法
  setVolume(newVolume);
};

/**
 * 设置播放速度
 * @param key 播放速度键值
 */
const setPlaybackRate = (key: number) => {
  videoStore.setPlaybackRate(key);
  if (playerRef.value) {
    playerRef.value.playbackRate(key);
  }
};

/** 切换点赞状态 */
const toggleLike = async () => {
  let res;
  if (!isLiked.value) {
    res = await likeVideoApi(playlistStore.currentVideo?.id);
  } else {
    res = await cancelLikeVideoApi(playlistStore.currentVideo?.id);
  }
  isLiked.value = res?.isLiked || false;
  likeCount.value = res?.count || 0;
};

/** 切换收藏状态 */
const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value;
  favoriteCount.value += isFavorited.value ? 1 : -1;
};

/** 打开分享面板逻辑 */
const toggleShare = () => {
  console.log("Toggle share panel");
};

/** 复制链接 */
const copyLink = async () => {
  showShareTooltip.value = false; // 隐藏分享面板

  const video = playlistStore.currentVideo;
  if (!video) {
    window.$message?.warning(t("components.videoPlayer.msg.noVideoInfo"));
    return;
  }
  // 【链接策略】
  // 1. 分享原视频源地址：
  const linkToCopy = video.videoUrl;
  // 2. Web 网页端：
  // const linkToCopy = `https://www.yuanlive.com/video/${video.id}`;
  // 3. 桌面端唤醒协议：
  // const linkToCopy = `yuanlive://video/${video.id}`;
  try {
    // 1. 优先使用 Tauri 原生剪贴板插件 (最稳妥、权限最高)
    await writeText(linkToCopy);
    window.$message?.success(t("components.videoPlayer.msg.videoLinkCopied"));
  } catch (tauriError) {
    console.warn("Tauri 原生剪贴板复制失败，尝试 Web API 降级:", tauriError);
    // 2. 降级方案：使用现代浏览器的 API 兜底
    try {
      await navigator.clipboard.writeText(linkToCopy);
      window.$message?.success(t("components.videoPlayer.msg.videoLinkCopied"));
    } catch (webError) {
      console.error("全部剪贴板方案均失败:", webError);
      window.$message?.error(t("components.videoPlayer.msg.copyFailed"));
    }
  }
};

/** 下载视频 */
const downloadVideo = async () => {
  // 防止重复点击下载
  if (isDownloading.value) {
    window.$dialog?.warning({
      title: t("components.videoPlayer.dialog.confirmCancel"),
      content: t("components.videoPlayer.dialog.cancelDownloadConfirm"),
      positiveText: t("components.common.confirm"),
      negativeText: t("components.common.cancel"),
      onPositiveClick: () => {
        cancelDownload();
        window.$message?.success(t("components.videoPlayer.msg.cancelDownloadSuccess"));
      }
    });
    return;
  }
  showShareTooltip.value = false;
  // 获取当前正在播放的视频
  const video = playlistStore.currentVideo;
  if (!video || !video.videoUrl) {
    window.$message?.error(t("components.videoPlayer.msg.getVideoUrlFailed"));
    return;
  }
  // 定义保存的文件名和路径 (保存到系统的 Downloads 文件夹下的 YuanLive 目录)
  const fileName = `YuanLive_Video_${video.id || Date.now()}.mp4`;
  const savePath = `YuanLive/${fileName}`;
  try {
    window.$message?.info(t("components.videoPlayer.msg.startDownloadVideo"));
    await downloadFile(video.videoUrl, savePath, BaseDirectory.Download);
  } catch (error) {
    console.error("视频下载触发异常:", error);
  }
};

/** 显示二维码 */
const showQRCode = () => {
  showShareTooltip.value = false;
  console.log("Show QR code for sharing");
  // TODO: 获取二维码并显示
};

/** 显示更多操作 */
const toggleMoreOptions = () => {
  showMoreTooltip.value = false;
  console.log("Toggle more options");
};

/** 推荐视频 */
const recommendVideo = () => {
  showMoreTooltip.value = false;
  recommendVideoApi(playlistStore.currentVideo?.id);
};

/** 不感兴趣 */
const dislikeVideo = () => {
  showMoreTooltip.value = false;
  unlikeVideoApi(playlistStore.currentVideo?.id);
};

/** 切换关注状态 */
const toggleFollow = async () => {
  showMoreTooltip.value = false;
  if (!unFollowing) {
    unFollowing = true;
    window.$dialog.warning({
      content: t("components.videoPlayer.dialog.confirmCancel"),
      title: t("components.videoPlayer.dialog.unfollowConfirm"),
      positiveText: t("components.common.confirm"),
      negativeText: t("components.common.cancel"),
      onAfterLeave: () => {
        unFollowing = false;
      },
      onPositiveClick: async () => {
        if (isFollowed.value) {
          isFollowed.value = (await unfollowApi(playlistStore.currentUserId as number)) ?? false;
          return;
        }
      }
    });
  }
};

/** 举报视频 */
const reportVideo = () => {
  showMoreTooltip.value = false;
  showVideoReportDialog.value = true;
};

/**
 * 更新选中的收藏夹（单选逻辑：只能选中一个文件夹）
 * @param folderId 收藏夹ID
 * @param isChecked 是否选中
 */
const updateSelectedFolder = (folderId: number, isChecked: boolean) => {
  collectionFolders.value.forEach((f) => {
    if (f.id === folderId) {
      f.isSelected = isChecked;
    } else {
      f.isSelected = false;
    }
  });

  // 设置selectedFolderId
  selectedFolderId.value = isChecked ? folderId : null;
};

/** 仅收藏视频 */
const onlyCollectVideo = () => {
  isFavorited.value = !isFavorited.value;
  favoriteCount.value += isFavorited.value ? 1 : -1;
  showCollectionTooltip.value = false;
  console.log("Only collect video");
};

/** 收藏至收藏夹 */
const collectToFolder = () => {
  if (selectedFolderId.value) {
    const folder = collectionFolders.value.find((f) => f.id === selectedFolderId.value);
    if (folder) {
      folder.count++;
    }
    isFavorited.value = !isFavorited.value;
    favoriteCount.value += isFavorited.value ? 1 : -1;
    showCollectionTooltip.value = false;
    console.log("Collect to folder", selectedFolderId.value);
  }
};

/** 点击新建收藏夹按钮 */
const onNewFolderClick = () => {
  showCollectionTooltip.value = false;
  showNewFolderDialog.value = true;
};

/**
 * 创建新收藏夹
 * @param name 收藏夹名称
 * @param isPublic 是否为公开收藏夹
 */
const handleCreateFolder = (name: string, isPublic: boolean) => {
  // 生成新的收藏夹ID
  const newId = Math.max(...collectionFolders.value.map((f) => f.id), 0) + 1;
  // 添加新收藏夹
  collectionFolders.value.push({
    id: newId,
    name: name,
    count: 0,
    isSelected: true
  });
  // 选择新收藏夹（保持单选逻辑）
  collectionFolders.value.forEach((f) => {
    f.isSelected = f.id === newId;
  });
  selectedFolderId.value = newId;
  console.log("Create new folder", name, isPublic);
};

/** 切换播放暂停状态 */
const togglePlay = () => {
  if (playerRef.value) {
    if (playerRef.value.paused()) {
      playerRef.value.play();
    } else {
      playerRef.value.pause();
    }
  }
};

/**
 * 发送弹幕
 * @param content 弹幕内容
 * @param isImage 是否为图片弹幕
 */
const sendDanmaku = (content: string, isImage?: boolean) => {
  if (content) {
    emit("danmaku-send", content, isImage);
  }
};

/**
 * 切换自动播放状态
 * @param val 新的自动播放状态
 */
const toggleAutoplay = (val: boolean) => {
  videoStore.setAutoplay(val);
  emit("autoplay-change", val);
};

/**
 * 切换清除屏幕状态
 * @param val 新的清除屏幕状态
 */
const toggleClearScreen = (val: boolean) => {
  videoStore.setClearScreen(val);
  emit("clear-screen-change", val);
};

/** 切换弹幕显示状态 */
const toggleDanmaku = () => {
  const newState = !danmakuStore.settings.enabled;
  danmakuStore.settings.enabled = newState;
  emit("danmaku-toggle", newState);
};

/** 转换时间字符串（mm:ss）为秒数
 * @param timeStr 时间字符串，格式为 mm:ss
 * @returns 转换后的秒数
 */
const timeStringToSeconds = (timeStr: string): number => {
  const [minutes, seconds] = timeStr.split(":").map(Number);
  return minutes * 60 + seconds;
};

/** 切换弹幕列表显示 */
const toggleDanmakuList = () => {
  console.log("Toggle danmaku list");
  showDanmakuListDialog.value = true;
};

/**
 * 切换清晰度
 * @param key 清晰度键值
 */
const switchResolution = (key: string) => {
  videoStore.setResolution(key);
  if (playerRef.value && playlistStore.currentVideo?.videoUrl) {
    const newSrc = `${playlistStore.currentVideo.videoUrl}?resolution=${key}`;
    playerRef.value.src({ src: newSrc, type: "video/mp4" });
    playerRef.value.load();
    if (isPlaying.value) {
      playerRef.value.play();
    }
  }
};

/** 切换系统画中画 */
const toggleMiniWindow = async () => {
  if (!playerRef.value) return;

  try {
    // 检查当前是否已经在系统画中画模式
    if (playerRef.value.isInPictureInPicture()) {
      await playerRef.value.exitPictureInPicture(); // 退出小窗
    } else {
      await playerRef.value.requestPictureInPicture(); // 呼出系统级小窗
    }
  } catch (error) {
    console.error("画中画功能调用失败，可能环境不支持:", error);
  }
};

onLoaded((result) => {
  if (result === "success") {
    window.$message?.success(t("components.videoPlayer.msg.downloadComplete"));
  }
});

watch(
  () => props.poster,
  (newPoster) => {
    if (playerRef.value && newPoster) {
      playerRef.value.poster(newPoster);
    }
  }
);

watch(
  () => playlistStore.currentVideo,
  (newVideo) => {
    if (newVideo) {
      // 更新右侧面板统计数据
      likeCount.value = newVideo.likeCount || 0;
      commentCount.value = newVideo.commentCount || 0;
      favoriteCount.value = newVideo.collectCount || 0;
      shareCount.value = newVideo.shareCount || 0;

      // 通知 video.js 切换播放源并播放
      if (playerRef.value && newVideo.videoUrl) {
        playerRef.value.src({
          src: newVideo.videoUrl,
          type: "video/mp4"
        });
        playerRef.value.load();

        // 加上 setTimeout 防止 videojs 还没 ready 就 play 报错
        setTimeout(() => {
          playerRef.value.play();
        }, 100);
      }
    }
  },
  { deep: true }
);

onMounted(() => {
  if (!videoContainerRef.value) return;
  const videoElement = document.createElement("video");
  videoElement.classList.add("video-js");
  videoElement.classList.add("vjs-big-play-centered");
  videoContainerRef.value.appendChild(videoElement);

  const options: any = {
    controls: false,
    autoplay: props.autoplay || true,
    muted: videoStore.muted,
    loop: props.loop || false,
    preload: props.preload || "auto",
    poster: props.poster || "",
    sources: [],
    fluid: true,
    responsive: true,
    language: "zh-CN",
    userActions: {
      hotkeys: true
    }
  };

  try {
    const player = videojs(videoElement, options);
    playerRef.value = player;
    player.volume(videoStore.volume / 100);
    player.muted(videoStore.muted);
    emit("ready", player);
    const playHandler = () => {
      isPlaying.value = true;
      showPauseOverlay.value = false;
      emit("play");
    };
    player.on("play", playHandler);
    eventListeners.set("play", playHandler);

    const pauseHandler = () => {
      isPlaying.value = false;
      showPauseOverlay.value = true;
      emit("pause");
    };
    player.on("pause", pauseHandler);
    eventListeners.set("pause", pauseHandler);

    const endedHandler = () => {
      emit("ended");
      displayedDanmakuIds.clear();
      danmakuPlayerRef.value?.clear(); // 调用子组件清屏
    };
    player.on("ended", endedHandler);
    eventListeners.set("ended", endedHandler);

    const errorHandler = (error: any) => {
      console.error("Video player error:", error);
      emit("error", error);
    };
    player.on("error", errorHandler);
    eventListeners.set("error", errorHandler);
    let hasResetThisSession = false;

    const timeupdateHandler = () => {
      const current = player.currentTime() || 0;
      const total = player.duration() || 0;
      currentTime.value = current;
      duration.value = total;
      emit("timeupdate", current, total);
      if (current < 0.5 && !hasResetThisSession) {
        displayedDanmakuIds.clear();
        danmakuPlayerRef.value?.clear(); // 替换掉原来清空 Map 和 Array 的那堆逻辑
        hasResetThisSession = true;
      } else if (current >= 0.5) {
        hasResetThisSession = false;
      } else if (displayedDanmakuIds.size > 1000) {
        const idsToKeep = Array.from(displayedDanmakuIds).slice(-500);
        displayedDanmakuIds.clear();
        idsToKeep.forEach((id) => displayedDanmakuIds.add(id));
      }
      updateActiveDanmakus();
    };
    player.on("timeupdate", timeupdateHandler);
    eventListeners.set("timeupdate", timeupdateHandler);

    const volumechangeHandler = () => {
      const playerVolume = player.volume() || 0;
      const volumeValue = Math.round(playerVolume * 100);
      videoStore.setVolume(volumeValue);
      emit("volumechange", playerVolume);
    };
    player.on("volumechange", volumechangeHandler);
    eventListeners.set("volumechange", volumechangeHandler);
    // 监听视频加载事件
    const loadedmetadataHandler = () => {
      console.log("Video metadata loaded successfully");
    };
    player.on("loadedmetadata", loadedmetadataHandler);
    eventListeners.set("loadedmetadata", loadedmetadataHandler);
    const enterPipHandler = () => {
      isMiniWindow.value = true;
    };

    player.on("enterpictureinpicture", enterPipHandler);
    eventListeners.set("enterpictureinpicture", enterPipHandler);
    const leavePipHandler = () => {
      isMiniWindow.value = false;
    };
    player.on("leavepictureinpicture", leavePipHandler);
    eventListeners.set("leavepictureinpicture", leavePipHandler);
    const loadeddataHandler = () => {
      console.log("Video data loaded successfully");
      if (playerRef.value) {
        displayedDanmakuIds.clear();
        danmakuPlayerRef.value?.clear();

        // 初始化推送 0 秒弹幕
        danmakuList.value.forEach((danmaku) => {
          const danmakuTime = timeStringToSeconds(danmaku.time);
          if (danmakuTime === 0 && !displayedDanmakuIds.has(danmaku.id)) {
            danmakuPlayerRef.value?.addDanmaku(
              danmaku.content,
              false,
              danmaku.id,
              danmaku.isLiked,
              danmaku.type || "scroll"
            );
            displayedDanmakuIds.add(danmaku.id);
          }
        });
      }
    };
    player.on("loadeddata", loadeddataHandler);
    eventListeners.set("loadeddata", loadeddataHandler);

    const waitingHandler = () => {
      console.log("Video waiting for data");
    };
    player.on("waiting", waitingHandler);
    eventListeners.set("waiting", waitingHandler);

    const stalledHandler = () => {
      console.log("Video playback stalled");
    };
    player.on("stalled", stalledHandler);
    eventListeners.set("stalled", stalledHandler);

    const seekedHandler = () => {
      console.log("Video seeked to new position");
      updateActiveDanmakus();
    };
    player.on("seeked", seekedHandler);
    eventListeners.set("seeked", seekedHandler);
  } catch (error) {
    console.error("Failed to initialize video player:", error);
    emit("error", error);
  }
  document.addEventListener("keydown", handleShortcutKeyDown);
});

onBeforeUnmount(() => {
  if (playerRef.value) {
    playerRef.value.dispose();
    playerRef.value = null;
  }
  displayedDanmakuIds.clear();
  document.removeEventListener("keydown", handleShortcutKeyDown);
});

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
.video-context-wrapper {
  width: 100%;
  height: 100%;
  display: block; /* 确保包裹层撑满父级 */
}

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

.exit-fullscreen-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 16px 8px 12px;
  border-radius: 20px;
  cursor: pointer;
  z-index: 200; /* 确保在最顶层 */
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  font-size: 14px;
  opacity: 0.8;

  &:hover {
    background-color: rgba(0, 0, 0, 0.8);
    opacity: 1;
    transform: scale(1.05);
  }

  .iconify-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }
}

.fullscreen-wrapper:fullscreen {
  .interaction-panel {
    gap: 30px;
  }
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
  background-color: var(--bg-popover);
  border: 1px solid var(--line-color);
  color: var(--text-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
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
  color: var(--text-color);
  font-size: 14px;
  margin-bottom: 8px;
}

.settings-slider {
  width: 100%;
  --n-slider-bar-background: var(--primary-color, #ff0050) !important;
  --n-slider-rail-background: var(--line-color) !important;
  --n-slider-handle-background: var(--bg-popover) !important;
  --n-slider-handle-box-shadow: 0 0 0 2px var(--line-color) !important;
}

.progress-bar-container {
  position: absolute;
  bottom: 50px; // 距离底部留点空间
  left: 0;
  width: 100%;
  height: 16px; // 足够鼠标 hover 的热区高度
  z-index: 90;
  margin: 0;
  box-sizing: border-box;
  overflow: visible;
  cursor: pointer;
}

// 重写 N-Slider，使其轨道隐形，仅保留 Thumb
.progress-bar-slider {
  width: 100% !important;
  height: 100%;
  display: flex;
  align-items: center;

  :deep(.n-slider-rail),
  :deep(.n-slider-rail__fill) {
    background-color: transparent !important;
  }

  // 自定义滑块容器
  :deep(.n-slider-handle) {
    opacity: 0; /* 默认完全隐藏 */
    transition: opacity 0.2s ease;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    width: auto !important;
    height: auto !important;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 当鼠标悬浮在整个进度条容器上时，显示出滑块图标
.progress-bar-container:hover .progress-bar-slider :deep(.n-slider-handle) {
  opacity: 1;
}

.custom-thumb-icon {
  pointer-events: none;
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

// Interaction Panel
.interaction-panel {
  position: absolute;
  right: 10px;
  bottom: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  z-index: 80;
  transition: all 0.3s ease;
}

.interaction-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.interaction-item:hover {
  transform: scale(1.1);
}

// Swing animation on hover
@keyframes swing {
  0% {
    transform: rotate(0deg) scale(1.1);
  }
  25% {
    transform: rotate(10deg) scale(1.1);
  }
  50% {
    transform: rotate(0deg) scale(1.1);
  }
  75% {
    transform: rotate(-10deg) scale(1.1);
  }
  100% {
    transform: rotate(0deg) scale(1.1);
  }
}

// Apply swing animation only to icons
.interaction-icon:hover {
  animation: swing 0.6s ease-in-out;
  transform: scale(1.1);
}

// Avatar
.avatar-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.avatar-container:hover {
  border-color: rgba(255, 0, 80, 0.8);
  box-shadow: 0 0 20px rgba(255, 0, 80, 0.5);
  transform: scale(1.1);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// Interaction Icons
.interaction-icon {
  font-size: 32px;
  color: #fff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
}

.like-icon.liked {
  color: #ff0050;
  animation: heartBeat 0.6s ease;
}

.favorite-icon.favorited {
  color: #ffcc00;
  animation: starTwinkle 0.6s ease;
}

@keyframes heartBeat {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes starTwinkle {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

// Interaction Counts
.interaction-count {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.more-dots {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.more-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

// More Icon
.more-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

// Tooltip content style
.tooltip-content {
  padding: 10px;
  font-size: 16px;
  background-color: var(--bg-popover);
  color: var(--text-color);
  border: 1px solid var(--line-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

// Responsive Design for small windows
@media (max-height: 600px) {
  .interaction-panel {
    gap: 13px;
  }

  .interaction-item {
    gap: 4px;
  }

  .interaction-icon {
    width: 24px;
    height: 24px;
  }

  .interaction-count {
    font-size: 10px;
  }

  .tooltip-content {
    padding: 4px;
    font-size: 10px;
  }

  .avatar-container {
    width: 28px;
    height: 28px;
  }

  .collection-tooltip {
    width: 160px !important;
    padding: 4px !important;
    font-size: 12px !important;

    .collection-header {
      span {
        font-size: 12px !important;
      }
      .new-folder-btn {
        padding: 3px 8px !important;
        font-size: 10px !important;
      }
    }

    .collection-item {
      font-size: 10px !important;

      // 减小n-checkbox大小
      :deep(.n-checkbox) {
        font-size: 10px !important;

        .n-checkbox-box {
          width: 14px !important;
          height: 14px !important;

          .n-checkbox-icon {
            font-size: 10px !important;
          }
        }
      }
    }
    .iconify-icon {
      width: 14px !important;
      height: 14px !important;
    }
    .no-collections {
      padding: 12px 0;
      .no-collections-text {
        font-size: 11px !important;
      }
    }

    .collection-footer {
      margin-top: 4px !important;
      .footer-btn {
        padding: 4px 8px !important;
        font-size: 10px !important;
      }
    }
  }

  // Share Tooltip Responsive
  .share-tooltip {
    padding: 2px;
    font-size: 12px;

    .share-btn {
      .share-btn-icon {
        width: 14px !important;
        height: 14px !important;
      }

      .share-btn-text {
        font-size: 10px;
      }
    }
  }

  // More Tooltip Responsive
  .more-tooltip {
    padding: 4px;
    font-size: 12px;

    .more-btn {
      gap: 4px;

      .more-btn-icon-container {
        width: 20px;
        height: 20px;
      }

      .more-btn-icon {
        width: 14px !important;
        height: 14px !important;
      }

      .more-btn-text {
        font-size: 10px;
      }
    }
  }
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
  background-color: var(--bg-popover);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--line-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.n-slider) {
    height: 90% !important;
  }
  :deep(.n-slider-rail) {
    background-color: var(--line-color) !important;
  }
}

// Collection Tooltip Styles
.collection-tooltip {
  width: 200px;
  background-color: var(--bg-popover);
  border: 1px solid var(--line-color);
  border-radius: 4px;
  padding: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.collection-header span {
  font-size: 14px;
}

.new-folder-btn {
  padding: 4px 12px;
  background-color: transparent;
  color: var(--action-bar-icon-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.new-folder-btn:hover {
  background-color: var(--bg-left-menu-hover);
  color: var(--text-color);
}

.no-collections {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: var(--user-text-color);
}

.no-collections-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-collections-text {
  font-size: 14px;
}

.collection-list {
  margin-bottom: 12px;
  max-height: 150px;
  overflow-y: auto;
}

.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-bottom: 6px;
  background-color: var(--left-item-bg-color);
}

.collection-item:hover {
  background-color: var(--bg-left-menu-hover);
}

.folder-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.folder-icon {
  width: 12px;
  height: 12px;
  margin-right: 6px;
  color: var(--disabled-color) !important;
}

.folder-name {
  color: var(--text-color);
  font-size: 12px;
  margin-right: 6px;
}

.folder-count {
  color: var(--user-text-color);
  font-size: 10px;
}

.collection-footer {
  display: flex;
  gap: 8px;
}

.footer-btn {
  flex: 1;
  padding: 8px;
  background-color: var(--left-item-bg-color);
  color: var(--text-color);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-align: center;
}

.only-collect-btn {
  background-color: var(--left-item-bg-color);
}

.only-collect-btn:hover {
  background-color: var(--bg-left-menu-hover);
}

.collect-to-folder-btn {
  background-color: #ff0050;
  color: #fff;
}

.collect-to-folder-btn:hover {
  background-color: #ff3366;
}

// Share Tooltip Styles
.share-tooltip {
  display: flex;
  gap: 8px;
  padding: 8px;
  background-color: var(--bg-popover);
  border: 1px solid var(--line-color);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.share-btn {
  display: flex;
  align-items: center;
  padding: 5px;
  background-color: var(--left-item-bg-color);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.share-btn-text {
  font-size: 16px;
  margin-left: 10px;
}

.share-btn:hover {
  background-color: var(--bg-left-menu-hover);
}

.share-btn-icon {
  width: 24px !important;
  height: 24px !important;
  color: var(--action-bar-icon-color) !important;
}

// More Tooltip Styles
.more-tooltip {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--bg-popover);
  border: 1px solid var(--line-color);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.more-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-color);
  background: transparent;
  border: none;
  padding: 0;
}

.more-btn-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--left-item-bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.more-btn:hover .more-btn-icon-container {
  background-color: var(--bg-left-menu-hover);
}

.more-btn-text {
  font-size: 12px;
  margin: 0;
  text-align: center;
}

.more-btn-icon {
  width: 20px !important;
  height: 20px !important;
  color: var(--action-bar-icon-color) !important;
}

// 推荐按钮特殊样式
.recommend-btn .more-btn-icon-container {
  background-color: #00c853;
}

.recommend-btn:hover .more-btn-icon-container {
  background-color: #00e676;
}

.recommend-btn .more-btn-icon {
  color: #fff !important;
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
  width: 28px;
  height: 28px;
}

// 修改全局样式
:deep(.square-checkbox.n-checkbox .n-checkbox-box) {
  border-radius: 2px;
}
</style>

<style>
.n-popover.n-tooltip {
  background-color: var(--bg-popover) !important;
  color: var(--text-color) !important;
  border: 1px solid var(--line-color) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
  border-radius: 4px !important;
}

.n-popover.n-tooltip .n-popover-arrow {
  background-color: var(--bg-popover) !important;
}
</style>
