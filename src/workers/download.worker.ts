/// <reference lib="webworker" />

// 导入共享类型定义
import type { DownloadRequest, ProgressMessage, ResultMessage } from "../types/download";

// 下载任务状态
interface DownloadTask {
  controller: AbortController;
  startTime: number;
  lastProgressTime: number;
  lastDownloaded: number;
}

// 存储当前下载任务
let currentTask: DownloadTask | null = null;

// 下载文件并返回ArrayBuffer
async function downloadFile(
  url: string,
  headers: Record<string, string> = {},
  retryCount: number = 0,
  timeout: number = 30000
): Promise<ArrayBuffer> {
  let attempts = 0;

  while (attempts <= retryCount) {
    try {
      attempts++;

      // 创建AbortController用于取消下载
      const controller = new AbortController();
      const signal = controller.signal;

      // 保存当前任务
      currentTask = {
        controller,
        startTime: Date.now(),
        lastProgressTime: Date.now(),
        lastDownloaded: 0
      };

      // 设置超时
      const timeoutId = setTimeout(() => controller.abort(new Error("Download timeout")), timeout);

      // 发送请求
      const response = await fetch(url, {
        headers,
        signal
      });

      // 清除超时
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let downloaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          chunks.push(value);
          downloaded += value.length;

          // 计算并发送进度
          const now = Date.now();
          const timeSinceLastProgress = now - currentTask.lastProgressTime;
          const downloadedSinceLastProgress = downloaded - currentTask.lastDownloaded;

          // 每100ms更新一次进度
          if (timeSinceLastProgress >= 100) {
            const speed = timeSinceLastProgress > 0 ? (downloadedSinceLastProgress * 1000) / timeSinceLastProgress : 0;

            const progress = contentLength > 0 ? downloaded / contentLength : 0;

            const progressMsg: ProgressMessage = {
              type: "progress",
              url,
              progress,
              speed,
              downloaded,
              total: contentLength
            };

            self.postMessage(progressMsg);

            currentTask.lastProgressTime = now;
            currentTask.lastDownloaded = downloaded;
          }
        }
      }

      // 合并chunks为ArrayBuffer
      const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalSize);
      let offset = 0;

      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      // 任务完成，清除当前任务
      currentTask = null;

      return result.buffer;
    } catch (error) {
      // 清除当前任务
      currentTask = null;

      // 如果是AbortError，直接抛出
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      // 如果还有重试次数，继续重试
      if (attempts <= retryCount) {
        console.log(`[DownloadWorker] 下载失败，重试 ${attempts}/${retryCount}: ${url}`);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Max retry attempts reached");
}

self.addEventListener("message", async (event: MessageEvent<DownloadRequest>) => {
  const { type = "download", url, headers = {}, retryCount = 0, timeout = 30000 } = event.data;

  // 处理取消请求
  if (type === "cancel") {
    if (currentTask) {
      console.log(`[DownloadWorker] 取消下载: ${url}`);
      currentTask.controller.abort(new Error("Download cancelled by user"));
      currentTask = null;
      self.postMessage({ success: false, url, error: "Download cancelled" });
    }
    return;
  }

  if (!url) {
    self.postMessage({ success: false, url, error: "url is required" });
    return;
  }

  try {
    console.log(`[DownloadWorker] 开始下载: ${url}`);
    const buffer = await downloadFile(url, headers, retryCount, timeout);
    console.log(`[DownloadWorker] 文件下载成功: ${url}`);
    self.postMessage({ success: true, url, buffer } as ResultMessage, [buffer]);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[DownloadWorker] 下载失败: ${url} - ${errorMsg}`);
    self.postMessage({ success: false, url, error: errorMsg } as ResultMessage);
  }
});
