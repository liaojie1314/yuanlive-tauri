<template>
  <div
    class="group relative w-full cursor-pointer transition-all duration-200 rounded-lg bg-[--tray-bg-color] border border-transparent hover:border-[--line-color] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
    @mouseenter="playVideo"
    @mouseleave="pauseVideo">
    <div class="relative w-full aspect-video overflow-hidden rounded-t-lg bg-black">
      <img
        :src="video.coverUrl"
        :alt="video.title"
        class="w-full h-full object-cover transition-opacity duration-300"
        :class="{ 'opacity-0': isPlaying }" />

      <video
        ref="videoRef"
        :src="video.videoUrl"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        :class="{ 'opacity-100': isPlaying, 'opacity-0': !isPlaying }"
        muted
        playsinline
        loop></video>

      <div class="flex items-center absolute bottom-2 left-2 text-xs text-white drop-shadow-md">
        <i-mdi-heart class="w-3.5 h-3.5 text-red-500 mr-1" />
        <span class="font-medium">{{ formatNumber(video.likes) }}</span>
      </div>

      <div
        v-if="video.duration"
        class="absolute bottom-2 right-2 bg-black/70 backdrop-blur-[2px] text-white text-[10px] px-1.5 py-0.5 rounded">
        {{ formatTime(video.duration) }}
      </div>
    </div>

    <div class="p-2 space-y-1 bg-[--tray-bg-color] rounded-b-lg">
      <h3
        class="text-sm font-medium text-[--text-color] line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
        {{ video.title }}
      </h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber, formatTime } from "@/utils/FormattingUtils";

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

const { video } = defineProps<{
  video: Video;
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
