<template>
  <div
    class="light:bg-gradient-to-br light:from-blue-50 light:to-blue-100 rounded-lg border border-transparent p-5 transition-colors duration-300 dark:border-[--line-color] dark:bg-[--bg-setting-item]">
    <div class="flex-between-center gap-5">
      <div class="group relative shrink-0">
        <div class="avatar-border-animation"></div>
        <img
          loading="lazy"
          class="relative z-10 h-24 w-24 cursor-pointer rounded-full border-4 border-transparent object-cover transition-transform group-hover:scale-105"
          :src="userInfo?.avatar"
          :alt="$t('components.userInfo.imgAlt', { username: userInfo?.username })"
          @click="openEditDialog" />
      </div>

      <div class="flex flex-1 flex-col gap-2">
        <div class="flex-y-center gap-2">
          <span class="cursor-pointer text-2xl font-semibold text-[--text-color] transition-colors hover:text-blue-500">
            {{ userInfo?.username }}
          </span>
          <span title="认证用户" class="text-xl font-bold text-blue-500">
            <i-mdi-check-decagram />
          </span>
        </div>

        <div class="flex-y-center gap-2 text-sm whitespace-nowrap text-[--user-text-color]">
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('following')">
            {{ $t("components.userInfo.following") }}
            <span class="font-medium text-[--text-color]">{{ animatedFollowingCount }}</span>
          </span>
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('followers')">
            {{ $t("components.userInfo.followers") }}
            <span class="font-medium text-[--text-color]">{{ animatedFollowerCount }}</span>
          </span>
          <span class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500">
            {{ $t("components.userInfo.likes") }}
            <span class="font-medium text-[--text-color]">{{ animatedLikesCount }}</span>
          </span>
        </div>

        <div class="text-sm text-[--user-text-color]">
          <span class="mr-2">{{ $t("components.userInfo.uid") }}</span>
          <span class="font-medium text-[--text-color]">{{ userInfo?.uid }}</span>
        </div>
      </div>

      <div class="flex h-24 flex-col items-end justify-center gap-3">
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
          {{ $t("components.userInfo.applyAnchor") }}
        </n-button>

        <div class="flex-center w-full gap-2.5 text-xs text-[--user-text-color]">
          <span class="whitespace-nowrap">{{ $t("components.userInfo.saveLoginInfo") }}</span>
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
import { useNumberAnimation } from "@/hooks/useNumberAnimation";

const { userInfo } = useUserStore();
const animatedFollowingCount = useNumberAnimation(() => userInfo?.userStats.followingCount || 0);
const animatedFollowerCount = useNumberAnimation(() => userInfo?.userStats.followerCount || 0);
const animatedLikesCount = useNumberAnimation(() => userInfo?.userStats.totalLikesReceived || 0);

const props = defineProps(["saveLoginInfo"]);
const emit = defineEmits(["update:saveLoginInfo"]);

const dialogVisible = ref(false);
const activeTab = ref<"following" | "followers">("following");
const editDialogVisible = ref(false);
// 申请主播弹窗状态
const applyDialogVisible = ref(false);

const saveLoginInfoLocal = computed({
  get: () => props.saveLoginInfo,
  set: (val) => emit("update:saveLoginInfo", val)
});

/**
 * 打开关注列表弹窗
 * @param tab 关注类型，following 或 followers
 */
const openFollowDialog = (tab: "following" | "followers") => {
  activeTab.value = tab;
  dialogVisible.value = true;
};

/** 打开编辑个人信息弹窗 */
const openEditDialog = () => {
  editDialogVisible.value = true;
};

/** 打开主播申请弹窗 */
const openApplyDialog = () => {
  applyDialogVisible.value = true;
};

/**
 * 处理主播申请提交
 * @param data 主播申请数据
 */
const handleApplySubmit = (data: any) => {
  console.log("主播申请提交数据:", data);
  // TODO: 发送申请主播请求
};
</script>

<style scoped lang="scss">
// 定义 CSS 变量类型，允许浏览器对其进行动画插值
@property --angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.avatar-border-animation {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  z-index: 0;
  background: conic-gradient(from var(--angle), #ff4545, #00ff99, #006aff, #ff0095, #ff4545);
  animation: rotate 3s linear infinite;
  padding: 3px;

  /* 1. 标准属性 (Standard) - 针对 Firefox 和未来浏览器 */
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;

  /* 2. WebKit 前缀 (Vendor Prefix) - 针对 Chrome, Safari, Edge */
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
}

@keyframes rotate {
  to {
    --angle: 360deg;
  }
}

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
