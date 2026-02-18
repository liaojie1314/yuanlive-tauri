<template>
  <div
    class="video-block-placeholder relative my-2 w-[260px] sm:w-[320px] max-w-full flex-shrink-0 aspect-video overflow-hidden rounded-lg border border-[--line-color] bg-black cursor-pointer group flex items-center justify-center shadow-sm"
    @click="handlePlayClick">
    <img
      v-if="displayCover"
      :src="displayCover"
      alt="Video Cover"
      class="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

    <div
      v-else
      class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 opacity-90 group-hover:opacity-70 transition-opacity duration-300"></div>

    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        class="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm group-hover:bg-[--message-render-color] group-hover:scale-110 transition-all duration-300 shadow-lg border border-white/20">
        <i-material-symbols-play-arrow-rounded class="text-3xl ml-1" />
      </div>
    </div>

    <div
      class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm border border-white/10 flex items-center gap-1 text-[10px] text-white">
      <i-material-symbols-videocam-outline class="text-xs" />
      <span>视频</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateVideoCover } from "@/utils/MessageAdapter";

const props = defineProps<{
  url: string;
  coverImg?: string;
}>();

// 本地异步获取的封面
const localCover = ref("");

// 计算最终展示的封面
const displayCover = computed(() => props.coverImg || localCover.value);

const handlePlayClick = () => {
  console.log("准备播放视频, URL:", props.url);
};

onMounted(async () => {
  if (!props.coverImg && props.url) {
    // 调用抽出到 Adapter 里的方法，截取第 1 秒
    localCover.value = await generateVideoCover(props.url, 10.0);
  }
});
</script>

<style scoped>
.video-block-placeholder {
  -webkit-user-select: none;
  user-select: none;
}
</style>
