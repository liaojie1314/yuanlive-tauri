<template>
  <div
    class="p-5 rounded-lg transition-colors duration-300 light:bg-gradient-to-br light:from-blue-50 light:to-blue-100 dark:bg-[--bg-setting-item] border border-transparent dark:border-[--line-color]">
    <div class="flex items-center gap-5 justify-between">
      <div class="shrink-0">
        <img
          :src="userInfo?.avatar"
          :alt="`${userInfo?.username}的头像`"
          class="w-24 h-24 rounded-full border-3 border-white dark:border-[--line-color] shadow-lg object-cover cursor-pointer hover:scale-105 transition-transform"
          loading="lazy"
          @click="openEditDialog" />
      </div>

      <div class="flex flex-col gap-2 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-2xl font-semibold text-[--text-color] cursor-pointer hover:text-blue-500 transition-colors">
            {{ userInfo?.username }}
          </span>
          <span class="text-blue-500 text-xl font-bold" title="认证用户">
            <i-mdi-check-decagram />
          </span>
        </div>

        <div class="flex items-center gap-2 text-sm text-[--user-text-color] whitespace-nowrap">
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('following')">
            关注
            <span class="text-[--text-color] font-medium">{{ userInfo?.userStats.followingCount || 0 }}</span>
          </span>
          <span class="text-[--line-color] mx-1">|</span>
          <span
            v-if="userInfo?.userStats.followingLiveCount!! > 0"
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500 text-red-500">
            {{ userInfo?.userStats.followingLiveCount }}人正在直播
          </span>
          <span v-if="userInfo?.userStats.followingLiveCount!! > 0" class="text-[--line-color] mx-1">|</span>
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('followers')">
            粉丝
            <span class="text-[--text-color] font-medium">{{ userInfo?.userStats.followerCount || 0 }}</span>
          </span>
          <span class="text-[--line-color] mx-1">|</span>
          <span class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500">
            获赞
            <span class="text-[--text-color] font-medium">{{ userInfo?.userStats.totalLikesReceived || 0 }}</span>
          </span>
        </div>

        <div class="text-sm text-[--user-text-color]">
          <span class="mr-2">YuanLive号:</span>
          <span class="font-medium text-[--text-color]">{{ userInfo?.uid }}</span>
        </div>
      </div>

      <div class="flex flex-col items-end gap-3 justify-center h-24">
        <n-button
          v-if="true"
          type="primary"
          size="small"
          secondary
          round
          class="bg-blue-50 dark:bg-transparent"
          @click="openApplyDialog">
          <template #icon>
            <i-mdi-microphone-variant />
          </template>
          申请成为主播
        </n-button>

        <div class="flex-center w-full gap-2.5 text-xs text-[--user-text-color]">
          <span class="whitespace-nowrap">保存登录</span>
          <n-switch size="small" v-model:value="saveLoginInfoLocal" />
        </div>
      </div>
    </div>

    <follow-list-dialog v-model:show="dialogVisible" v-model:active-tab="activeTab" />
    <edit-profile-dialog v-model:show="editDialogVisible" />

    <apply-streamer-dialog v-model:show="applyDialogVisible" @submit="handleApplySubmit" />
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "@/stores/user";

const { userInfo } = useUserStore();

// 接收父组件的 v-model
const props = defineProps(["saveLoginInfo"]);
const emit = defineEmits(["update:saveLoginInfo"]);

const saveLoginInfoLocal = computed({
  get: () => props.saveLoginInfo,
  set: (val) => emit("update:saveLoginInfo", val)
});

const dialogVisible = ref(false);
const activeTab = ref<"following" | "followers">("following");
const editDialogVisible = ref(false);
// 新增：申请主播弹窗状态
const applyDialogVisible = ref(false);

const openFollowDialog = (tab: "following" | "followers") => {
  activeTab.value = tab;
  dialogVisible.value = true;
};

const openEditDialog = () => {
  editDialogVisible.value = true;
};

// 新增：打开申请弹窗
const openApplyDialog = () => {
  applyDialogVisible.value = true;
};

// 新增：处理申请提交
const handleApplySubmit = (data: any) => {
  console.log("主播申请提交数据:", data);
  // 这里可以做后续逻辑，比如刷新用户信息等
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
