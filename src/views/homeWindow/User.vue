<template>
  <div class="p-0 m-0 select-none">
    <user-info-card
      :name="userInfo.name"
      :avatar="userInfo.avatar"
      :verified="userInfo.verified"
      :following="userInfo.following"
      :followers="userInfo.followers"
      :likes="userInfo.likes"
      :live-users="userInfo.liveUsers"
      :yuanlive-id="userInfo.yuanliveId"
      v-model:save-login-info="saveLoginInfo" />

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
    <div v-if="activeTopTab === 'collection'" class="p-4">
      <!-- 收藏子标签栏 -->
      <div class="mb-5">
        <n-tabs v-model:value="activeSubTab" :tab-active-color="'#ff0050'" :tab-font-size="14" :tab-font-weight="500">
          <n-tab-pane name="folders" tab="收藏夹" />
          <n-tab-pane name="videos" tab="视频" />
          <n-tab-pane name="music" tab="音乐" />
          <n-tab-pane name="collections" tab="合集" />
          <n-tab-pane name="short-dramas" tab="短剧" />
        </n-tabs>
      </div>

      <!-- 收藏夹列表区域 -->
      <div class="min-h-[400px]">
        <div v-if="folders.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="mb-5">
            <i-mdi-folder-outline class="text-[#D1D5DB] text-[100px]" />
          </div>
          <div class="text-lg font-semibold text-gray-800 mb-2">暂无收藏夹</div>
          <div class="text-sm text-gray-600 mb-8">赶快去新建属于自己的收藏夹吧</div>
          <n-button
            type="primary"
            @click="showCreateDialog = true"
            class="bg-[#ff0050] text-white border-none px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#ff3366] transition-colors">
            + 新建收藏夹
          </n-button>
        </div>
      </div>
    </div>

    <!-- 新建收藏夹对话框 -->
    <CollectionFolderDialog v-model:show="showCreateDialog" @create-folder="handleCreateFolder" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import UserInfoCard from "@/components/home/UserInfoCard.vue";
import CollectionFolderDialog from "@/components/common/CollectionFolderDialog.vue";

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
</script>
