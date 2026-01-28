<template>
  <div
    class="group relative w-full cursor-pointer transition-all duration-200 rounded-lg hover:shadow-md"
    @mouseenter="playVideo"
    @mouseleave="pauseVideo">
    <!-- 视频容器 -->
    <div class="relative w-full aspect-video overflow-hidden rounded-lg bg-black">
      <!-- 封面图 -->
      <img
        :src="video.coverUrl"
        :alt="video.title"
        class="w-full h-full object-cover transition-opacity duration-300"
        :class="{ 'opacity-0': isPlaying }" />
      <!-- 视频元素 -->
      <video
        ref="videoRef"
        :src="video.videoUrl"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        :class="{ 'opacity-100': isPlaying, 'opacity-0': !isPlaying }"
        muted
        playsinline
        loop></video>
      <!-- 点赞数 -->
      <div class="flex items-center absolute bottom-2 left-2 text-xs text-white">
        <i-mdi-heart class="w-3.5 h-3.5 text-red-500 mr-1" />
        <span>{{ formatNumber(video.likes) }}</span>
      </div>
      <!-- 时长 -->
      <div
        v-if="video.duration"
        class="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
        {{ formatDuration(video.duration) }}
      </div>
    </div>

    <!-- 视频信息 -->
    <div class="m-2 space-y-1">
      <h3 class="text-sm font-medium text-gray-800 line-clamp-1">{{ video.title }}</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
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

// 播放视频
const playVideo = () => {
  if (videoRef.value) {
    videoRef.value.play().catch((error) => {
      console.error("播放视频失败:", error);
    });
    isPlaying.value = true;
  }
};

// 暂停视频
const pauseVideo = () => {
  if (videoRef.value) {
    videoRef.value.pause();
    // 重置视频到开始位置
    videoRef.value.currentTime = 0;
    isPlaying.value = false;
  }
};

// 格式化时长
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toString();
};
</script>
