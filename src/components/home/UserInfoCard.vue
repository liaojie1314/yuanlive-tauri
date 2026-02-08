<template>
  <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg">
    <div class="flex items-center gap-5 justify-between">
      <div class="shrink-0">
        <img
          :src="userInfo?.avatar"
          :alt="`${userInfo?.username}的头像`"
          class="w-24 h-24 rounded-full border-3 border-white shadow-lg object-cover"
          loading="lazy" />
      </div>
      <div class="flex flex-col gap-2 flex-1">
        <div class="flex items-center gap-2">
          <span
            class="text-2xl font-semibold text-gray-800 cursor-pointer hover:text-blue-500 transition-colors"
            @click="openEditDialog">
            {{ userInfo?.username }}
          </span>
          <span class="text-blue-500 text-xl font-bold">
            <i-mdi-check />
          </span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('following')">
            关注
            <span class="text-gray-800 font-medium">{{ userInfo?.userStats.followingCount }}</span>
          </span>
          <span class="text-gray-200 mx-1">|</span>
          <span
            v-if="userInfo?.userStats.followingLiveCount!! > 0"
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500 text-red-500">
            {{ userInfo?.userStats.followingLiveCount }}人正在直播
          </span>
          <span v-if="userInfo?.userStats.followingLiveCount!! > 0" class="text-gray-200 mx-1">|</span>
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('followers')">
            粉丝
            <span class="text-gray-800 font-medium">{{ userInfo?.userStats.followerCount }}</span>
          </span>
          <span class="text-gray-200 mx-1">|</span>
          <span class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500">
            获赞
            <span class="text-gray-800 font-medium">{{ userInfo?.userStats.totalLikesReceived }}</span>
          </span>
        </div>
        <div class="text-sm text-gray-600">
          <span class="mr-2">YuanLive号:</span>
          <span class="font-medium text-gray-800">{{ userInfo?.uid }}</span>
        </div>
      </div>
      <div class="flex items-center justify-end">
        <div class="flex items-center gap-2.5 text-sm text-gray-600">
          <span class="whitespace-nowrap">保存登录信息</span>
          <n-switch />
        </div>
      </div>
    </div>

    <follow-list-dialog v-model:show="dialogVisible" v-model:active-tab="activeTab" />

    <edit-profile-dialog v-model:show="editDialogVisible" />
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "@/stores/user";

const { userInfo } = useUserStore();

// 对话框状态
const dialogVisible = ref(false);
const activeTab = ref<"following" | "followers">("following");

// 编辑资料对话框状态
const editDialogVisible = ref(false);

// 打开关注/粉丝对话框
const openFollowDialog = (tab: "following" | "followers") => {
  activeTab.value = tab;
  dialogVisible.value = true;
};

// 打开编辑资料对话框
const openEditDialog = () => {
  editDialogVisible.value = true;
};
</script>

<style scoped lang="scss">
.special-style {
  background: linear-gradient(to right, #ec695c, #61c454) no-repeat left bottom;
  background-size: 0 2px;
  transition: background-size 800ms;
}

.special-style:hover {
  background-position-x: left;
  background-size: 100% 2px;
}
</style>
