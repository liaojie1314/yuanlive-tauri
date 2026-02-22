<template>
  <div class="flex h-full overflow-hidden">
    <div
      :class="[
        'follow-container',
        isCollapsed ? 'w-[64px]' : 'w-[200px]',
        'flex flex-col overflow-y-auto select-none overflow-hidden transition-all duration-300',
        'bg-[--right-bg-color] border-r border-[--line-color]'
      ]">
      <div :class="['flex items-center mb-3', isCollapsed ? 'justify-center px-2' : 'justify-between px-4']">
        <div v-show="!isCollapsed" class="font-medium text-[--text-color]">关注人({{ followList.length }})</div>
        <n-button text type="primary" @click="toggleCollapse">
          <i-mdi-chevron-left
            v-if="!isCollapsed"
            class="w-5 h-5 text-[--action-bar-icon-color] hover:text-[--action-bar-icon-hover]" />
          <i-mdi-chevron-right
            v-else
            class="w-5 h-5 text-[--action-bar-icon-color] hover:text-[--action-bar-icon-hover]" />
        </n-button>
      </div>

      <div class="flex-1 overflow-hidden">
        <n-scrollbar class="h-full">
          <div class="flex flex-col gap-[1px] mr-3">
            <div
              v-for="follow in followList"
              :key="follow.id"
              class="follow-item flex items-center justify-between py-2 rounded-lg cursor-pointer overflow-hidden transition-all duration-300 hover:bg-[--bg-left-menu-hover]">
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
                    {{ follow.unseenCount }}个作品未看
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
            src="http://vjs.zencdn.net/v/oceans.mp4"
            :controls="true"
            :autoplay="false"
            :muted="false"
            :is-panel-open="showSidePanel"
            @open-panel="handleOpenPanel"
            @toggle-fullscreen="handleToggleFullscreen" />
        </div>

        <video-side-panel
          v-model:show="showSidePanel"
          v-model:tab="activePanelTab"
          class="side-panel-transition"
          :class="{ 'fullscreen-overlay': isFullscreen }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFollowingApi } from "@/api/follow";
import { useFullscreen } from "@/hooks/useFullscreen";

defineOptions({
  name: "Follow"
});

// 定义关注列表项的接口
interface FollowItem {
  id: number;
  username: string;
  avatar: string;
  unseenCount: number;
}

// 展开/缩放状态管理
const isCollapsed = ref(false);
// 关注列表数据
const followList = ref<FollowItem[]>([]);

const showSidePanel = ref(false);
const activePanelTab = ref<"detail" | "comment">("comment");
const fullscreenWrapperRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggleFullscreen } = useFullscreen(fullscreenWrapperRef);

// 处理全屏切换逻辑
const handleToggleFullscreen = () => {
  toggleFullscreen();
};

// 接收播放器抛出的事件来打开侧边栏，并切换到对应的 Tab
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

// 切换展开/缩放状态
const toggleCollapse = () => {
  if (!showSidePanel.value) isCollapsed.value = !isCollapsed.value;
};

onMounted(async () => {
  followList.value = await getFollowingApi();
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
