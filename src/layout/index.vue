<template>
  <div id="layout" class="relative flex min-w-310px bg-[--right-bg-color] h-full">
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
import { useI18n } from "vue-i18n";
import { type UnlistenFn, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { MittEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";
import { useMcp } from "@/hooks/useMcp";
import { useLogin } from "@/hooks/useLogin";
import { useCheckUpdate } from "@/hooks/useCheckUpdate";
import { useOverlayController } from "@/hooks/useOverlayController";
import { useAiStore } from "@/stores/ai";
import { useGlobalStore } from "@/stores/global";
import FileUtil from "@/utils/FileUtil";
import { getFilesMeta } from "@/utils/PathUtils";
import rustWebSocketClient from "@/services/webSocketRust";

const { t } = useI18n();
const { logout } = useLogin();
const { initMcp, isReady } = useMcp();
const { checkUpdate, CHECK_UPDATE_TIME } = useCheckUpdate();
const aiStore = useAiStore();
const globalStore = useGlobalStore();
const { firstEnter } = storeToRefs(globalStore);
const appWindow = WebviewWindow.getCurrent();

const tauriFileDropUnlisteners: UnlistenFn[] = [];
// 导入Web Worker
const timerWorker = new Worker(new URL("@/workers/timer.worker.ts", import.meta.url));

const isVideoUploadOpen = ref(false);
// 是否需要阻塞首屏
const requiresInitialSync = ref(true);
const loadingPercentage = ref(10);
const isDraggingFiles = ref(false);
const loadingText = ref("正在加载应用...");
// 记录首次登录状态，避免重复阻塞首屏
const shouldBlockInitialRender = computed(() => requiresInitialSync.value && firstEnter.value);
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

/**
 * 构建上传文件对象
 * @param paths 文件路径数组
 * @returns 上传文件对象数组
 */
const buildPathUploadFiles = async (paths: string[]) => {
  if (!paths?.length) return [];
  try {
    const filesMeta = (await getFilesMeta<FilesMeta>(paths)) ?? [];
    return await FileUtil.map2PathUploadFile(paths, filesMeta);
  } catch (error) {
    console.error("[layout] 解析拖拽文件元数据失败:", error);
    window.$message?.error?.(t("home.index.parseDragFileFailed"));
    return [];
  }
};

/**
 * 处理原生拖拽文件
 * @param paths 文件路径数组
 */
const handleNativeFileDrop = async (paths: string[]) => {
  if (!paths?.length) return;
  try {
    const pathFiles = await buildPathUploadFiles(paths);
    if (pathFiles.length > 0) {
      useMitt.emit(MittEnum.GLOBAL_FILES_DROP, pathFiles);
    } else {
      window.$message?.error?.(t("home.index.unableParseDragFile"));
    }
  } catch (error) {
    console.error("[layout] 处理原生拖拽文件失败:", error);
  } finally {
    isDraggingFiles.value = false;
  }
};

/** 设置原生文件拖拽监听 */
const setupNativeFileDropListeners = async () => {
  try {
    const unlisten = await appWindow.onDragDropEvent(async (event) => {
      // 如果视频弹窗处于打开状态
      if (isVideoUploadOpen.value) {
        isDraggingFiles.value = false;

        // 当真正松开鼠标放下文件时
        if (event.payload.type === "drop") {
          const paths = event.payload.paths || [];
          if (paths.length > 0) {
            // 复用你已经写好的 buildPathUploadFiles 方法解析文件
            const pathFiles = await buildPathUploadFiles(paths);
            if (pathFiles.length > 0) {
              // 专门发送给视频上传弹窗
              useMitt.emit(MittEnum.VIDEO_MODAL_FILE_DROP, pathFiles);
            }
          }
        }
        return; // 拦截结束
      }
      if (event.payload.type === "enter") {
        const paths = event.payload.paths || [];
        if (paths.length > 0) {
          isDraggingFiles.value = true;
        }
      } else if (event.payload.type === "over") {
        isDraggingFiles.value = true;
      } else if (event.payload.type === "drop") {
        const paths = event.payload.paths || [];
        handleNativeFileDrop(paths);
      } else if (event.payload.type === "leave") {
        isDraggingFiles.value = false;
      }
    });
    tauriFileDropUnlisteners.push(unlisten);
  } catch (error) {
    console.error("[layout] 注册原生文件拖拽监听失败:", error);
  }
};

/** 清理原生文件拖拽监听 */
const cleanupNativeFileDropListeners = () => {
  while (tauriFileDropUnlisteners.length > 0) {
    const unlisten = tauriFileDropUnlisteners.pop();
    unlisten?.();
  }
};

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
  useMitt.on(MittEnum.TOGGLE_VIDEO_UPLOAD_MODAL, (isOpen: boolean) => {
    isVideoUploadOpen.value = isOpen;
  });
  timerWorker.postMessage({
    type: "startTimer",
    msgId: "checkUpdate",
    duration: CHECK_UPDATE_TIME
  });
  const homeWindow = await WebviewWindow.getByLabel("home");
  if (homeWindow) {
    // 设置业务消息监听器
    await rustWebSocketClient.setupBusinessMessageListeners();
    // 居中
    if (firstEnter.value) {
      await homeWindow.center();
      firstEnter.value = false;
    }
    await homeWindow.show();
  }
  if (aiStore.mcpConfig["windows-mcp"]?.enabled && !isReady.value) {
    // 不用 await 阻塞主 UI 的渲染，让它在后台慢慢跑
    initMcp().catch((err) => console.error("后台初始化 MCP 失败:", err));
  }
  await setupNativeFileDropListeners();
});

onUnmounted(() => {
  cleanupNativeFileDropListeners();
  // 清除Web Worker计时器
  timerWorker.postMessage({
    type: "clearTimer",
    msgId: "checkUpdate"
  });
  timerWorker.terminate();
});
</script>

<style scoped></style>
