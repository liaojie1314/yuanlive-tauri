<template>
  <div class="flex h-full overflow-hidden">
    <!-- 左侧关注列表 -->
    <div
      :class="[
        'follow-container',
        isCollapsed ? 'w-[64px]' : 'w-[200px]',
        'flex flex-col overflow-y-auto select-none overflow-hidden transition-all duration-300'
      ]">
      <!-- 顶部标题区域 -->
      <div :class="['flex items-center mb-3', isCollapsed ? 'justify-center px-2' : 'justify-between px-4']">
        <div v-show="!isCollapsed" class="font-medium">精选关注人(30)</div>
        <n-button text type="primary" @click="toggleCollapse">
          <i-mdi-chevron-left v-if="!isCollapsed" class="w-5 h-5" />
          <i-mdi-chevron-right v-else class="w-5 h-5" />
        </n-button>
      </div>

      <!-- 关注列表 -->
      <div class="flex-1 overflow-hidden">
        <n-scrollbar class="h-full">
          <div class="flex flex-col gap-[1px] mr-3">
            <div
              v-for="follow in followList"
              :key="follow.id"
              class="follow-item flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg cursor-pointer overflow-hidden transition-all duration-300">
              <div class="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                <!-- 头像区域，折叠时hover显示名称 -->
                <div class="ml-2 relative w-10 h-10 flex-shrink-0">
                  <img
                    v-if="!isCollapsed"
                    :src="follow.avatar"
                    :alt="follow.name"
                    class="w-full h-full rounded-full object-cover cursor-pointer" />
                  <n-popover v-else trigger="hover" placement="right" :show-arrow="false" :delay="200">
                    <!-- 头像作为触发元素 -->
                    <template #trigger>
                      <img
                        :src="follow.avatar"
                        :alt="follow.name"
                        class="w-full h-full rounded-full object-cover cursor-pointer" />
                    </template>
                    <!-- 弹出内容，仅在折叠状态下显示，限制长度 -->
                    <div
                      class="px-2 py-1 text-sm rounded max-w-[100px] bg-white text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                      {{ follow.name }}
                    </div>
                  </n-popover>
                </div>
                <!-- 名称和未读计数（展开状态下显示） -->
                <div v-show="!isCollapsed" class="flex-1 min-w-0 overflow-hidden">
                  <div class="text-sm font-medium truncate w-full">{{ follow.name }}</div>
                  <div
                    v-show="follow.unreadCount > 0"
                    class="w-fit bg-gray-300 text-gray-700 text-[12px] px-1 py-[2px] rounded-sm truncate">
                    {{ follow.unreadCount }}个作品未看
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </div>

    <!-- 右侧视频播放区域 -->
    <div class="flex-1 bg-gray-100 flex flex-col p-4">
      <div class="flex-1 bg-black rounded-lg overflow-hidden">
        <video-player src="http://vjs.zencdn.net/v/oceans.mp4" :controls="true" :autoplay="false" :muted="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Follow"
});

// 定义关注列表项的接口
interface FollowItem {
  id: number;
  name: string;
  avatar: string;
  unreadCount: number;
  hasBadge?: boolean;
}

// 展开/缩放状态管理
const isCollapsed = ref(false);

// 切换展开/缩放状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 模拟关注列表数据
const followList = ref<FollowItem[]>([
  { id: 1, name: "皇甫极", avatar: "https://picsum.photos/id/64/100/100", unreadCount: 0 },
  { id: 2, name: "中国军号", avatar: "https://picsum.photos/id/65/100/100", unreadCount: 21, hasBadge: true },
  { id: 3, name: "春娇与志明", avatar: "https://picsum.photos/id/66/100/100", unreadCount: 0 },
  { id: 4, name: "阿Z想开了", avatar: "https://picsum.photos/id/67/100/100", unreadCount: 2 },
  { id: 5, name: "富贵哥", avatar: "https://picsum.photos/id/68/100/100", unreadCount: 0 },
  { id: 6, name: "千年小爱同学", avatar: "https://picsum.photos/id/69/100/100", unreadCount: 2 },
  { id: 7, name: "李帆收藏家", avatar: "https://picsum.photos/id/70/100/100", unreadCount: 1 },
  { id: 8, name: "水生生水~~~", avatar: "https://picsum.photos/id/71/100/100", unreadCount: 1 },
  { id: 9, name: "天才北极星", avatar: "https://picsum.photos/id/72/100/100", unreadCount: 0 },
  { id: 10, name: "原理大揭秘", avatar: "https://picsum.photos/id/73/100/100", unreadCount: 11 },
  { id: 11, name: "二狗脱口秀", avatar: "https://picsum.photos/id/74/100/100", unreadCount: 0 },
  { id: 12, name: "老王足球观察", avatar: "https://picsum.photos/id/75/100/100", unreadCount: 2 },
  { id: 13, name: "布丁的猫meme", avatar: "https://picsum.photos/id/76/100/100", unreadCount: 0 },
  {
    id: 14,
    name: "王者荣耀树叶（aaaaaaaaaaaaaaaaaaaaaaaaaa",
    avatar: "https://picsum.photos/id/77/100/100",
    unreadCount: 0
  },
  { id: 15, name: "尚小贺✨（上学中）", avatar: "https://picsum.photos/id/78/100/100", unreadCount: 1 },
  { id: 16, name: "墨瑜（王者小店在橱……", avatar: "https://picsum.photos/id/79/100/100", unreadCount: 0 }
]);
</script>

<style scoped>
.follow-container {
  height: 100%;
  background-color: var(--home-bg-color);
  position: relative;
  transition: width 0.3s ease;
}

.follow-item {
  transition: background-color 0.2s;
  color: var(--text-color);
  display: flex;
  width: 100%;
}

.follow-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
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
}

/* 在缩放状态下隐藏滚动条轨道 */
.follow-container.w\[56px\] :deep(.n-scrollbar-rail) {
  opacity: 0 !important;
}

/* 确保文本截断正常工作 */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
