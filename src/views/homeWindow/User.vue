<template>
  <div class="p-0 m-0 select-none h-full overflow-hidden flex flex-col">
    <user-info-card v-model:save-login-info="saveLoginInfo" />

    <!-- 功能按钮区域 -->
    <div class="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <!-- 发布视频按钮 -->
        <!-- TODO: 测试 -->
        <div
          class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          @click="createWebviewWindow('live2d', 'live2d', 100, 400)">
          <i-mdi-video-plus class="text-xl text-blue-500 mb-1"></i-mdi-video-plus>
          <span class="text-sm text-gray-700">发布视频</span>
        </div>
        <!-- 视频管理按钮 -->
        <div
          class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <i-mdi-video class="text-xl text-green-500 mb-1"></i-mdi-video>
          <span class="text-sm text-gray-700">视频管理</span>
        </div>
        <!-- 作品数据按钮 -->
        <div
          class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <i-mdi-chart-bar class="text-xl text-purple-500 mb-1"></i-mdi-chart-bar>
          <span class="text-sm text-gray-700">作品数据</span>
        </div>
        <!-- 开直播按钮 -->
        <div
          class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          @click="openRecordWindow">
          <i-mdi-camcorder class="text-xl text-red-500 mb-1"></i-mdi-camcorder>
          <span class="text-sm text-gray-700">开直播</span>
        </div>
        <!-- 直播数据按钮 -->
        <div
          class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <i-mdi-chart-line class="text-xl text-orange-500 mb-1"></i-mdi-chart-line>
          <span class="text-sm text-gray-700">直播数据</span>
        </div>
      </div>
    </div>

    <!-- 顶部标签栏和批量管理按钮 -->
    <div class="bg-white border-b border-gray-200 flex items-center justify-between p-0 px-4">
      <n-tabs
        v-model:value="activeTopTab"
        class="flex-1"
        :tab-active-color="'#ff0050'"
        :tab-font-size="14"
        :tab-font-weight="500">
        <n-tab-pane name="works" tab="作品 0" />
        <n-tab-pane name="recommend" tab="推荐" />
        <n-tab-pane name="like" tab="喜欢" />
        <n-tab-pane name="collection" tab="收藏 🔒" />
        <n-tab-pane name="history" tab="观看历史" />
        <n-tab-pane name="later" tab="稍后再看" />
        <n-tab-pane name="reservation" tab="我的预约" />
        <n-tab-pane name="ai-note" tab="AI笔记" />
      </n-tabs>

      <!-- 批量管理按钮 -->
      <div class="ml-4">
        <n-button text class="text-gray-600 text-sm">批量管理</n-button>
      </div>
    </div>

    <!-- 收藏内容区域 -->
    <div v-if="activeTopTab === 'collection'" class="p-2 flex flex-col flex-1 min-h-0">
      <!-- 收藏子标签栏 -->
      <div class="mb-1">
        <n-tabs v-model:value="activeSubTab" :tab-active-color="'#ff0050'" :tab-font-size="14" :tab-font-weight="500">
          <n-tab-pane name="folders" tab="收藏夹" />
          <n-tab-pane name="videos" tab="视频" />
        </n-tabs>
      </div>

      <!-- 收藏夹列表区域 -->
      <n-scrollbar v-if="activeSubTab === 'folders'" class="flex-grow">
        <div v-if="folders.length === 0" class="flex flex-col items-center justify-center text-center">
          <div class="mb-4">
            <i-mdi-folder-outline class="text-[#D1D5DB] text-[100px]" />
          </div>
          <div class="text-lg font-semibold text-gray-800 mb-2">暂无收藏夹</div>
          <div class="text-sm text-gray-600 mb-4">赶快去新建属于自己的收藏夹吧</div>
          <n-button
            type="primary"
            @click="showCreateDialog = true"
            class="bg-[#ff0050] text-white border-none px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#ff3366] transition-colors">
            + 新建收藏夹
          </n-button>
        </div>
      </n-scrollbar>
    </div>

    <!-- 喜欢内容区域 -->
    <div v-if="activeTopTab === 'like'" class="p-2 flex flex-col flex-1 min-h-0">
      <n-scrollbar class="flex-grow" @scroll="handleScroll">
        <!-- 视频网格 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mr-3">
          <video-card v-for="video in likedVideos" :key="video.id" :video="video" />
        </div>
        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex justify-center items-center py-4">
          <n-skeleton width="80%" />
        </div>
        <!-- 没有更多数据 -->
        <div v-if="!isLoading && !hasMore && likedVideos.length > 0" class="text-center text-gray-500 py-4 text-sm">
          没有更多内容了
        </div>
        <!-- 空状态 -->
        <div
          v-if="!isLoading && likedVideos.length === 0"
          class="flex flex-col items-center justify-center text-center py-10">
          <i-mdi-heart-outline class="text-[#D1D5DB] text-[80px] mb-4" />
          <div class="text-lg font-semibold text-gray-800 mb-2">暂无喜欢的视频</div>
          <div class="text-sm text-gray-600">去浏览视频，喜欢的话就点个赞吧</div>
        </div>
      </n-scrollbar>
    </div>
    <!-- 新建收藏夹对话框 -->
    <collection-folder-dialog v-model:show="showCreateDialog" @create-folder="handleCreateFolder" />
  </div>
</template>

<script setup lang="ts">
import { useWindow } from "@/hooks/useWindow";
import { isWindows } from "@/utils/PlatformUtils";

const { createWebviewWindow } = useWindow();

defineOptions({
  name: "User"
});

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
const pageSize = 12;

// 处理创建收藏夹
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

// 模拟生成视频数据
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

// 加载更多视频
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

// 初始化加载视频
const initLikedVideos = () => {
  loadMoreVideos();
};

// 监听滚动事件，实现下滑加载
const handleScroll = (event: Event) => {
  const scrollElement = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = scrollElement;

  // 当滚动到底部100px以内时，加载更多
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMoreVideos();
  }
};

/**
 * 打开直播窗口
 */
const openRecordWindow = () => {
  if (isWindows()) {
    createWebviewWindow("直播", "record", 1200, 720, "", true, 800, 500);
    return;
  }
  window.$message.warning("直播功能仅在Windows平台支持");
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
