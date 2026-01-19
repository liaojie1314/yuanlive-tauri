<template>
  <div class="p-0 m-0 select-none h-full overflow-hidden flex flex-col">
    <user-info-card
      :name="formattedUserInfo.name"
      :avatar="formattedUserInfo.avatar"
      :verified="formattedUserInfo.verified"
      :following="userInfo.following"
      :followers="userInfo.followers"
      :likes="userInfo.likes"
      :live-users="userInfo.liveUsers"
      :yuanlive-id="formattedUserInfo.yuanliveId"
      v-model:save-login-info="saveLoginInfo" />

    <!-- 功能按钮区域 -->
    <div class="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        <!-- 发布视频按钮 -->
        <div
          class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
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
          class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
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

      <!-- 批量管理按钮 - 仅在收藏标签页显示 -->
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
          <n-tab-pane name="music" tab="音乐" />
          <n-tab-pane name="collections" tab="合集" />
          <n-tab-pane name="short-dramas" tab="短剧" />
        </n-tabs>
      </div>

      <!-- 收藏夹列表区域 - 独立滚动 -->
      <n-scrollbar class="flex-grow">
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

    <!-- 新建收藏夹对话框 -->
    <collection-folder-dialog v-model:show="showCreateDialog" @create-folder="handleCreateFolder" />
  </div>
</template>

<script setup lang="ts">
import UserInfoCard from "@/components/home/UserInfoCard.vue";
import CollectionFolderDialog from "@/components/home/CollectionFolderDialog.vue";

defineOptions({
  name: "User"
});

interface UserInfo {
  name: string;
  avatar: string;
  verified: boolean;
  following: number;
  followers: number;
  likes: number;
  liveUsers: number;
  yuanliveId: string;
}

interface CollectionFolder {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: Date;
}

const userInfo = ref<UserInfo>({
  name: "元渊",
  avatar: "https://picsum.photos/200",
  verified: true,
  following: 94,
  followers: 2,
  likes: 0,
  liveUsers: 4,
  yuanliveId: "20682669069"
});

const saveLoginInfo = ref(true);

// 顶部标签栏状态
const activeTopTab = ref("collection");
// 收藏子标签栏状态
const activeSubTab = ref("folders");
// 收藏夹列表
const folders = ref<CollectionFolder[]>([]);
// 新建收藏夹对话框显示状态
const showCreateDialog = ref(false);

// 计算属性：格式化关注数等数据
const formattedUserInfo = computed(() => {
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万";
    }
    return num.toString();
  };

  return {
    ...userInfo.value,
    following: formatNumber(userInfo.value.following),
    followers: formatNumber(userInfo.value.followers),
    likes: formatNumber(userInfo.value.likes),
    liveUsers: formatNumber(userInfo.value.liveUsers)
  };
});

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

// 清理函数
onUnmounted(() => {
  // 清理引用
  folders.value = [];
});
</script>
