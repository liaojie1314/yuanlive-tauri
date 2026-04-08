<template>
  <div
    class="group relative w-full cursor-pointer rounded-lg border border-transparent bg-[--tray-bg-color] transition-all duration-200 hover:border-[--line-color] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
    @mouseenter="playVideo"
    @mouseleave="pauseVideo">
    <div class="relative aspect-video w-full overflow-hidden rounded-t-lg bg-black">
      <img
        class="h-full w-full object-cover transition-opacity duration-300"
        :src="video.coverUrl"
        :alt="video.title"
        :class="{ 'opacity-0': isPlaying }" />

      <video
        ref="videoRef"
        muted
        playsinline
        loop
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        :src="video.videoUrl"
        :class="{ 'opacity-100': isPlaying, 'opacity-0': !isPlaying }"></video>

      <div class="absolute bottom-2 left-2 flex-y-center text-xs text-white drop-shadow-md">
        <i-mdi-heart class="mr-1 h-3.5 w-3.5 text-red-500" />
        <span class="font-medium">{{ formatNumber(video.likes, locale) }}</span>
      </div>

      <div
        v-if="video.duration"
        class="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-[2px]">
        {{ formatSecondsToTimeStr(video.duration) }}
      </div>
    </div>

    <div class="space-y-1 rounded-b-lg bg-[--tray-bg-color] p-2">
      <h3
        class="line-clamp-2 text-sm leading-snug font-medium text-[--text-color] transition-colors group-hover:text-red-500">
        {{ video.title }}
      </h3>
    </div>
    <template v-if="selectable">
      <div
        v-if="selected"
        class="pointer-events-none absolute inset-0 z-10 rounded-lg border-2 border-[#ff0050] bg-black/40 transition-all"></div>
      <div class="absolute right-2 top-2 z-20">
        <n-checkbox
          size="large"
          class="square-checkbox"
          :checked="selected"
          @update:checked="$emit('toggle-select', $event)" />
      </div>
      <div class="absolute inset-0 z-10" @click.stop="$emit('toggle-select', !selected)"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { formatNumber, formatSecondsToTimeStr } from "@/utils/FormattingUtils";

const { locale } = useI18n();

defineOptions({
  name: "VideoCard"
});

interface Video {
  id: string;
  coverUrl: string;
  videoUrl: string;
  title: string;
  likes: number;
  duration?: number;
}

const {
  video,
  selectable = false,
  selected = false
} = defineProps<{
  video: Video;
  selectable?: boolean;
  selected?: boolean;
}>();

defineEmits<{
  "toggle-select": [checked: boolean];
}>();

// 视频引用和状态
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);

/** 播放视频 */
const playVideo = () => {
  if (videoRef.value) {
    videoRef.value.play().catch((error) => {
      console.error("播放视频失败:", error);
    });
    isPlaying.value = true;
  }
};

/** 暂停视频 */
const pauseVideo = () => {
  if (videoRef.value) {
    videoRef.value.pause();
    // 重置视频到开始位置
    videoRef.value.currentTime = 0;
    isPlaying.value = false;
  }
};
</script>

<style scoped lang="scss">
:deep(.square-checkbox.n-checkbox .n-checkbox-box) {
  border-radius: 2px !important;
}
</style>
