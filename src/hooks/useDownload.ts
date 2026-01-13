import { createEventHook } from "@vueuse/core";
import { BaseDirectory, exists, mkdir, writeFile } from "@tauri-apps/plugin-fs";

import { isMobile } from "@/utils/PlatformUtils";
import { DownloadRequest, ProgressMessage, ResultMessage } from "@/types/download";

export const useDownload = () => {
  const process = ref(0);
  const isDownloading = ref(false);
  const { on: onLoaded, trigger } = createEventHook();
  const workerRef = ref<Worker | null>(null);
  const currentUrlRef = ref<string | null>(null);
  const currentSavePathRef = ref<string | null>(null);
  const currentBaseDirRef = ref<BaseDirectory | null>(null);

  // 初始化worker
  const initWorker = () => {
    if (!workerRef.value) {
      workerRef.value = new Worker(new URL("@/workers/download.worker.ts", import.meta.url));
      // 设置消息处理
      workerRef.value.addEventListener("message", handleWorkerMessage);
    }
  };

  // 处理worker消息
  const handleWorkerMessage = (event: MessageEvent) => {
    const data = event.data;

    if (data.type === "progress") {
      // 处理进度消息
      const progressData = data as ProgressMessage;
      if (progressData.url === currentUrlRef.value) {
        // 更新进度（0-100）
        process.value = Math.floor(progressData.progress * 100);
      }
    } else {
      // 处理结果消息
      const resultData = data as ResultMessage;
      if (resultData.url === currentUrlRef.value) {
        handleDownloadResult(resultData);
      }
    }
  };

  // 处理下载结果
  const handleDownloadResult = async (result: ResultMessage) => {
    try {
      if (result.success && result.buffer) {
        // 下载成功，将文件写入本地
        const savePath = currentSavePathRef.value as string;
        const baseDir = currentBaseDirRef.value as BaseDirectory;

        // 确保目录存在
        const dirPath = savePath.substring(0, savePath.lastIndexOf("/"));
        if (dirPath) {
          const dirExists = await exists(dirPath, { baseDir });
          if (!dirExists) {
            await mkdir(dirPath, { baseDir, recursive: true });
          }
        }

        // 将ArrayBuffer转换为Uint8Array并写入文件
        const uint8Array = new Uint8Array(result.buffer);
        await writeFile(savePath, uint8Array, { baseDir });

        trigger("success");
      } else {
        // 下载失败
        window.$message.error(result.error || "下载失败");
        trigger("fail");
        throw new Error(result.error || "下载失败");
      }
    } catch (error) {
      console.error("处理下载结果失败:", error);
      trigger("fail");
      throw error;
    } finally {
      // 重置状态
      isDownloading.value = false;
      process.value = 0;
      currentUrlRef.value = null;
      currentSavePathRef.value = null;
      currentBaseDirRef.value = null;
    }
  };

  const downloadFile = async (
    url: string,
    savePath: string,
    baseDir: BaseDirectory = isMobile() ? BaseDirectory.AppData : BaseDirectory.AppCache
  ) => {
    try {
      isDownloading.value = true;
      process.value = 0;
      currentUrlRef.value = url;
      currentSavePathRef.value = savePath;
      currentBaseDirRef.value = baseDir;

      // 初始化worker
      initWorker();

      // 向worker发送下载请求
      workerRef.value?.postMessage({
        url,
        headers: {},
        retryCount: 3,
        timeout: 30000
      } as DownloadRequest);
    } catch (error) {
      console.error("下载失败:", error);
      trigger("fail");
      isDownloading.value = false;
      process.value = 0;
      currentUrlRef.value = null;
      currentSavePathRef.value = null;
      currentBaseDirRef.value = null;
      throw error;
    }
  };

  // 取消下载方法
  const cancelDownload = () => {
    if (workerRef.value && currentUrlRef.value) {
      workerRef.value.postMessage({
        type: "cancel",
        url: currentUrlRef.value
      } as DownloadRequest);

      // 重置状态
      isDownloading.value = false;
      process.value = 0;
      currentUrlRef.value = null;
      currentSavePathRef.value = null;
      currentBaseDirRef.value = null;
      trigger("fail");
    }
  };

  // 组件卸载时清理worker
  onUnmounted(() => {
    if (workerRef.value) {
      workerRef.value.terminate();
      workerRef.value = null;
    }
  });

  return {
    onLoaded,
    downloadFile,
    cancelDownload,
    process,
    isDownloading
  };
};
