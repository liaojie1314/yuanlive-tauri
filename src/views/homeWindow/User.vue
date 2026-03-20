<template>
  <div class="m-0 flex h-full flex-col overflow-hidden p-0 text-[--text-color] select-none">
    <div class="px-4 pt-4">
      <user-info-card v-model:save-login-info="saveLoginInfo" />
    </div>

    <div class="mx-4 mt-4 mb-2 rounded-lg border border-[--line-color] bg-[--tray-bg-color] p-4 shadow-sm">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="showUploadDialog = true">
          <!-- @click="createWebviewWindow('live2d', 'live2d', 100, 400)"> -->
          <i-mdi-video-plus class="mb-1 text-xl text-blue-500"></i-mdi-video-plus>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.publishVideo") }}</span>
        </div>
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="createWebviewWindow('视频管理', 'manageVideo', 1200, 720, '', true, 800, 500)">
          <i-mdi-video class="mb-1 text-xl text-green-500"></i-mdi-video>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.manageVideo") }}</span>
        </div>
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="openRecordWindow">
          <i-mdi-camcorder class="mb-1 text-xl text-red-500"></i-mdi-camcorder>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.openRecord") }}</span>
        </div>
        <div
          class="flex cursor-pointer flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-[--tray-hover]"
          @click="createWebviewWindow('直播数据', 'manageLive', 1200, 720, '', true, 800, 500)">
          <i-mdi-chart-line class="mb-1 text-xl text-orange-500"></i-mdi-chart-line>
          <span class="text-sm text-[--user-text-color]">{{ $t("home.user.liveData") }}</span>
        </div>
      </div>
    </div>

    <div
      class="mx-4 mb-2 flex-between-center rounded-lg border border-[--line-color] bg-[--tray-bg-color] px-2 shadow-sm">
      <n-tabs
        class="flex-1"
        v-model:value="activeTopTab"
        :tab-active-color="'#ff0050'"
        :tab-font-size="14"
        :tab-font-weight="500">
        <n-tab-pane name="works" :tab="$t('home.user.tab.works', { count: 0 })" />
        <n-tab-pane name="recommend" :tab="$t('home.user.tab.recommend')" />
        <n-tab-pane name="like" :tab="$t('home.user.tab.like')" />
        <n-tab-pane name="collection" :tab="$t('home.user.tab.collection')" />
        <n-tab-pane name="history" :tab="$t('home.user.tab.watchHistory')" />
        <n-tab-pane name="later" :tab="$t('home.user.tab.watchLater')" />
        <n-tab-pane name="reservation" :tab="$t('home.user.tab.myReservation')" />
        <n-tab-pane name="ai-note" :tab="$t('home.user.tab.aiNotes')" />
      </n-tabs>
    </div>

    <div v-if="activeTopTab === 'collection'" class="mx-4 flex min-h-0 flex-1 flex-col">
      <div class="mb-2 px-1">
        <n-tabs v-model:value="activeSubTab" :tab-active-color="'#ff0050'" :tab-font-size="14">
          <n-tab-pane name="folders" :tab="$t('home.user.tab.collectionFolder')" />
          <n-tab-pane name="videos" :tab="$t('home.user.tab.videos')" />
        </n-tabs>
      </div>

      <template v-if="activeSubTab === 'folders'">
        <div v-if="folders.length === 0" class="flex flex-1 flex-col items-center justify-center pb-10 text-center">
          <div class="mb-4">
            <i-mdi-folder-outline class="text-[100px] text-[--disabled-color]" />
          </div>
          <div class="mb-2 text-lg font-semibold text-[--text-color]">{{ $t("home.user.noCollectionFolder") }}</div>
          <div class="mb-4 text-sm text-[--user-text-color]">{{ $t("home.user.createCollectionFolderTip") }}</div>
          <n-button
            type="primary"
            class="rounded-lg border-none bg-[#ff0050] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ff3366]"
            @click="showCreateDialog = true">
            + {{ $t("home.user.createCollectionFolder") }}
          </n-button>
        </div>

        <n-scrollbar v-else class="flex-grow"></n-scrollbar>
      </template>
    </div>

    <div v-if="activeTopTab === 'like'" class="mx-4 flex min-h-0 flex-1 flex-col">
      <n-scrollbar class="flex-grow" @scroll="handleScroll">
        <div class="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <video-card v-for="video in likedVideos" :key="video.id" :video="video" />
        </div>

        <div v-if="isLoading" class="flex-center py-4">
          <n-spin size="small" />
        </div>

        <div
          v-if="!isLoading && !hasMore && likedVideos.length > 0"
          class="py-4 text-center text-sm text-[--user-text-color]">
          {{ $t("home.user.noMore") }}
        </div>

        <div
          v-if="!isLoading && likedVideos.length === 0"
          class="flex h-full flex-col items-center justify-center py-10 text-center">
          <i-mdi-heart-outline class="mb-4 text-[80px] text-[--disabled-color]" />
          <div class="mb-2 text-lg font-semibold text-[--text-color]">{{ $t("home.user.noLikeVideo") }}</div>
          <div class="text-sm text-[--user-text-color]">{{ $t("home.user.noLikeVideoTip") }}</div>
        </div>
      </n-scrollbar>
    </div>

    <collection-folder-dialog v-model:show="showCreateDialog" @create-folder="handleCreateFolder" />
    <upload-video-dialog v-model:show="showUploadDialog" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useWindow } from "@/hooks/useWindow";
import { isWindows } from "@/utils/PlatformUtils";

defineOptions({
  name: "User"
});

const { t } = useI18n();
const { createWebviewWindow } = useWindow();

interface CollectionFolder {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: Date;
}

interface Video {
  id: string;
  coverUrl: string;
  videoUrl: string;
  title: string;
  likes: number;
  duration?: number;
}

const pageSize = 12;

const saveLoginInfo = ref(true);
// 顶部标签栏状态
const activeTopTab = ref("collection");
// 收藏子标签栏状态
const activeSubTab = ref("folders");
// 收藏夹列表
const folders = ref<CollectionFolder[]>([]);
// 新建收藏夹对话框显示状态
const showCreateDialog = ref(false);
// 喜欢视频相关状态
const likedVideos = ref<Video[]>([]);
const currentPage = ref(1);
const isLoading = ref(false);
const hasMore = ref(true);
const showUploadDialog = ref(false);

/**
 * 创建收藏夹
 * @param name 收藏夹名称
 * @param isPublic 是否公开收藏夹
 */
const handleCreateFolder = (name: string, isPublic: boolean) => {
  const newFolder: CollectionFolder = {
    id: Date.now().toString(),
    name,
    isPublic,
    createdAt: new Date()
  };
  folders.value.push(newFolder);
  console.log("创建收藏夹:", newFolder);
};

/**
 * 模拟生成视频数据
 * @param page 当前页码
 * @param size 每页视频数量
 * @returns 模拟视频数组
 */
const generateMockVideos = (page: number, size: number): Video[] => {
  const videos: Video[] = [];
  const startIndex = (page - 1) * size;

  // 使用picsum的视频作为模拟数据
  const mockVideoUrls = [
    "https://player.vimeo.com/external/371569789.sd.mp4?s=290203140923190304911c7e7bc108d000a9200f&profile_id=165&oauth2_token_id=57447761",
    "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4"
  ];

  for (let i = 0; i < size; i++) {
    const index = startIndex + i;
    videos.push({
      id: `video-${index}`,
      coverUrl: `https://picsum.photos/seed/${index}/400/225`,
      videoUrl: mockVideoUrls[i % mockVideoUrls.length],
      title: `这是一个测试视频标题 ${index + 1}，用于展示喜欢列表的视频卡片`,
      likes: Math.floor(Math.random() * 100000),
      duration: Math.floor(Math.random() * 3600) + 60
    });
  }

  return videos;
};

/** 加载更多视频 */
const loadMoreVideos = async () => {
  if (isLoading.value || !hasMore.value) return;

  try {
    isLoading.value = true;

    // 模拟API请求延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newVideos = generateMockVideos(currentPage.value, pageSize);
    likedVideos.value.push(...newVideos);

    // 模拟只有3页数据
    if (currentPage.value >= 3) {
      hasMore.value = false;
    }

    currentPage.value++;
  } catch (error) {
    console.error("加载视频失败:", error);
  } finally {
    isLoading.value = false;
  }
};

/** 初始化加载视频 */
const initLikedVideos = () => {
  loadMoreVideos();
};

/**
 * 监听滚动事件，实现下滑加载
 * @param event 滚动事件对象
 */
const handleScroll = (event: Event) => {
  const scrollElement = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = scrollElement;

  // 当滚动到底部100px以内时，加载更多
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMoreVideos();
  }
};

/** 打开直播窗口 */
const openRecordWindow = () => {
  if (isWindows()) {
    createWebviewWindow("直播", "record", 1200, 720, "", true, 800, 500);
    return;
  }
  window.$message.warning(t("home.user.notSupport"));
};

// 监听标签页切换，初始化数据
watch(
  () => activeTopTab.value,
  (newTab) => {
    if (newTab === "like") {
      // 如果是第一次切换到喜欢标签页，初始化数据
      if (likedVideos.value.length === 0) {
        initLikedVideos();
      }
    }
  }
);

// 清理函数
onUnmounted(() => {
  // 清理引用
  folders.value = [];
  likedVideos.value = [];
});
</script>
