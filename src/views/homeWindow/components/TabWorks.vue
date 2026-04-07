<template>
  <n-config-provider data-tauri-drag-region class="login-box rounded-8px size-full select-none" :theme="naiveTheme">
    <div class="mx-4 flex min-h-0 flex-1 flex-col">
      <div class="mb-3 flex h-8 shrink-0 items-center justify-between px-1">
        <div
          v-if="isBatchMode"
          class="flex shrink-0 items-center gap-4 rounded-md bg-[--bg-setting-item] px-3 py-1.5 text-sm whitespace-nowrap">
          <n-checkbox
            class="square-checkbox"
            v-model:checked="isAllWorksSelected"
            @update:checked="handleSelectAllWorks">
            {{ t("home.user.collection.selectAll") }}
          </n-checkbox>
          <span class="text-[--user-text-color]">
            {{ t("home.user.later.selectedCount") }} {{ selectedVideoIds.length }}
          </span>
          <div class="mx-1 h-4 w-px bg-[--line-color]"></div>
          <div
            class="flex cursor-pointer items-center gap-1 transition-colors"
            :class="selectedVideoIds.length > 0 ? 'text-[--text-color] hover:text-red-500' : 'text-[--disabled-color]'"
            @click="handleRemoveWorks">
            <i-mdi-delete-outline class="text-lg" />
            <span>{{ t("home.user.workers.delete") }}</span>
          </div>
        </div>
        <div v-else class="flex-1"></div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="w-48 shrink-0">
            <n-input
              size="small"
              clearable
              class="bg-transparent"
              v-model:value="searchWorksQuery"
              :placeholder="t('home.user.workers.searchPlaceholder')"
              :bordered="false">
              <template #prefix><i-mdi-magnify class="text-[--disabled-color]" /></template>
            </n-input>
          </div>
          <div class="h-3 w-px bg-[--line-color]"></div>
          <n-popover trigger="click" placement="bottom-end">
            <template #trigger>
              <div
                class="flex cursor-pointer items-center gap-1 text-sm text-[--disabled-color] transition-colors hover:text-[--text-color]">
                <i-mdi-calendar-month-outline class="text-base" />
                <span>{{ t("home.user.workers.dateFilter") }}</span>
                <i-mdi-chevron-down />
              </div>
            </template>
            <div class="p-2">
              <n-date-picker type="daterange" clearable panel v-model:value="worksDateRange" />
            </div>
          </n-popover>
        </div>
      </div>

      <n-scrollbar class="flex-grow" @scroll="handleWorksScroll">
        <div class="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <video-card
            v-for="video in filteredWorksVideos"
            :key="video.id"
            :video="video"
            :selectable="isBatchMode"
            :selected="selectedVideoIds.includes(video.id)"
            @toggle-select="handleSelectVideo(video.id, $event)" />
        </div>
        <div v-if="isWorksLoading" class="flex-center py-4"><n-spin size="small" /></div>
        <div
          v-if="!isWorksLoading && !worksHasMore && worksVideos.length > 0"
          class="py-4 text-center text-sm text-[--user-text-color]">
          {{ t("home.user.noMore") }}
        </div>
        <div
          v-if="!isWorksLoading && worksVideos.length === 0"
          class="flex h-full flex-col items-center justify-center py-10 text-center">
          <i-mdi-video-box class="mb-4 text-[60px] text-[--line-color]" />
          <div class="mb-2 text-lg font-bold text-[--text-color]">{{ t("home.user.workers.noContent") }}</div>
          <div class="text-sm text-[--user-text-color]">{{ t("home.user.workers.noPublishedWorks") }}</div>
        </div>
      </n-scrollbar>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";

import { ThemeEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting";
import { generateMockVideos, type Video } from "../mock";

const { t } = useI18n();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);

const props = defineProps<{ isBatchMode: boolean }>();
const emit = defineEmits<{ "update:isBatchMode": [value: boolean] }>();

const pageSize = 12;
const worksVideos = ref<Video[]>([]);
const worksCurrentPage = ref(1);
const isWorksLoading = ref(false);
const worksHasMore = ref(true);
const searchWorksQuery = ref("");
const worksDateRange = ref<[number, number] | null>(null);
const selectedVideoIds = ref<string[]>([]);

const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));
const filteredWorksVideos = computed(() => {
  if (!searchWorksQuery.value) return worksVideos.value;
  const query = searchWorksQuery.value.toLowerCase();
  return worksVideos.value.filter((v) => v.title.toLowerCase().includes(query));
});

const isAllWorksSelected = computed(
  () => filteredWorksVideos.value.length > 0 && selectedVideoIds.value.length === filteredWorksVideos.value.length
);

/**
 * 全选/取消全选作品
 * @param checked 是否全选
 */
const handleSelectAllWorks = (checked: boolean) => {
  selectedVideoIds.value = checked ? filteredWorksVideos.value.map((v) => v.id) : [];
};

/**
 * 选择/取消选择作品
 * @param id 作品ID
 * @param checked 是否选择
 */
const handleSelectVideo = (id: string, checked: boolean) => {
  if (checked) selectedVideoIds.value.push(id);
  else selectedVideoIds.value = selectedVideoIds.value.filter((vid) => vid !== id);
};

/** 删除选中作品 */
const handleRemoveWorks = () => {
  if (selectedVideoIds.value.length === 0) return;
  worksVideos.value = worksVideos.value.filter((v) => !selectedVideoIds.value.includes(v.id));
  window.$message.success(t("home.user.workers.msg.delete", { count: selectedVideoIds.value.length }));
  emit("update:isBatchMode", false);
};

/** 加载更多作品 */
const loadMoreWorksVideos = async () => {
  if (isWorksLoading.value || !worksHasMore.value) return;
  isWorksLoading.value = true;
  await new Promise((res) => setTimeout(res, 1000));
  worksVideos.value.push(...generateMockVideos(worksCurrentPage.value, pageSize));
  if (worksCurrentPage.value >= 2) worksHasMore.value = false;
  worksCurrentPage.value++;
  isWorksLoading.value = false;
};

/**
 * 滚动加载更多作品
 * @param event 滚动事件
 */
const handleWorksScroll = (event: Event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
  if (scrollTop + clientHeight >= scrollHeight - 100) loadMoreWorksVideos();
};

watch(
  () => props.isBatchMode,
  (val) => {
    if (!val) selectedVideoIds.value = [];
  }
);

onMounted(() => {
  if (worksVideos.value.length === 0) loadMoreWorksVideos();
});
</script>
