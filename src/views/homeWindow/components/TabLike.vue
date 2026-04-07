<template>
  <div class="mx-4 flex min-h-0 flex-1 flex-col">
    <div class="mb-3 flex h-8 shrink-0 items-center px-1">
      <div
        v-if="isBatchMode"
        class="flex shrink-0 items-center gap-4 rounded-md bg-[--bg-setting-item] px-3 py-1.5 text-sm whitespace-nowrap">
        <n-checkbox class="square-checkbox" v-model:checked="isAllSelected" @update:checked="handleSelectAll">
          {{ t("home.user.collection.selectAll") }}
        </n-checkbox>
        <span class="text-[--user-text-color]">
          {{ t("home.user.like.selectedCount", { count: selectedVideoIds.length }) }}
        </span>
        <div class="mx-1 h-4 w-px bg-[--line-color]"></div>
        <div
          class="flex cursor-pointer items-center gap-1 transition-colors"
          :class="selectedVideoIds.length > 0 ? 'text-[--text-color] hover:text-red-500' : 'text-[--disabled-color]'"
          @click="handleCancelLike">
          <i-mdi-delete-outline class="text-lg" />
          <span>{{ t("home.user.like.cancelLike") }}</span>
        </div>
      </div>
      <div v-else class="flex-1"></div>
      <div class="w-50 shrink-0">
        <n-input
          size="small"
          clearable
          round
          class="bg-transparent"
          v-model:value="searchLikeQuery"
          :placeholder="t('home.user.like.searchLikedVideosPlaceholder')">
          <template #prefix><i-mdi-magnify class="text-[--disabled-color]" /></template>
        </n-input>
      </div>
    </div>
    <n-scrollbar class="flex-grow" @scroll="handleScroll">
      <div class="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <video-card
          v-for="video in filteredLikedVideos"
          :key="video.id"
          :video="video"
          :selectable="isBatchMode"
          :selected="selectedVideoIds.includes(video.id)"
          @toggle-select="handleSelectVideo(video.id, $event)" />
      </div>
      <div v-if="isLoading" class="flex-center py-4"><n-spin size="small" /></div>
      <div
        v-if="!isLoading && !hasMore && likedVideos.length > 0"
        class="py-4 text-center text-sm text-[--user-text-color]">
        {{ t("home.user.noMore") }}
      </div>
      <div
        v-if="!isLoading && likedVideos.length === 0"
        class="flex h-full flex-col items-center justify-center py-10 text-center">
        <i-mdi-heart-outline class="mb-4 text-[60px] text-[--disabled-color]" />
        <div class="mb-2 text-lg font-semibold text-[--text-color]">{{ t("home.user.noLikeVideo") }}</div>
        <div class="text-sm text-[--user-text-color]">{{ t("home.user.noLikeVideoTip") }}</div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { generateMockVideos, type Video } from "../mock";

const { t } = useI18n();

const props = defineProps<{ isBatchMode: boolean }>();
const emit = defineEmits<{ "update:isBatchMode": [value: boolean] }>();

const pageSize = 12;
const likedVideos = ref<Video[]>([]);
const currentPage = ref(1);
const isLoading = ref(false);
const hasMore = ref(true);
const searchLikeQuery = ref("");
const selectedVideoIds = ref<string[]>([]);

const filteredLikedVideos = computed(() => {
  if (!searchLikeQuery.value) return likedVideos.value;
  return likedVideos.value.filter((v) => v.title.toLowerCase().includes(searchLikeQuery.value.toLowerCase()));
});

const isAllSelected = computed(
  () => filteredLikedVideos.value.length > 0 && selectedVideoIds.value.length === filteredLikedVideos.value.length
);

/**
 * 全选/取消全选喜欢的作品
 * @param checked 是否全选/取消全选
 */
const handleSelectAll = (checked: boolean) => {
  selectedVideoIds.value = checked ? filteredLikedVideos.value.map((v) => v.id) : [];
};

/**
 * 选择/取消选择喜欢的作品
 * @param id 作品ID
 * @param checked 是否选择/取消选择
 */
const handleSelectVideo = (id: string, checked: boolean) => {
  if (checked) selectedVideoIds.value.push(id);
  else selectedVideoIds.value = selectedVideoIds.value.filter((vid) => vid !== id);
};

/** 取消喜欢喜欢的作品 */
const handleCancelLike = () => {
  if (selectedVideoIds.value.length === 0) return;
  likedVideos.value = likedVideos.value.filter((v) => !selectedVideoIds.value.includes(v.id));
  window.$message.success(t("home.user.like.msg.cancelLike", { count: selectedVideoIds.value.length }));
  emit("update:isBatchMode", false);
};

/** 加载更多喜欢的作品 */
const loadMoreVideos = async () => {
  if (isLoading.value || !hasMore.value) return;
  isLoading.value = true;
  await new Promise((res) => setTimeout(res, 1000));
  likedVideos.value.push(...generateMockVideos(currentPage.value, pageSize));
  if (currentPage.value >= 3) hasMore.value = false;
  currentPage.value++;
  isLoading.value = false;
};

/**
 * 滚动加载更多喜欢的作品
 * @param event 滚动事件
 */
const handleScroll = (event: Event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
  if (scrollTop + clientHeight >= scrollHeight - 100) loadMoreVideos();
};

watch(
  () => props.isBatchMode,
  (val) => {
    if (!val) selectedVideoIds.value = [];
  }
);

onMounted(() => {
  if (likedVideos.value.length === 0) loadMoreVideos();
});
</script>
