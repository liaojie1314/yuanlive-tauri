<template>
  <n-popover
    trigger="click"
    placement="right-start"
    :show-arrow="false"
    style="
      padding: 16px;
      border-radius: 16px;
      background-color: var(--bg-popover);
      border: 1px solid var(--line-color);
      width: 280px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
    ">
    <template #trigger>
      <slot></slot>
    </template>

    <div class="user-popover-content flex flex-col gap-3">
      <!-- 头部：头像与操作按钮 -->
      <div class="flex justify-between items-start">
        <div class="w-14 h-14 rounded-full overflow-hidden border border-[--line-color] shrink-0">
          <img :src="user.avatar" class="w-full h-full object-cover" />
        </div>
        <div class="flex gap-2 items-center mt-1">
          <!-- 关注按钮 (动态状态) -->
          <div
            @click="handleFollow"
            :class="[
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              user.isFollowing
                ? 'bg-[--bg-setting-item] hover:bg-[--bg-menu-hover] text-[--user-text-color]'
                : 'bg-[#ff0050] hover:bg-[#ff1a60] text-white'
            ]">
            {{ user.isFollowing ? "已关注" : "+ 关注" }}
          </div>
          <div
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-[--line-color] bg-transparent hover:bg-[--bg-menu-hover] text-[--text-color] transition-colors cursor-pointer">
            <i-mdi-at class="w-4 h-4 opacity-80" />
          </div>
          <div
            @click="openReportDialog"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-[--line-color] bg-transparent hover:bg-[--bg-menu-hover] text-[--text-color] transition-colors cursor-pointer">
            <i-mdi-alert-outline class="w-4 h-4 opacity-80" />
          </div>
        </div>
      </div>

      <!-- 用户名与等级 -->
      <div class="flex items-center gap-2 mt-1">
        <span class="text-xl font-bold text-[--text-color] truncate max-w-[180px]">{{ user.name }}</span>
        <div
          class="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] flex items-center gap-1 shrink-0 font-medium">
          <i-material-symbols-diamond class="w-3 h-3 text-yellow-200" />
          {{ user.level || "1" }}
        </div>
      </div>

      <!-- 性别与年龄 (动态状态) -->
      <div class="flex" v-if="user.age || user.gender">
        <span
          class="px-2 py-0.5 rounded-full bg-[--bg-setting-item] text-xs flex items-center gap-1"
          :class="user.gender === 1 ? 'text-blue-400' : 'text-pink-400'">
          <i-mdi-gender-male v-if="user.gender === 1" />
          <i-mdi-gender-female v-else-if="user.gender === 2" />
          <span v-if="user.age">{{ user.age }}岁</span>
        </span>
      </div>

      <!-- 数据统计 -->
      <div class="text-[13px] text-[--text-color] mt-2">
        <span class="font-bold text-base">{{ formatNumber(user.following || 0) }}</span>
        <span class="text-[--user-text-color] ml-1">关注</span>
        <span class="mx-2 text-[--user-text-color]">·</span>
        <span class="font-bold text-base">{{ formatNumber(user.followers || 0) }}</span>
        <span class="text-[--user-text-color] ml-1">粉丝</span>
      </div>

      <!-- 底部：粉丝团与会员状态 -->
      <div class="relative flex h-9 mt-3 rounded-lg overflow-hidden text-xs bg-[#f4f5f7] dark:bg-gray-800 z-0">
        <div
          class="absolute left-0 top-0 h-full bg-[#fff6ed] dark:bg-orange-900/30 border-r-2 border-white dark:border-[#2a2a2a] z-0 pointer-events-none"
          style="width: calc(50% + 10px); transform: skewX(-15deg); transform-origin: top left; left: -10px"></div>

        <!-- 粉丝团内容 (动态状态) -->
        <div class="relative z-10 flex-1 flex items-center justify-between pl-3 pr-4 group cursor-pointer">
          <div
            class="absolute top-0 bottom-0 left-0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors z-0 pointer-events-none"
            style="width: calc(100% + 10px); transform: skewX(-15deg); transform-origin: top left; left: -10px"></div>
          <span class="text-[#eb7333] text-[13px] font-medium z-10">
            {{ user.fanClub?.isJoined ? `粉丝团 Lv.${user.fanClub.level}` : "加入粉丝团" }}
          </span>
          <i-mdi-heart class="text-[#f99b43] w-4 h-4 z-10" />
        </div>

        <!-- 会员内容 (动态状态) -->
        <div class="relative z-10 flex-1 flex items-center justify-between pl-4 pr-3 group cursor-pointer">
          <div
            class="absolute top-0 bottom-0 right-0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors z-0 pointer-events-none"
            style="
              width: calc(100% + 10px);
              transform: skewX(-15deg);
              transform-origin: bottom right;
              right: -10px;
            "></div>
          <span
            class="text-[13px] font-medium z-10"
            :class="user.vip?.isVip ? 'text-yellow-600 dark:text-yellow-500' : 'text-[#8b929e]'">
            {{ user.vip?.isVip ? "尊贵会员" : "会员未开通" }}
          </span>
          <span
            class="italic text-base font-serif pr-1 z-10"
            :class="user.vip?.isVip ? 'text-yellow-500 font-black' : 'text-[#d4d8de] font-bold'">
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

/** 打开举报弹窗 */
const openReportDialog = () => {
  showReportDialog.value = true;
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
