<template>
  <n-popover
    trigger="click"
    placement="right-start"
    style="
      padding: 16px;
      border-radius: 16px;
      background-color: var(--bg-popover);
      border: 1px solid var(--line-color);
      width: 280px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
    "
    v-model:show="showPopover"
    :show-arrow="false">
    <template #trigger>
      <slot></slot>
    </template>

    <div class="user-popover-content flex flex-col gap-3">
      <!-- 头部：头像与操作按钮 -->
      <div class="flex items-start justify-between">
        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[--line-color]">
          <img class="h-full w-full object-cover" :src="user.avatar" />
        </div>
        <div class="mt-1 flex-y-center gap-2">
          <!-- 关注按钮 (动态状态) -->
          <div
            :class="[
              'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              user.isFollowing
                ? 'bg-[--bg-setting-item] text-[--user-text-color] hover:bg-[--bg-menu-hover]'
                : 'bg-[#ff0050] text-white hover:bg-[#ff1a60]'
            ]"
            @click="handleFollow">
            {{ user.isFollowing ? "已关注" : "+ 关注" }}
          </div>
          <div
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[--line-color] bg-transparent text-[--text-color] transition-colors hover:bg-[--bg-menu-hover]">
            <i-mdi-at class="h-4 w-4 opacity-80" />
          </div>
          <div
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[--line-color] bg-transparent text-[--text-color] transition-colors hover:bg-[--bg-menu-hover]"
            @click="openReportDialog">
            <i-mdi-alert-outline class="h-4 w-4 opacity-80" />
          </div>
        </div>
      </div>

      <!-- 用户名与等级 -->
      <div class="mt-1 flex-y-center gap-2">
        <span class="max-w-[180px] truncate text-xl font-bold text-[--text-color]">{{ user.name }}</span>
        <div
          class="flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
          <i-material-symbols-diamond class="h-3 w-3 text-yellow-200" />
          {{ user.level || "1" }}
        </div>
      </div>

      <!-- 性别与年龄 (动态状态) -->
      <div v-if="user.age || user.gender" class="flex">
        <span
          class="flex-y-center gap-1 rounded-full bg-[--bg-setting-item] px-2 py-0.5 text-xs"
          :class="user.gender === 1 ? 'text-blue-400' : 'text-pink-400'">
          <i-mdi-gender-male v-if="user.gender === 1" />
          <i-mdi-gender-female v-else-if="user.gender === 2" />
          <span v-if="user.age">{{ user.age }}岁</span>
        </span>
      </div>

      <!-- 数据统计 -->
      <div class="mt-2 text-[13px] text-[--text-color]">
        <span class="text-base font-bold">{{ formatNumber(user.following || 0) }}</span>
        <span class="ml-1 text-[--user-text-color]">关注</span>
        <span class="mx-2 text-[--user-text-color]">·</span>
        <span class="text-base font-bold">{{ formatNumber(user.followers || 0) }}</span>
        <span class="ml-1 text-[--user-text-color]">粉丝</span>
      </div>

      <!-- 底部：粉丝团与会员状态 -->
      <div class="relative z-0 mt-3 flex h-9 overflow-hidden rounded-lg bg-[#f4f5f7] text-xs dark:bg-gray-800">
        <div
          style="width: calc(50% + 10px); transform: skewX(-15deg); transform-origin: top left; left: -10px"
          class="pointer-events-none absolute top-0 left-0 z-0 h-full border-r-2 border-white bg-[#fff6ed] dark:border-[#2a2a2a] dark:bg-orange-900/30"></div>

        <!-- 粉丝团内容 (动态状态) -->
        <div class="group relative z-10 flex flex-1 cursor-pointer items-center justify-between pr-4 pl-3">
          <div
            style="width: calc(100% + 10px); transform: skewX(-15deg); transform-origin: top left; left: -10px"
            class="pointer-events-none absolute top-0 bottom-0 left-0 z-0 transition-colors group-hover:bg-black/5 dark:group-hover:bg-white/5"></div>
          <span class="z-10 text-[13px] font-medium text-[#eb7333]">
            {{
              user.isBroadcaster
                ? `粉丝团 ${formatNumber(user.fanClubCount || 0)}人`
                : user.fanClub?.isJoined
                  ? `粉丝团 Lv.${user.fanClub.level}`
                  : "加入粉丝团"
            }}
          </span>
          <i-mdi-heart class="z-10 h-4 w-4 text-[#f99b43]" />
        </div>

        <!-- 会员内容 (动态状态) -->
        <div class="group relative z-10 flex flex-1 cursor-pointer items-center justify-between pr-3 pl-4">
          <div
            style="width: calc(100% + 10px); transform: skewX(-15deg); transform-origin: bottom right; right: -10px"
            class="pointer-events-none absolute top-0 right-0 bottom-0 z-0 transition-colors group-hover:bg-black/5 dark:group-hover:bg-white/5"></div>
          <span
            class="z-10 text-[13px] font-medium"
            :class="user.isBroadcaster || user.vip?.isVip ? 'text-yellow-600 dark:text-yellow-500' : 'text-[#8b929e]'">
            {{
              user.isBroadcaster
                ? `会员 ${formatNumber(user.vipCount || 0)}人`
                : user.vip?.isVip
                  ? "尊贵会员"
                  : "会员未开通"
            }}
          </span>
          <span
            class="z-10 pr-1 font-serif text-base italic"
            :class="user.vip?.isVip ? 'font-black text-yellow-500' : 'font-bold text-[#d4d8de]'">
            V
          </span>
        </div>
      </div>
    </div>
  </n-popover>
  <user-report-dialog v-model:show="showReportDialog" :user-id="user.id" @submit-report="handleUserReportSubmit" />
</template>

<script setup lang="ts">
import { formatNumber } from "@/utils/FormattingUtils";

export interface PopoverUser {
  id?: string | number;
  name: string;
  avatar: string;
  level?: string | number;
  gender?: 0 | 1 | 2; // 0:未知, 1:男, 2:女
  age?: number | string;
  following?: number;
  followers?: number;
  isFollowing?: boolean;
  isBroadcaster?: boolean; // 是否是房主/主播
  fanClubCount?: number; // 粉丝团总人数
  vipCount?: number; // 会员总人数
  fanClub?: {
    isJoined: boolean;
    level?: number;
  };
  vip?: {
    isVip: boolean;
    level?: number;
  };
}

const props = defineProps<{
  user: PopoverUser;
}>();

const emit = defineEmits<{
  "follow-change": [userId: string | number | undefined, isFollowing: boolean];
}>();

const showReportDialog = ref(false);
const showPopover = ref(false);

/** 打开举报弹窗 */
const openReportDialog = () => {
  showReportDialog.value = true;
  showPopover.value = false;
};

/**
 * 处理用户举报提交
 * @param userId 用户ID
 * @param type 举报类型
 * @param description 举报描述
 */
const handleUserReportSubmit = (userId: number | string, type: string, description: string) => {
  console.log(`举报用户ID: ${userId}, 类型: ${type}, 描述: ${description}`);
  // TODO: 这里调用后端接口提交举报数据

  window.$message?.success("举报已提交，我们会尽快核实处理！");
  showReportDialog.value = false;
};

/** 处理关注点击 */
const handleFollow = () => {
  emit("follow-change", props.user.id, !props.user.isFollowing);
};
</script>
