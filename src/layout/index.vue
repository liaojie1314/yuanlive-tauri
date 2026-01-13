<template>
  <div id="layout" class="relative flex min-w-310px bg-[--home-bg-color] h-full">
    <div class="flex flex-1 min-h-0">
      <keep-alive>
        <AsyncLeft />
      </keep-alive>
      <keep-alive>
        <AsyncRight />
      </keep-alive>
    </div>
    <div v-if="overlayVisible" class="absolute inset-0 z-10 flex items-center justify-center bg-[--right-bg-color]">
      <LoadingSpinner :percentage="loadingPercentage" :loading-text="loadingText" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useOverlayController } from "@/hooks/useOverlayController";
import { useLogin } from "@/hooks/useLogin";

const { logout } = useLogin();

// 是否需要阻塞首屏
const requiresInitialSync = ref(true);
const loadingPercentage = ref(10);
const loadingText = ref("正在加载应用...");
// TODO: 记录首次登录状态，避免重复阻塞首屏
const shouldBlockInitialRender = computed(() => requiresInitialSync.value);
const { overlayVisible, markAsyncLoaded } = useOverlayController({
  isInitialSync: shouldBlockInitialRender,
  progress: loadingPercentage,
  asyncTotal: 2,
  minDisplayMs: 600
});

// 修改异步组件的加载配置 - 优化加载性能
const AsyncLeft = defineAsyncComponent({
  loader: async () => {
    loadingText.value = "正在加载左侧面板...";
    const comp = await import("./left/index.vue");
    loadingPercentage.value = 50;
    markAsyncLoaded();
    return comp;
  },
  delay: 0, // 立即显示加载状态
  timeout: 3000 // 3秒超时
});

const AsyncRight = defineAsyncComponent({
  loader: async () => {
    loadingText.value = "正在加载右侧面板...";
    const comp = await import("./right/index.vue");
    loadingPercentage.value = 100;
    markAsyncLoaded();
    return comp;
  },
  delay: 0, // 立即显示加载状态
  timeout: 3000 // 3秒超时
});

listen("reLogin", async () => {
  await logout();
});

onMounted(async () => {
  const homeWindow = await WebviewWindow.getByLabel("home");
  if (homeWindow) {
    // 居中
    await homeWindow.center();
    await homeWindow.show();
  }
});
</script>

<style scoped></style>
