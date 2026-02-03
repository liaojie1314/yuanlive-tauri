<template>
  <div id="layout" class="relative flex min-w-310px bg-[--home-bg-color] h-full">
    <div class="flex flex-1 min-h-0">
      <AsyncLeft />
      <AsyncRight />
    </div>
    <div v-if="overlayVisible" class="absolute inset-0 z-10 flex items-center justify-center">
      <loading-spinner :percentage="loadingPercentage" :loading-text="loadingText" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useLogin } from "@/hooks/useLogin";
import { useCheckUpdate } from "@/hooks/useCheckUpdate";
import { useOverlayController } from "@/hooks/useOverlayController";
import { useGlobalStore } from "@/stores/global";

const { logout } = useLogin();
const { checkUpdate, CHECK_UPDATE_TIME } = useCheckUpdate();
const globalStore = useGlobalStore();
const { firstEnter } = storeToRefs(globalStore);

// 是否需要阻塞首屏
const requiresInitialSync = ref(true);
const loadingPercentage = ref(10);
const loadingText = ref("正在加载应用...");
// 记录首次登录状态，避免重复阻塞首屏
const shouldBlockInitialRender = computed(() => requiresInitialSync.value && firstEnter.value);
const { overlayVisible, markAsyncLoaded } = useOverlayController({
  isInitialSync: shouldBlockInitialRender,
  progress: loadingPercentage,
  asyncTotal: 2,
  minDisplayMs: 600
});

// 导入Web Worker
const timerWorker = new Worker(new URL("@/workers/timer.worker.ts", import.meta.url));

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

// 添加错误处理
timerWorker.onerror = (error) => {
  console.error("[Worker Error]", error);
};

// 监听 Worker 消息
timerWorker.onmessage = (e) => {
  const { type } = e.data;
  if (type === "timeout") {
    checkUpdate("home");
  }
};

onMounted(async () => {
  const homeWindow = await WebviewWindow.getByLabel("home");
  if (homeWindow) {
    // 居中
    if (firstEnter.value) {
      await homeWindow.center();
      firstEnter.value = false;
    }
    await homeWindow.show();
  }
  timerWorker.postMessage({
    type: "startTimer",
    msgId: "checkUpdate",
    duration: CHECK_UPDATE_TIME
  });
});

onUnmounted(() => {
  // 清除Web Worker计时器
  timerWorker.postMessage({
    type: "clearTimer",
    msgId: "checkUpdate"
  });
  timerWorker.terminate();
});
</script>

<style scoped></style>
