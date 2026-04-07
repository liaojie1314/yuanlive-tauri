<template>
  <div class="mx-4 flex min-h-0 flex-1 flex-col">
    <div class="mb-3 flex h-8 shrink-0 items-center justify-end px-1">
      <n-popover trigger="hover" placement="bottom-end" :show-arrow="false">
        <template #trigger>
          <div
            class="flex cursor-pointer items-center gap-1 text-sm text-[--disabled-color] transition-colors hover:text-[--text-color]">
            <i-mdi-lock-outline class="text-base" />
            <span>
              {{ recommendVisibility === "mutual" ? $t("home.user.recommend.mutual") : $t("home.user.recommend.fans") }}
            </span>
            <i-mdi-chevron-down />
          </div>
        </template>
        <div class="flex flex-col w-40 py-1">
          <div
            class="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-[--tray-hover]"
            :class="recommendVisibility === 'mutual' ? 'bg-[#ff0050]/10 text-[#ff0050]' : 'text-[--text-color]'"
            @click="recommendVisibility = 'mutual'">
            {{ $t("home.user.recommend.mutual") }}
          </div>
          <div
            class="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-[--tray-hover]"
            :class="recommendVisibility === 'fans' ? 'bg-[#ff0050]/10 text-[#ff0050]' : 'text-[--text-color]'"
            @click="recommendVisibility = 'fans'">
            {{ $t("home.user.recommend.fans") }}
          </div>
        </div>
      </n-popover>
    </div>

    <n-scrollbar class="flex-grow" @scroll="handleRecommendScroll">
      <div class="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <video-card v-for="video in recommendVideos" :key="video.id" :video="video" />
      </div>
      <div v-if="isRecommendLoading" class="flex-center py-4"><n-spin size="small" /></div>
      <div
        v-if="!isRecommendLoading && !recommendHasMore && recommendVideos.length > 0"
        class="py-4 text-center text-sm text-[--user-text-color]">
        {{ $t("home.user.noMore") }}
      </div>
      <div
        v-if="!isRecommendLoading && recommendVideos.length === 0"
        class="flex h-full flex-col items-center justify-center py-10 text-center">
        <i-mdi-thumb-up-outline class="mb-4 text-[60px] text-[--disabled-color]" />
        <div class="mb-2 text-lg font-semibold text-[--text-color]">{{ $t("home.user.recommend.noRecommend") }}</div>
        <div class="text-sm text-[--user-text-color]">{{ $t("home.user.recommend.noRecommendTip") }}</div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { generateMockVideos, type Video } from "../mock";

const pageSize = 12;
const recommendVideos = ref<Video[]>([]);
const recommendCurrentPage = ref(1);
const isRecommendLoading = ref(false);
const recommendHasMore = ref(true);
const recommendVisibility = ref<"mutual" | "fans">("mutual");

/** 加载更多推荐的作品 */
const loadMoreRecommendVideos = async () => {
  if (isRecommendLoading.value || !recommendHasMore.value) return;
  isRecommendLoading.value = true;
  await new Promise((res) => setTimeout(res, 1000));
  recommendVideos.value.push(...generateMockVideos(recommendCurrentPage.value, pageSize));
  if (recommendCurrentPage.value >= 2) recommendHasMore.value = false;
  recommendCurrentPage.value++;
  isRecommendLoading.value = false;
};

/**
 * 滚动加载更多推荐的作品
 * @param event 滚动事件
 */
const handleRecommendScroll = (event: Event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
  if (scrollTop + clientHeight >= scrollHeight - 100) loadMoreRecommendVideos();
};

onMounted(() => {
  if (recommendVideos.value.length === 0) loadMoreRecommendVideos();
});
</script>
