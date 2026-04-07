<template>
  <div class="mx-4 flex min-h-0 flex-1 flex-col">
    <div class="mb-2 flex items-center justify-between border-b border-[--line-color] pb-1 px-1">
      <n-tabs class="flex-1" v-model:value="activeSubTab" :tab-active-color="'#ff0050'" :tab-font-size="14">
        <n-tab-pane name="folders" :tab="t('home.user.tab.collectionFolder')" />
        <n-tab-pane name="videos" :tab="t('home.user.tab.videos')" />
      </n-tabs>

      <div
        v-if="activeSubTab === 'folders'"
        class="flex shrink-0 cursor-pointer items-center text-sm text-[--user-text-color] transition-colors hover:text-[--text-color]"
        @click="showCreateDialog = true">
        <i-mdi-folder-plus-outline class="mr-1 text-sm" />
        {{ t("home.user.createCollectionFolder") }}
      </div>
    </div>

    <template v-if="activeSubTab === 'folders'">
      <div v-if="folders.length === 0" class="flex flex-1 flex-col items-center justify-center pb-10 text-center">
        <div class="mb-4"><i-mdi-folder-outline class="text-[100px] text-[--disabled-color]" /></div>
        <div class="mb-2 text-lg font-semibold text-[--text-color]">{{ t("home.user.noCollectionFolder") }}</div>
        <div class="mb-4 text-sm text-[--user-text-color]">{{ t("home.user.createCollectionFolderTip") }}</div>
        <n-button
          type="primary"
          class="rounded-lg border-none bg-[#ff0050] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ff3366]"
          @click="showCreateDialog = true">
          + {{ t("home.user.createCollectionFolder") }}
        </n-button>
      </div>

      <n-scrollbar v-else class="flex-grow">
        <div
          v-if="isBatchMode"
          class="mb-2 flex shrink-0 items-center gap-4 rounded-md bg-[--bg-setting-item] px-3 py-1.5 text-sm whitespace-nowrap">
          <n-checkbox
            class="square-checkbox"
            v-model:checked="isAllFoldersSelected"
            @update:checked="handleSelectAllFolders">
            {{ t("home.user.collection.selectAll") }}
          </n-checkbox>
          <span class="text-[--user-text-color]">
            {{ t("home.user.collection.selectedCount", { count: selectedFolderIds.length }) }}
          </span>
          <div class="mx-1 h-4 w-px bg-[--line-color]"></div>
          <div
            class="flex cursor-pointer items-center gap-1 transition-colors"
            :class="selectedFolderIds.length > 0 ? 'text-[--text-color] hover:text-red-500' : 'text-[--disabled-color]'"
            @click="handleDeleteFolders">
            <i-mdi-delete-outline class="text-lg" />
            <span>{{ t("home.user.collection.deleteCollection") }}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-4 pt-2">
          <div
            v-for="folder in folders"
            class="group relative flex cursor-pointer flex-col rounded-xl bg-[--tray-bg-color] p-3 transition-all hover:shadow-md"
            :key="folder.id">
            <div class="mb-1 flex items-center justify-between">
              <div class="flex items-center gap-1 min-w-0 text-[--text-color]">
                <span class="truncate text-sm font-medium">{{ folder.name }}</span>
                <i-mdi-lock v-if="!folder.isPublic" class="text-xs text-[--disabled-color] shrink-0" />
              </div>
              <n-dropdown trigger="hover" placement="bottom-end" :options="folderOptions">
                <div
                  class="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[--line-color] opacity-0 group-hover:opacity-100">
                  <i-mdi-dots-horizontal class="text-lg text-[--user-text-color]" />
                </div>
              </n-dropdown>
            </div>
            <div class="mb-3 text-xs text-[--user-text-color]">
              {{ t("home.user.collection.totalWorks", { count: 1 }) }}
            </div>
            <div class="grid grid-cols-5 gap-1.5">
              <div class="aspect-square w-full overflow-hidden rounded bg-[--bg-setting-item]">
                <img src="https://picsum.photos/seed/jihuang/100/100" class="h-full w-full object-cover" />
              </div>
              <div
                v-for="i in 4"
                class="flex aspect-square w-full items-center justify-center rounded bg-[--bg-setting-item] text-[--disabled-color]"
                :key="i">
                <i-mdi-music-note class="text-xl opacity-40" />
              </div>
            </div>

            <template v-if="isBatchMode">
              <div
                v-if="selectedFolderIds.includes(folder.id)"
                class="pointer-events-none absolute inset-0 z-10 rounded-xl border-2 border-[#ff0050] bg-black/20 transition-all"></div>
              <div class="absolute right-2 top-2 z-20">
                <n-checkbox
                  size="large"
                  :checked="selectedFolderIds.includes(folder.id)"
                  @update:checked="handleSelectFolder(folder.id, $event)" />
              </div>
              <div
                class="absolute inset-0 z-10"
                @click.stop="handleSelectFolder(folder.id, !selectedFolderIds.includes(folder.id))"></div>
            </template>
          </div>
        </div>
        <div class="py-10 text-center text-xs text-[--user-text-color]">{{ t("home.user.noMore") }}</div>
      </n-scrollbar>
    </template>

    <template v-else-if="activeSubTab === 'videos'">
      <div class="mb-3 flex h-8 shrink-0 items-center justify-between px-1">
        <div
          v-if="isBatchMode"
          class="flex shrink-0 items-center gap-4 rounded-md bg-[--bg-setting-item] px-3 py-1 text-sm whitespace-nowrap">
          <n-checkbox
            class="square-checkbox"
            v-model:checked="isAllCollectedVideosSelected"
            @update:checked="handleSelectAllCollectedVideos">
            {{ t("home.user.collection.selectAll") }}
          </n-checkbox>
          <span class="text-[--user-text-color]">
            {{ t("home.user.collection.selectedCollectedVideos", { count: selectedVideoIds.length }) }}
          </span>
          <div class="mx-1 h-4 w-px bg-[--line-color]"></div>
          <div
            class="flex cursor-pointer items-center gap-1 transition-colors"
            :class="selectedVideoIds.length > 0 ? 'text-[--text-color] hover:text-red-500' : 'text-[--disabled-color]'"
            @click="handleCancelCollectVideos">
            <i-mdi-delete-outline class="text-lg" />
            <span>{{ t("home.user.collection.cancelCollect") }}</span>
          </div>
          <div class="mx-1 h-4 w-px bg-[--line-color]"></div>
          <div
            class="flex cursor-pointer items-center gap-1 transition-colors"
            :class="
              selectedVideoIds.length > 0 ? 'text-[--text-color] hover:text-[#ff0050]' : 'text-[--disabled-color]'
            ">
            <i-mdi-folder-plus-outline class="text-lg" />
            <span>{{ t("home.user.collection.joinCollectionFolder") }}</span>
          </div>
        </div>
        <div v-else class="flex-1"></div>

        <div class="w-50 shrink-0">
          <n-input
            size="small"
            clearable
            class="bg-transparent"
            v-model:value="searchCollectionQuery"
            :placeholder="t('home.user.collection.searchCollectedVideos')"
            :bordered="false">
            <template #prefix><i-mdi-magnify class="text-[--disabled-color]" /></template>
          </n-input>
        </div>
      </div>

      <n-scrollbar class="flex-grow" @scroll="handleCollectionScroll">
        <div class="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <video-card
            v-for="video in filteredCollectedVideos"
            :key="video.id"
            :video="video"
            :selectable="isBatchMode"
            :selected="selectedVideoIds.includes(video.id)"
            @toggle-select="handleSelectVideo(video.id, $event)" />
        </div>
        <div v-if="isCollectionLoading" class="flex-center py-4"><n-spin size="small" /></div>
        <div
          v-if="!isCollectionLoading && !collectionHasMore && collectedVideos.length > 0"
          class="py-4 text-center text-sm text-[--user-text-color]">
          {{ t("home.user.noMore") }}
        </div>
        <div
          v-if="!isCollectionLoading && collectedVideos.length === 0"
          class="flex h-full flex-col items-center justify-center py-10 text-center">
          <i-mdi-video-outline class="mb-4 text-[80px] text-[--disabled-color]" />
          <div class="mb-2 text-lg font-semibold text-[--text-color]">
            {{ t("home.user.collection.noCollectedVideos") }}
          </div>
          <div class="text-sm text-[--user-text-color]">{{ t("home.user.collection.noCollectedVideosTip") }}</div>
        </div>
      </n-scrollbar>
    </template>

    <collection-folder-dialog v-model:show="showCreateDialog" @create-folder="handleCreateFolder" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { generateMockVideos, type Video } from "../mock";

const { t } = useI18n();

const props = defineProps<{ isBatchMode: boolean }>();
const emit = defineEmits<{ "update:isBatchMode": [value: boolean] }>();

interface CollectionFolder {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: Date;
}

const pageSize = 12;

const activeSubTab = ref("folders");
const folders = ref<CollectionFolder[]>([{ id: "1", name: "饥荒", isPublic: false, createdAt: new Date() }]);
const showCreateDialog = ref(false);
const selectedFolderIds = ref<string[]>([]);
const collectedVideos = ref<Video[]>([]);
const collectionCurrentPage = ref(1);
const isCollectionLoading = ref(false);
const collectionHasMore = ref(true);
const searchCollectionQuery = ref("");
const selectedVideoIds = ref<string[]>([]);

const folderOptions = computed(() => [
  { label: t("home.user.collection.addVideo"), key: "add" },
  { label: t("home.user.collection.editCollectionFolder"), key: "edit" },
  { label: t("home.user.collection.deleteCollectionFolder"), key: "delete" }
]);
const isAllFoldersSelected = computed(
  () => folders.value.length > 0 && selectedFolderIds.value.length === folders.value.length
);
const filteredCollectedVideos = computed(() => {
  if (!searchCollectionQuery.value) return collectedVideos.value;
  return collectedVideos.value.filter((v) => v.title.toLowerCase().includes(searchCollectionQuery.value.toLowerCase()));
});

const isAllCollectedVideosSelected = computed(
  () =>
    filteredCollectedVideos.value.length > 0 && selectedVideoIds.value.length === filteredCollectedVideos.value.length
);

/**
 * 全选/取消全选收藏夹
 * @param checked 是否全选
 */
const handleSelectAllFolders = (checked: boolean) => {
  selectedFolderIds.value = checked ? folders.value.map((f) => f.id) : [];
};

/**
 * 选择/取消选择收藏夹
 * @param id 收藏夹ID
 * @param checked 是否选择
 */
const handleSelectFolder = (id: string, checked: boolean) => {
  if (checked) selectedFolderIds.value.push(id);
  else selectedFolderIds.value = selectedFolderIds.value.filter((fid) => fid !== id);
};

/** 删除选中的收藏夹 */
const handleDeleteFolders = () => {
  if (selectedFolderIds.value.length === 0) return;
  folders.value = folders.value.filter((f) => !selectedFolderIds.value.includes(f.id));
  window.$message.success(t("home.user.collection.msg.delete", { count: selectedFolderIds.value.length }));
  selectedFolderIds.value = [];
  emit("update:isBatchMode", false);
};

/**
 * 创建收藏夹
 * @param name 收藏夹名称
 * @param isPublic 是否公开
 */
const handleCreateFolder = (name: string, isPublic: boolean) => {
  folders.value.push({ id: Date.now().toString(), name, isPublic, createdAt: new Date() });
  window.$message.success(t("home.user.collection.msg.createSuccess"));
};

/**
 * 全选/取消全选收藏视频
 * @param checked 是否全选
 */
const handleSelectAllCollectedVideos = (checked: boolean) => {
  selectedVideoIds.value = checked ? filteredCollectedVideos.value.map((v) => v.id) : [];
};

/**
 * 选择/取消选择收藏视频
 * @param id 收藏视频ID
 * @param checked 是否选择
 */
const handleSelectVideo = (id: string, checked: boolean) => {
  if (checked) selectedVideoIds.value.push(id);
  else selectedVideoIds.value = selectedVideoIds.value.filter((vid) => vid !== id);
};

/** 取消收藏选中的视频 */
const handleCancelCollectVideos = () => {
  if (selectedVideoIds.value.length === 0) return;
  collectedVideos.value = collectedVideos.value.filter((v) => !selectedVideoIds.value.includes(v.id));
  window.$message.success(t("home.user.collection.msg.cancelCollect", { count: selectedVideoIds.value.length }));
  selectedVideoIds.value = [];
  emit("update:isBatchMode", false);
};

/** 加载更多收藏视频 */
const loadMoreCollectionVideos = async () => {
  if (isCollectionLoading.value || !collectionHasMore.value) return;
  isCollectionLoading.value = true;
  await new Promise((res) => setTimeout(res, 1000));
  collectedVideos.value.push(...generateMockVideos(collectionCurrentPage.value, pageSize));
  if (collectionCurrentPage.value >= 3) collectionHasMore.value = false;
  collectionCurrentPage.value++;
  isCollectionLoading.value = false;
};

/**
 * 收藏视频滚动事件
 * @param event 滚动事件
 */
const handleCollectionScroll = (event: Event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement;
  if (scrollTop + clientHeight >= scrollHeight - 100) loadMoreCollectionVideos();
};

watch(
  () => activeSubTab.value,
  () => {
    emit("update:isBatchMode", false);
    selectedVideoIds.value = [];
    selectedFolderIds.value = [];
    if (activeSubTab.value === "videos" && collectedVideos.value.length === 0) loadMoreCollectionVideos();
  }
);

watch(
  () => props.isBatchMode,
  (val) => {
    if (!val) {
      selectedVideoIds.value = [];
      selectedFolderIds.value = [];
    }
  }
);

onMounted(() => {
  if (activeSubTab.value === "videos" && collectedVideos.value.length === 0) loadMoreCollectionVideos();
});
</script>
