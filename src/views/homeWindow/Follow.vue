<template>
  <div class="flex h-full overflow-hidden">
    <div
      :class="[
        'follow-container',
        isCollapsed ? 'w-[64px]' : 'w-[200px]',
        'flex flex-col overflow-y-auto select-none overflow-hidden transition-all duration-300',
        'bg-[--right-bg-color] border-r border-[--line-color]'
      ]">
      <div :class="['flex items-center mb-3', isCollapsed ? 'justify-center' : 'justify-between']">
        <div v-show="!isCollapsed" class="font-medium text-[--text-color]">
          {{ $t("home.follow.followers", { count: followList.length }) }}
        </div>
        <n-button text type="primary" @click="toggleCollapse">
          <i-mdi-chevron-left
            v-if="!isCollapsed"
            class="w-5 h-5 p-2 text-[--action-bar-icon-color] hover:bg-[--action-bar-icon-hover] hover:rounded-100%" />
          <i-mdi-chevron-right
            v-else
            class="w-5 h-5 p-2 text-[--action-bar-icon-color] hover:bg-[--action-bar-icon-hover] hover:rounded-100%" />
        </n-button>
      </div>

      <div class="flex-1 overflow-hidden">
        <n-scrollbar class="h-full">
          <div class="flex flex-col gap-[1px] mr-3">
            <div
              v-for="follow in followList"
              :key="follow.followUserId"
              class="follow-item flex items-center justify-between py-2 rounded-lg cursor-pointer overflow-hidden transition-all duration-300 hover:bg-[--bg-left-menu-hover]"
              :class="{ 'bg-[--bg-left-menu-hover]': activeUserId === follow.followUserId }"
              @click="handleSelectUser(follow)">
              <div class="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                <div class="ml-2 relative w-10 h-10 flex-shrink-0">
                  <img
                    v-if="!isCollapsed"
                    :src="follow.avatar"
                    :alt="follow.username"
                    class="w-full h-full rounded-full object-cover cursor-pointer hover:bg-[--avatar-hover-bg]" />
                  <n-popover
                    v-else
                    trigger="hover"
                    placement="right"
                    :show-arrow="false"
                    :delay="200"
                    style="padding: 0; background: transparent">
                    <template #trigger>
                      <img
                        :src="follow.avatar"
                        :alt="follow.username"
                        class="w-full h-full rounded-full object-cover cursor-pointer hover:bg-[--avatar-hover-bg]" />
                    </template>
                    <div
                      class="px-2 py-1 text-sm rounded max-w-[100px] whitespace-nowrap overflow-hidden text-ellipsis bg-[--bg-popover] text-[--text-color] shadow-sm">
                      {{ follow.username }}
                    </div>
                  </n-popover>
                </div>
                <div v-show="!isCollapsed" class="flex-1 min-w-0 overflow-hidden">
                  <div class="text-sm font-medium truncate w-full text-[--text-color]">{{ follow.username }}</div>
                  <div
                    v-show="follow.unseenCount > 0"
                    class="w-fit text-[12px] px-1 py-[2px] rounded-sm truncate bg-[--left-item-bg-color] text-[--user-text-color]">
                    {{ $t("home.follow.unseenCount", { count: follow.unseenCount }) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </div>

    <div class="flex-1 py-4 pl-4 pr-2 bg-[--home-bg-color] overflow-hidden">
      <div
        ref="fullscreenWrapperRef"
        class="fullscreen-wrapper w-full h-full flex flex-row relative rounded-lg overflow-hidden bg-black shadow-sm"
        :class="{ 'is-fullscreen': isFullscreen }">
        <div class="flex-1 relative h-full">
          <video-player
            v-if="currentVideo"
            :controls="true"
            :autoplay="true"
            :muted="false"
            :is-panel-open="showSidePanel"
            @open-panel="handleOpenPanel"
            @toggle-fullscreen="handleToggleFullscreen" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
            {{ $t("home.follow.noVideo") }}
          </div>
        </div>

        <video-side-panel
          v-model:show="showSidePanel"
          v-model:tab="activePanelTab"
          :user-id="activeUserId"
          :user-name="activeUserName"
          class="side-panel-transition"
          :class="{ 'fullscreen-overlay': isFullscreen }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MittEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";
import { useFullscreen } from "@/hooks/useFullscreen";
import { getFollowingApi, type VideoItem, type FollowItem } from "@/api/follow";

defineOptions({
  name: "Follow"
});

// 展开/缩放状态管理
const isCollapsed = ref(false);
// 关注列表数据
const followList = ref<FollowItem[]>([]);
const activeUserId = ref<number | null>(null); // 当前选中的关注用户ID
const currentVideo = ref<VideoItem | null>(null); // 当前正在播放的视频数据
const showSidePanel = ref(false);
const activePanelTab = ref<"detail" | "comment">("comment");
const fullscreenWrapperRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggleFullscreen } = useFullscreen(fullscreenWrapperRef);
const activeUserName = computed(() => {
  return activeUserId.value ? followList.value.find((f) => f.followUserId === activeUserId.value)?.username || "" : "";
});

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
 * 处理接收侧边栏传来的视频选择事件
 * @param video 选中的视频项
 */
const handlePlayVideo = (video: VideoItem) => {
  currentVideo.value = video;
};

/**
 * 处理用户选择事件
 * @param user 选中的用户项
 */
const handleSelectUser = (user: any) => {
  if (activeUserId.value === user.followUserId) {
    if (!showSidePanel.value) {
      showSidePanel.value = true;
      activePanelTab.value = "detail";
    }
    return;
  }
  activeUserId.value = user.followUserId;
};

onMounted(async () => {
  useMitt.on(MittEnum.PLAY_VIDEO, handlePlayVideo);

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
      handleSelectUser(followList.value[0]);
    }
  }
});

onUnmounted(() => {
  useMitt.off(MittEnum.PLAY_VIDEO, handlePlayVideo);
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
