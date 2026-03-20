<template>
  <div class="flex h-full overflow-hidden select-none">
    <div
      :class="[
        'follow-container',
        isCollapsed ? 'w-[64px]' : 'w-[200px]',
        'flex flex-col overflow-hidden overflow-y-auto transition-all duration-300 select-none',
        'border-r border-[--line-color] bg-[--right-bg-color]'
      ]">
      <div :class="['mb-3 flex-y-center', isCollapsed ? 'justify-center' : 'justify-between']">
        <div v-show="!isCollapsed" class="font-medium text-[--text-color]">
          {{ $t("home.follow.followers", { count: followList.length }) }}
        </div>
        <n-button text type="primary" @click="toggleCollapse">
          <i-mdi-chevron-left
            v-if="!isCollapsed"
            class="hover:rounded-100% h-5 w-5 p-2 text-[--action-bar-icon-color] hover:bg-[--action-bar-icon-hover]" />
          <i-mdi-chevron-right
            v-else
            class="hover:rounded-100% h-5 w-5 p-2 text-[--action-bar-icon-color] hover:bg-[--action-bar-icon-hover]" />
        </n-button>
      </div>

      <div class="flex-1 overflow-hidden">
        <n-scrollbar class="h-full">
          <div class="mr-3 flex flex-col gap-[1px]">
            <div
              v-for="follow in followList"
              class="follow-item flex cursor-pointer items-center justify-between overflow-hidden rounded-lg py-2 transition-all duration-300 hover:bg-[--bg-left-menu-hover]"
              :key="follow.followUserId"
              :class="{ 'bg-[--bg-left-menu-hover]': activeUserId === follow.followUserId }"
              @click="handleSelectUser(follow)">
              <div class="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                <div class="relative ml-2 h-10 w-10 flex-shrink-0">
                  <img
                    v-if="!isCollapsed"
                    class="h-full w-full cursor-pointer rounded-full object-cover hover:bg-[--avatar-hover-bg]"
                    :src="follow.avatar"
                    :alt="follow.username" />
                  <n-popover
                    v-else
                    trigger="hover"
                    placement="right"
                    style="padding: 0; background: transparent"
                    :show-arrow="false"
                    :delay="200">
                    <template #trigger>
                      <img
                        class="h-full w-full cursor-pointer rounded-full object-cover hover:bg-[--avatar-hover-bg]"
                        :src="follow.avatar"
                        :alt="follow.username" />
                    </template>
                    <div
                      class="max-w-[100px] overflow-hidden rounded bg-[--bg-popover] px-2 py-1 text-sm text-ellipsis whitespace-nowrap text-[--text-color] shadow-sm">
                      {{ follow.username }}
                    </div>
                  </n-popover>
                </div>
                <div v-show="!isCollapsed" class="min-w-0 flex-1 overflow-hidden">
                  <div class="w-full truncate text-sm font-medium text-[--text-color]">{{ follow.username }}</div>
                  <div
                    v-show="follow.unseenCount > 0"
                    class="w-fit truncate rounded-sm bg-[--left-item-bg-color] px-1 py-[2px] text-[12px] text-[--user-text-color]">
                    {{ $t("home.follow.unseenCount", { count: follow.unseenCount }) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </div>

    <div class="flex-1 overflow-hidden bg-[--home-bg-color] py-4 pr-2 pl-4">
      <div
        ref="fullscreenWrapperRef"
        class="fullscreen-wrapper relative flex h-full w-full flex-row overflow-hidden rounded-lg bg-black shadow-sm"
        :class="{ 'is-fullscreen': isFullscreen }">
        <div class="relative h-full flex-1">
          <video-player
            v-if="playlistStore.currentVideo"
            :controls="true"
            :autoplay="true"
            :muted="false"
            :is-panel-open="showSidePanel"
            @open-panel="handleOpenPanel"
            @toggle-fullscreen="handleToggleFullscreen" />
          <div v-else class="flex h-full w-full items-center justify-center text-gray-500">
            {{ $t("home.follow.noVideo") }}
          </div>
        </div>

        <video-side-panel
          class="side-panel-transition"
          v-model:show="showSidePanel"
          v-model:tab="activePanelTab"
          :class="{ 'fullscreen-overlay': isFullscreen }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FollowItem } from "@/api/types";
import { getFollowingApi } from "@/api/follow";
import { usePlaylistStore } from "@/stores/playlist";
import { useFullscreen } from "@/hooks/useFullscreen";

defineOptions({
  name: "Follow"
});

const playlistStore = usePlaylistStore();

// 展开/缩放状态管理
const isCollapsed = ref(false);
// 关注列表数据
const followList = ref<FollowItem[]>([]);
const activeUserId = ref<number | null>(null); // 当前选中的关注用户ID
const showSidePanel = ref(false);
const activePanelTab = ref<"detail" | "comment">("comment");
const fullscreenWrapperRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggleFullscreen } = useFullscreen(fullscreenWrapperRef);

/** 处理全屏切换逻辑 */
const handleToggleFullscreen = () => {
  toggleFullscreen();
};

/**
 * 处理打开侧边栏并切换 Tab 的逻辑
 * @param args 包含 Tab 名称的参数数组，默认值为 "comment"
 */
const handleOpenPanel = (...args: any[]) => {
  isCollapsed.value = true;
  const tabName = (args[0] || "comment") as "detail" | "comment";
  // 如果面板已经是打开状态，且点击的是当前的 Tab，则关闭面板
  if (showSidePanel.value && activePanelTab.value === tabName) {
    showSidePanel.value = false;
  } else {
    // 否则，切换到对应的 Tab 并打开面板
    activePanelTab.value = tabName;
    showSidePanel.value = true;
  }
};

/** 切换展开/缩放状态 */
const toggleCollapse = () => {
  if (!showSidePanel.value) isCollapsed.value = !isCollapsed.value;
};

/**
 * 处理用户选择事件
 * @param user 选中的用户项
 */
const handleSelectUser = async (user: FollowItem) => {
  if (activeUserId.value === user.followUserId) {
    if (!showSidePanel.value) {
      showSidePanel.value = true;
      activePanelTab.value = "detail";
    }
    return;
  }

  activeUserId.value = user.followUserId;

  // 等待视频数据真正加载完成
  await playlistStore.fetchVideos(user.followUserId, user.username);
};

onMounted(async () => {
  try {
    followList.value = await getFollowingApi();
  } catch (_) {
    followList.value = [];
  } finally {
    if (!followList.value || followList.value.length === 0) {
      followList.value = [
        { followUserId: 101, username: "模拟用户A", avatar: "https://picsum.photos/60/60?1", unseenCount: 2 },
        { followUserId: 102, username: "模拟用户B", avatar: "https://picsum.photos/60/60?2", unseenCount: 0 }
      ];
    }

    // 初始化选中第一个用户
    if (followList.value.length > 0) {
      // 等待第一次选择和数据加载彻底完成
      await handleSelectUser(followList.value[0]);
    }
  }
});
</script>

<style scoped>
.follow-container {
  height: 100%;
  background-color: var(--right-bg-color);
  position: relative;
  transition:
    width 0.3s ease,
    background-color 0.3s ease;
}

.follow-item {
  transition: background-color 0.2s;
  color: var(--text-color);
  display: flex;
  width: 100%;
}

.follow-item:hover {
  background-color: var(--bg-left-menu-hover);
}

.fullscreen-wrapper {
  transition: all 0.3s ease;
}

/* 侧边栏动画与基础样式 */
.side-panel-transition {
  position: relative;
  z-index: 100;
  height: 100%;
}

.fullscreen-wrapper.is-fullscreen {
  border-radius: 0 !important;
}

.fullscreen-overlay {
  position: relative !important;
  height: 100%;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.6) !important;
}

:deep(.n-scrollbar) {
  width: 100%;
  overflow: hidden;
  transition: width 0.3s ease;
}

:deep(.n-scrollbar-content) {
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden;
}

:deep(.n-scrollbar-rail) {
  opacity: 50% !important;
  transition: opacity 0.3s ease;
  background-color: transparent;
}

.follow-container.w\[56px\] :deep(.n-scrollbar-rail) {
  opacity: 0 !important;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
