<template>
  <div
    class="video-block-placeholder group relative my-2 flex aspect-video w-[260px] max-w-full flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-[--line-color] bg-black shadow-sm sm:w-[320px]"
    @click="handlePlayClick">
    <img
      v-if="displayCover"
      alt="Video Cover"
      class="h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-60"
      :src="displayCover" />

    <div
      v-else
      class="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900 opacity-90 transition-opacity duration-300 group-hover:opacity-70"></div>

    <div class="pointer-events-none absolute inset-0 flex-center">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-[--message-render-color]">
        <i-material-symbols-play-arrow-rounded class="ml-1 text-3xl" />
      </div>
    </div>

    <div
      class="absolute bottom-2 left-2 flex-y-center gap-1 rounded border border-white/10 bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
      <i-material-symbols-videocam-outline class="text-xs" />
      <span>{{ $t("components.videoBlock.video") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateVideoCover } from "@/utils/MessageAdapter";

defineOptions({
  name: "VideoBlock"
});

const props = defineProps<{
  url: string;
  coverImg?: string;
}>();

// 本地异步获取的封面
const localCover = ref("");

// 计算最终展示的封面
const displayCover = computed(() => props.coverImg || localCover.value);

/** 点击播放视频 */
const handlePlayClick = () => {
  // TODO: 预览视频
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
