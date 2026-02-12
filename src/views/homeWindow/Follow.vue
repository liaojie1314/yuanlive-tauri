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

    <div class="flex-1 flex flex-col p-4 bg-[--home-bg-color]">
      <div class="flex-1 rounded-lg overflow-hidden bg-black shadow-sm">
        <video-player src="http://vjs.zencdn.net/v/oceans.mp4" :controls="true" :autoplay="false" :muted="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFollowingApi } from "@/api/follow";

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

// 切换展开/缩放状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
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
