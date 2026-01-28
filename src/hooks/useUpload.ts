import { createEventHook } from "@vueuse/core";
import { invoke } from "@tauri-apps/api/core";

import type { UploadProgress, UploadResult, UploadStatus, UploadTask, ChunkInfo } from "@/types/upload";
import { TauriCommandEnum, UploadSceneEnum } from "@/enums";

// 定义扩展的 File 接口，Tauri 环境下 File 对象可能包含 path
interface ExtendedFile extends File {
  path?: string;
}

const generateTaskId = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified}`;
};

/**
 * 优化：仅计算分片信息，不再预先计算 Hash，避免界面卡顿
 */
export const calculateChunks = (
  file: File,
  chunkSize: number = 5 * 1024 * 1024
): { chunks: ChunkInfo[]; totalChunks: number } => {
  const chunks: ChunkInfo[] = [];
  const totalSize = file.size;
  let start = 0;
  let index = 0;

  while (start < totalSize) {
    const end = Math.min(start + chunkSize, totalSize);
    const size = end - start;
    // hash 暂时留空，如果后端必须校验每个分片的 MD5，则需在上传前异步计算
    chunks.push({ index, size, start, end, hash: "" });
    start = end;
    index++;
  }

  return { chunks, totalChunks: chunks.length };
};

/**
 * 读取文件分片数据（仅作为 Fallback 或 内存文件使用）
 */
export const readChunkData = async (file: File, start: number, end: number): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = (e) => reject(new Error(`读取文件分片失败: ${e}`));
    reader.readAsArrayBuffer(file.slice(start, end));
  });
};

export const useUpload = () => {
  const isUploading = ref(false);
  const currentTaskId = ref<string | null>(null);
  const uploadProgress = ref<UploadProgress>({
    progress: 0,
    speed: 0,
    uploaded: 0,
    total: 0,
    currentChunk: 0,
    totalChunks: 0,
    taskId: "",
    lastProgressTime: Date.now(),
    lastUploadedSize: 0
  });
  const uploadStatus = ref<UploadStatus>("idle");
  const tasks = ref<Map<string, UploadTask>>(new Map());
  const isPaused = ref(false);

  // 并发限制
  const CONCURRENCY_LIMIT = 3;

  // 事件钩子
  const { on: onProgress, trigger: triggerProgress } = createEventHook<UploadProgress>();
  const { on: onComplete, trigger: triggerComplete } = createEventHook<UploadResult>();
  const { on: onError, trigger: triggerError } = createEventHook<Error>();

  const getDefaultConfigByScene = (scene: UploadSceneEnum) => {
    switch (scene) {
      case "avatar":
        return { chunkSize: 1 * 1024 * 1024, retryCount: 3, directUploadThreshold: 1 * 1024 * 1024 };
      case "video":
        return { chunkSize: 10 * 1024 * 1024, retryCount: 5, directUploadThreshold: 10 * 1024 * 1024 };
      default:
        return { chunkSize: 5 * 1024 * 1024, retryCount: 3, directUploadThreshold: 5 * 1024 * 1024 };
    }
  };

  /**
   * 检查已上传分片
   */
  const checkUploadedChunks = async (task: UploadTask): Promise<Set<number>> => {
    try {
      const result = await invoke<{ uploadedChunks: number[] }>(TauriCommandEnum.CHECK_UPLOADED_CHUNKS_COMMAND, {
        fileHash: task.taskId,
        fileName: task.file.name,
        scene: task.scene
      });
      const uploadedChunks = new Set<number>(result.uploadedChunks || []);

      // 更新任务状态中的已上传大小
      let uploadedSize = 0;
      task.chunks.forEach((chunk) => {
        if (uploadedChunks.has(chunk.index)) {
          uploadedSize += chunk.size;
        }
      });
      task.uploadedSize = uploadedSize;
      task.uploadedChunks = uploadedChunks;
      return uploadedChunks;
    } catch (error) {
      console.warn("检查已上传分片失败 (可能是新文件):", error);
      return new Set();
    }
  };

  /**
   * 处理单个分片上传
   * 自动判断使用 路径上传(Rust读盘) 还是 内存上传(JS读Blob)
   */
  const processChunkUpload = async (
    task: UploadTask,
    chunkIndex: number,
    chunk: ChunkInfo,
    retryCount: number
  ): Promise<void> => {
    let success = false;
    let retry = 0;
    const file = task.file as ExtendedFile;

    while (!success && retry < retryCount) {
      // 检查暂停状态
      if (isPaused.value || task.status === "paused") {
        throw new Error("Upload Paused");
      }

      try {
        if (file.path) {
          // 🚀 路径存在，调用 Rust 直接读取文件上传 (性能最佳)
          await invoke(TauriCommandEnum.UPLOAD_CHUNK_BY_PATH_COMMAND, {
            fileHash: task.taskId,
            fileName: task.file.name,
            chunkIndex: chunkIndex,
            totalChunks: task.chunks.length,
            scene: task.scene,
            filePath: file.path,
            start: chunk.start,
            size: chunk.size
          });
        } else {
          // 🐢 路径不存在 (Blob/内存文件)，使用 FileReader
          const chunkData = await readChunkData(task.file, chunk.start, chunk.end);
          await invoke(TauriCommandEnum.UPLOAD_CHUNK_BYTES_COMMAND, {
            fileHash: task.taskId,
            fileName: task.file.name,
            chunkIndex: chunkIndex,
            totalChunks: task.chunks.length,
            scene: task.scene,
            chunkData: new Uint8Array(chunkData)
          });
        }
        success = true;
      } catch (error) {
        console.warn(`Chunk ${chunkIndex} failed, retry ${retry + 1}/${retryCount}`, error);
        retry++;
        if (retry >= retryCount) throw error;
        // 指数退避重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * retry));
      }
    }
  };

  /**
   * 合并已上传分片
   * @param task 上传任务
   * @returns 合并后的文件 URL
   */
  const mergeChunks = async (task: UploadTask): Promise<{ url: string }> => {
    return await invoke<{ url: string }>(TauriCommandEnum.MERGE_CHUNKS_COMMAND, {
      fileHash: task.taskId,
      fileName: task.file.name,
      totalChunks: task.chunks.length,
      scene: task.scene
    });
  };

  /**
   * 通知上传进度
   * @param task 上传任务
   * @param completedChunksCount 已完成分片数
   * @returns 上传进度数据
   */
  const notifyProgress = (task: UploadTask, completedChunksCount: number) => {
    const now = Date.now();
    const timeDiff = now - task.progress.lastProgressTime;

    // 限制 UI 刷新频率 (100ms)
    if (timeDiff < 100 && completedChunksCount < task.chunks.length) return;

    const uploadedDiff = task.progress.uploaded - task.progress.lastUploadedSize;
    const speed = timeDiff > 0 ? (uploadedDiff / timeDiff) * 1000 : 0;

    // 防止除以0
    const progress = task.progress.total > 0 ? Math.min(task.progress.uploaded / task.progress.total, 0.99) : 0;

    const progressData: UploadProgress = {
      progress,
      speed,
      uploaded: task.progress.uploaded,
      total: task.progress.total,
      currentChunk: completedChunksCount,
      totalChunks: task.chunks.length,
      taskId: task.taskId,
      lastProgressTime: now,
      lastUploadedSize: task.progress.uploaded
    };

    task.progress = progressData;
    uploadProgress.value = progressData;
    triggerProgress(progressData);
  };

  /**
   * 执行直接上传 (小文件)
   * @param task 上传任务
   */
  const executeDirectUpload = async (task: UploadTask) => {
    // 代码与原版类似，但需适配 processChunkUpload
    try {
      notifyProgress(task, 0);
      // 构造一个伪 Chunk
      const chunk = { index: 0, start: 0, end: task.file.size, size: task.file.size, hash: "" };
      await processChunkUpload(task, 0, chunk, 3);

      task.uploadedChunks.add(0);
      task.progress.uploaded = task.file.size;
      notifyProgress(task, 1);

      const mergeResult = await mergeChunks(task);

      const result = { success: true, taskId: task.taskId, url: mergeResult.url };
      triggerComplete(result);

      task.status = "completed";
      isUploading.value = false;
      uploadStatus.value = "completed";
    } catch (e) {
      console.error("直接上传失败", e);
      triggerError(e as Error);
      task.status = "failed";
      isUploading.value = false;
      uploadStatus.value = "failed";
    }
  };

  /**
   * 执行并发分片上传
   * @param taskId 上传任务 ID
   */
  const executeUpload = async (taskId: string) => {
    const task = tasks.value.get(taskId);
    if (!task) return;

    isPaused.value = false;
    task.status = "uploading";
    uploadStatus.value = "uploading";
    isUploading.value = true;

    try {
      if (task.isDirectUpload) {
        await executeDirectUpload(task);
        return;
      }

      // 断点续传检查
      const uploadedChunks = await checkUploadedChunks(task);

      // 筛选未上传分片
      const pendingChunks = task.chunks.filter((c) => !uploadedChunks.has(c.index));
      let completedCount = task.chunks.length - pendingChunks.length;

      if (pendingChunks.length === 0) {
        // 秒传
        task.progress.uploaded = task.file.size;
        notifyProgress(task, task.chunks.length);
      } else {
        // --- 并发控制逻辑 Start ---
        const executing = new Set<Promise<void>>();

        for (const chunk of pendingChunks) {
          // 检查暂停
          if (isPaused.value) {
            task.status = "paused";
            uploadStatus.value = "paused";
            isUploading.value = false;
            return;
          }

          // 创建上传任务 Promise
          const p = processChunkUpload(task, chunk.index, chunk, 3).then(() => {
            // 任务完成
            executing.delete(p);
            task.uploadedChunks.add(chunk.index);
            task.progress.uploaded += chunk.size; // 累加进度
            completedCount++;
            notifyProgress(task, completedCount);
          });

          executing.add(p);

          // 如果达到并发限制，等待最快的一个完成
          if (executing.size >= CONCURRENCY_LIMIT) {
            await Promise.race(executing);
          }
        }

        // 等待剩余所有任务完成
        await Promise.all(executing);
        // --- 并发控制逻辑 End ---
      }

      // 全部上传完成，合并
      const mergeResult = await mergeChunks(task);

      // 确保进度条 100%
      task.progress.progress = 1;
      task.progress.uploaded = task.progress.total;
      triggerProgress(task.progress);

      triggerComplete({ success: true, taskId, url: mergeResult.url });

      task.status = "completed";
      uploadStatus.value = "completed";
      isUploading.value = false;
    } catch (error: any) {
      if (error.message === "Upload Paused") {
        // 暂停逻辑已在 processChunkUpload 处理，这里主要是兜底
        return;
      }
      console.error("上传流程失败:", error);
      triggerError(error as Error);
      task.status = "failed";
      isUploading.value = false;
      uploadStatus.value = "failed";
    }
  };

  /**
   * 上传文件
   * @param file 要上传的文件
   * @param scene 上传场景
   * @param options 上传选项
   * @returns 上传任务 ID
   */
  const uploadFile = async (
    file: File,
    scene: UploadSceneEnum,
    options?: { chunkSize?: number; retryCount?: number }
  ): Promise<string> => {
    try {
      const taskId = generateTaskId(file);
      currentTaskId.value = taskId;

      const defaultConfig = getDefaultConfigByScene(scene);
      const chunkSize = options?.chunkSize || defaultConfig.chunkSize;
      const directUploadThreshold = defaultConfig.directUploadThreshold;

      // 注意：Tauri 2.0+ 或部分环境 file.size 可能需要异步获取，但通常 File 对象已有
      const isDirectUpload = file.size <= directUploadThreshold;

      // 计算分片 (现在是同步且快速的)
      const { chunks, totalChunks } = calculateChunks(file, chunkSize);

      const task: UploadTask = {
        taskId,
        file,
        scene,
        status: "uploading",
        progress: {
          progress: 0,
          speed: 0,
          uploaded: 0,
          total: file.size,
          currentChunk: 0,
          totalChunks,
          taskId,
          lastProgressTime: Date.now(),
          lastUploadedSize: 0
        },
        chunks,
        uploadedChunks: new Set(),
        uploadedSize: 0,
        startTime: Date.now(),
        isDirectUpload
      };

      tasks.value.set(taskId, task);
      isUploading.value = true;
      uploadStatus.value = "uploading";

      // 异步执行，不阻塞 UI 响应
      executeUpload(taskId);

      return taskId;
    } catch (error) {
      console.error("上传初始化失败:", error);
      throw error;
    }
  };

  /**
   * 暂停上传
   * @param taskId 要暂停的上传任务 ID
   */
  const pauseUpload = (taskId?: string) => {
    const targetTaskId = taskId || currentTaskId.value;
    if (targetTaskId) {
      isPaused.value = true;
      // 如果想更即时反馈，可以手动设置状态
      const task = tasks.value.get(targetTaskId);
      if (task) task.status = "paused";
    }
  };

  /**
   * 恢复上传
   * @param taskId 要恢复的上传任务 ID
   */
  const resumeUpload = (taskId?: string) => {
    const targetTaskId = taskId || currentTaskId.value;
    if (targetTaskId) {
      // 防止重复调用
      const task = tasks.value.get(targetTaskId);
      if (task && task.status === "uploading") return;
      executeUpload(targetTaskId);
    }
  };

  /**
   * 取消上传
   * @param taskId 要取消的上传任务 ID
   */
  const cancelUpload = (taskId?: string) => {
    const targetTaskId = taskId || currentTaskId.value;
    if (!targetTaskId) return;

    isPaused.value = true;
    tasks.value.delete(targetTaskId);

    if (currentTaskId.value === targetTaskId) {
      currentTaskId.value = null;
      isUploading.value = false;
      uploadStatus.value = "idle";
    }
  };

  const getTaskStatus = (taskId: string) => tasks.value.get(taskId)?.status || "idle";
  const getTaskProgress = (taskId: string) => tasks.value.get(taskId)?.progress || null;

  onUnmounted(() => {
    isPaused.value = true;
  });

  return {
    isUploading,
    uploadProgress,
    uploadStatus,
    currentTaskId,
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    getTaskStatus,
    getTaskProgress,
    onProgress,
    onComplete,
    onError
  };
};
