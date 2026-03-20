<template>
  <div class="h-full w-full overflow-hidden bg-[--home-bg-color] p-4">
    <div class="absolute top-6 left-6 z-50">
      <n-button secondary circle class="shadow-md" @click="handleBack">
        <template #icon>
          <i-mdi-arrow-left class="text-xl" />
        </template>
      </n-button>
    </div>
    <div
      ref="fullscreenWrapperRef"
      class="relative flex h-full w-full flex-row overflow-hidden rounded-lg bg-black shadow-sm"
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
      </div>

      <video-side-panel
        class="side-panel-transition"
        v-model:show="showSidePanel"
        v-model:tab="activePanelTab"
        :class="{ 'fullscreen-overlay': isFullscreen }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlaylistStore } from "@/stores/playlist";
import { useFullscreen } from "@/hooks/useFullscreen";

const router = useRouter();
const playlistStore = usePlaylistStore();

const showSidePanel = ref(true);
const activePanelTab = ref<"detail" | "comment">("comment");
const fullscreenWrapperRef = ref<HTMLElement | null>(null);
const { isFullscreen, toggleFullscreen } = useFullscreen(fullscreenWrapperRef);

/** 处理全屏切换逻辑 */
const handleToggleFullscreen = () => {
  toggleFullscreen();
};

/** 返回上一页 */
const handleBack = () => {
  router.back();
};

/**
 * 处理打开/关闭侧边面板的逻辑
 * @param args 可以传入一个参数来指定要打开的面板（"detail" 或 "comment"），默认是 "comment"
 */
const handleOpenPanel = (...args: any[]) => {
  const tabName = (args[0] || "comment") as "detail" | "comment";
  if (showSidePanel.value && activePanelTab.value === tabName) {
    showSidePanel.value = false;
  } else {
    activePanelTab.value = tabName;
    showSidePanel.value = true;
  }
};
</script>
