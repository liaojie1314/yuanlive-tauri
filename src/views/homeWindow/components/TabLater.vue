<template>
  <div class="mx-4 flex min-h-0 flex-1 flex-col">
    <div class="mb-3 flex h-8 shrink-0 items-center justify-between px-1">
      <div
        v-if="isBatchMode"
        class="flex shrink-0 items-center gap-4 rounded-md bg-[--bg-setting-item] px-3 py-1.5 text-sm whitespace-nowrap">
        <n-checkbox class="square-checkbox" v-model:checked="isAllLaterSelected" @update:checked="handleSelectAllLater">
          {{ t("home.user.collection.selectAll") }}
        </n-checkbox>
        <span class="text-[--user-text-color]">
          {{ t("home.user.later.selectedCount", { count: selectedVideoIds.length }) }}
        </span>
        <div class="mx-1 h-4 w-px bg-[--line-color]"></div>
        <div
          class="flex cursor-pointer items-center gap-1 transition-colors"
          :class="selectedVideoIds.length > 0 ? 'text-[--text-color] hover:text-red-500' : 'text-[--disabled-color]'"
          @click="handleRemoveLater">
          <i-mdi-delete-outline class="text-lg" />
          <span>{{ t("home.user.later.remove") }}</span>
        </div>
      </div>
      <div v-else class="flex w-full justify-end">
        <div
          class="flex cursor-pointer items-center gap-1 text-sm text-[--user-text-color] transition-colors hover:text-[--text-color]"
          @click="handleRemoveWatchedLater">
          <i-mdi-minus-circle-outline class="text-base" />
          <span>{{ t("home.user.later.removeSeen") }}</span>
        </div>
      </div>
    </div>

    <n-scrollbar class="flex-grow" @scroll="handleLaterScroll">
      <div class="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <video-card
          v-for="video in laterVideos"
          :key="video.id"
          :video="video"
          :selectable="isBatchMode"
          :selected="selectedVideoIds.includes(video.id)"
          @toggle-select="handleSelectVideo(video.id, $event)" />
      </div>

      <div v-if="isLaterLoading" class="flex-center py-4"><n-spin size="small" /></div>
      <div
        v-if="!isLaterLoading && !laterHasMore && laterVideos.length > 0"
        class="py-4 text-center text-sm text-[--user-text-color]">
        {{ t("home.user.noMore") }}
      </div>
      <div
        v-if="!isLaterLoading && laterVideos.length === 0"
        class="flex h-full flex-col items-center justify-center py-10 text-center">
        <i-mdi-clock-outline class="mb-4 text-[60px] text-[--disabled-color]" />
        <div class="mb-2 text-lg font-semibold text-[--text-color]">{{ t("home.user.later.noLaterVideo") }}</div>
        <div class="text-sm text-[--user-text-color]">{{ t("home.user.later.addVideoTip") }}</div>
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
const laterVideos = ref<Video[]>([]);
const laterCurrentPage = ref(1);
const isLaterLoading = ref(false);
const laterHasMore = ref(true);
const selectedVideoIds = ref<string[]>([]);

const isAllLaterSelected = computed(
  () => laterVideos.value.length > 0 && selectedVideoIds.value.length === laterVideos.value.length
);

/**
 * 全选/取消全选稍后再看视频
 * @param checked 是否全选
 */
const handleSelectAllLater = (checked: boolean) => {
  selectedVideoIds.value = checked ? laterVideos.value.map((v) => v.id) : [];
};

/**
 * 选择/取消选择稍后再看视频
 * @param id 视频ID
 * @param checked 是否选择
 */
const handleSelectVideo = (id: string, checked: boolean) => {
  if (checked) selectedVideoIds.value.push(id);
  else selectedVideoIds.value = selectedVideoIds.value.filter((vid) => vid !== id);
};

/** 移除选中的稍后再看视频 */
const handleRemoveLater = () => {
  if (selectedVideoIds.value.length === 0) return;
  laterVideos.value = laterVideos.value.filter((v) => !selectedVideoIds.value.includes(v.id));
  window.$message.success(t("home.user.later.msg.removeVideos", { count: selectedVideoIds.value.length }));
  emit("update:isBatchMode", false);
};

/** 移除已看过的稍后再看视频 */
const handleRemoveWatchedLater = () => {
  window.$message.success(t("home.user.later.msg.removeSeenVideos"));
};

/** 加载更多稍后再看视频 */
const loadMoreLaterVideos = async () => {
  if (isLaterLoading.value || !laterHasMore.value) return;
  isLaterLoading.value = true;
  await new Promise((res) => setTimeout(res, 1000));
  laterVideos.value.push(...generateMockVideos(laterCurrentPage.value, pageSize));
  if (laterCurrentPage.value >= 3) laterHasMore.value = false;
  laterCurrentPage.value++;
  isLaterLoading.value = false;
};

/**
 * 处理稍后再看视频滚动事件
 * @param event 滚动事件
 */
const handleLaterScroll = (event: Event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
  if (scrollTop + clientHeight >= scrollHeight - 100) loadMoreLaterVideos();
};

watch(
  () => props.isBatchMode,
  (val) => {
    if (!val) selectedVideoIds.value = [];
  }
);

onMounted(() => {
  if (laterVideos.value.length === 0) loadMoreLaterVideos();
});
</script>
