import { createEventHook } from "@vueuse/core";
import { invoke } from "@tauri-apps/api/core";

import type { UploadProgress, UploadResult, UploadStatus, UploadTask, ChunkInfo } from "@/types/upload";
import { TauriCommandEnum, type UploadSceneEnum } from "@/enums";

// 生成唯一任务ID
const generateTaskId = (file: File): string => {
  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
};

// 计算文件分片
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
    // 简化的哈希生成，实际项目中可能需要更复杂的哈希算法
    const hash = `${index}-${start}-${end}-${size}`;
    chunks.push({ index, size, start, end, hash });
    start = end;
    index++;
  }

  return { chunks, totalChunks: chunks.length };
};

// 计算单个分片的哈希值（简化版，实际项目中可能需要更复杂的哈希算法）
export const calculateChunkHash = async (file: File, start: number, end: number): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const hash = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer))).substring(0, 16);
      resolve(hash);
    };
    reader.readAsArrayBuffer(file.slice(start, end));
  });
};

// 读取文件分片数据
export const readChunkData = async (file: File, start: number, end: number): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as ArrayBuffer);
    };
    reader.onerror = (e) => {
      reject(new Error(`读取文件分片失败: ${e}`));
    };
    reader.readAsArrayBuffer(file.slice(start, end));
  });
};

export const useUpload = () => {
  // 状态管理
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

  // 任务列表，用于断点续传
  const tasks = ref<Map<string, UploadTask>>(new Map());
  // 用于控制上传暂停
  const isPaused = ref(false);

  // 事件钩子
  const { on: onProgress, trigger: triggerProgress } = createEventHook<UploadProgress>();
  const { on: onComplete, trigger: triggerComplete } = createEventHook<UploadResult>();
  const { on: onError, trigger: triggerError } = createEventHook<Error>();

  // 根据上传场景获取默认配置
  const getDefaultConfigByScene = (scene: UploadSceneEnum) => {
    switch (scene) {
      case "avatar":
        // 头像上传：较小的分片，较少的重试次数
        return {
          chunkSize: 1 * 1024 * 1024, // 1MB
          retryCount: 3,
          directUploadThreshold: 1 * 1024 * 1024 // 1MB 以下直接上传
        };
      case "video":
        // 视频上传：较大的分片，较多的重试次数
        return {
          chunkSize: 10 * 1024 * 1024, // 10MB
          retryCount: 5,
          directUploadThreshold: 10 * 1024 * 1024 // 10MB 以下直接上传
        };
      default:
        // 聊天文件上传：中等分片大小，中等重试次数
        return {
          chunkSize: 5 * 1024 * 1024, // 5MB
          retryCount: 3,
          directUploadThreshold: 5 * 1024 * 1024 // 5MB 以下直接上传
        };
    }
  };

  // 检查已上传的分片
  const checkUploadedChunks = async (task: UploadTask): Promise<Set<number>> => {
    try {
      const result = await invoke<{ uploadedChunks: number[] }>(TauriCommandEnum.CHECK_UPLOADED_CHUNKS_COMMAND, {
        fileHash: task.taskId,
        fileName: task.file.name,
        scene: task.scene
      });

      // 解析已上传的分片索引
      const uploadedChunks = new Set<number>(result.uploadedChunks || []);

      // 计算已上传的大小
      let uploadedSize = 0;
      uploadedChunks.forEach((index) => {
        const chunk = task.chunks[index];
        if (chunk) {
          uploadedSize += chunk.size;
        }
      });

      // 更新任务状态
      task.uploadedSize = uploadedSize;
      task.uploadedChunks = uploadedChunks;

      return uploadedChunks;
    } catch (error) {
      console.error("检查已上传分片失败:", error);
      // 如果检查失败，可能是文件不存在，返回空集合
      return new Set();
    }
  };

  // 上传单个分片
  const uploadChunk = async (
    task: UploadTask,
    chunkIndex: number,
    chunk: { start: number; end: number },
    retryCount: number
  ): Promise<boolean> => {
    let success = false;
    let retry = 0;

    while (!success && retry < retryCount) {
      try {
        // 读取分片数据
        const chunkData = await readChunkData(task.file, chunk.start, chunk.end);

        // 调用后端命令上传分片
        await invoke(TauriCommandEnum.UPLOAD_CHUNK_COMMAND, {
          fileHash: task.taskId,
          fileName: task.file.name,
          chunkIndex: chunkIndex,
          totalChunks: task.chunks.length,
          scene: task.scene,
          chunkData: new Uint8Array(chunkData)
        });

        success = true;
      } catch (error) {
        retry++;
        if (retry >= retryCount) {
          throw error;
        }
        // 重试间隔
        await new Promise((resolve) => setTimeout(resolve, 1000 * retry));
      }
    }

    return success;
  };

  // 合并分片
  const mergeChunks = async (task: UploadTask): Promise<{ url: string }> => {
    const result = await invoke<{ url: string }>(TauriCommandEnum.MERGE_CHUNKS_COMMAND, {
      fileHash: task.taskId,
      fileName: task.file.name,
      totalChunks: task.chunks.length,
      scene: task.scene
    });

    return result;
  };

  // 通知进度
  const notifyProgress = (task: UploadTask, currentChunk: number) => {
    const now = Date.now();
    const timeDiff = now - task.progress.lastProgressTime;

    if (timeDiff < 100) {
      // 限制进度通知频率
      return;
    }

    const uploadedDiff = task.progress.uploaded - task.progress.lastUploadedSize;
    const speed = timeDiff > 0 ? (uploadedDiff / timeDiff) * 1000 : 0;
    const progress = task.progress.total > 0 ? task.progress.uploaded / task.progress.total : 0;

    const progressData: UploadProgress = {
      progress,
      speed,
      uploaded: task.progress.uploaded,
      total: task.progress.total,
      currentChunk,
      totalChunks: task.chunks.length,
      taskId: task.taskId,
      lastProgressTime: now,
      lastUploadedSize: task.progress.uploaded
    };

    // 更新任务进度
    task.progress = progressData;
    // 更新全局进度
    uploadProgress.value = progressData;
    // 触发进度事件
    triggerProgress(progressData);
  };

  // 执行直接上传
  const executeDirectUpload = async (task: UploadTask) => {
    try {
      // 通知初始进度
      notifyProgress(task, 0);

      // 上传整个文件作为单个分片
      await uploadChunk(task, 0, { start: 0, end: task.file.size }, 3);

      // 标记分片已上传
      const uploadedChunks = new Set<number>([0]);
      task.uploadedChunks = uploadedChunks;
      task.progress.uploaded = task.file.size;

      // 通知进度（100%）
      notifyProgress(task, 1);

      // 立即合并分片
      const mergeResult = await mergeChunks(task);

      // 上传完成
      const result: UploadResult = {
        success: true,
        taskId: task.taskId,
        url: mergeResult.url
      };

      // 触发完成事件
      triggerComplete(result);

      // 更新任务状态
      task.status = "completed";

      // 重置全局状态
      isUploading.value = false;
      uploadStatus.value = "completed";
    } catch (error) {
      console.error("直接上传失败:", error);

      // 触发错误事件
      triggerError(error as Error);

      // 更新任务状态
      task.status = "failed";

      // 重置全局状态
      isUploading.value = false;
      uploadStatus.value = "failed";
    }
  };

  // 执行上传任务
  const executeUpload = async (taskId: string) => {
    const task = tasks.value.get(taskId);
    if (!task) {
      return;
    }

    isPaused.value = false;
    task.status = "uploading";
    uploadStatus.value = "uploading";
    isUploading.value = true;

    try {
      // 如果是小文件，直接上传
      if (task.isDirectUpload) {
        await executeDirectUpload(task);
        return;
      }

      // 大文件分片上传逻辑
      // 检查已上传的分片（断点续传）
      const uploadedChunks = await checkUploadedChunks(task);

      // 找到第一个未上传的分片索引
      let startIndex = 0;
      for (let i = 0; i < task.chunks.length; i++) {
        if (!uploadedChunks.has(i)) {
          startIndex = i;
          break;
        }
      }

      // 通知初始进度
      notifyProgress(task, startIndex);

      // 遍历所有分片
      for (let i = startIndex; i < task.chunks.length; i++) {
        if (isPaused.value) {
          task.status = "paused";
          uploadStatus.value = "paused";
          isUploading.value = false;
          return;
        }

        const chunk = task.chunks[i];

        // 如果分片已上传，跳过
        if (uploadedChunks.has(i)) {
          continue;
        }

        // 上传分片（带重试机制）
        await uploadChunk(task, i, chunk, 3);

        // 标记分片已上传
        uploadedChunks.add(i);
        task.uploadedChunks = uploadedChunks;
        task.progress.uploaded += chunk.end - chunk.start;

        // 通知进度
        notifyProgress(task, i + 1);
      }

      // 所有分片上传完成，通知合并
      const mergeResult = await mergeChunks(task);

      // 上传完成
      const result: UploadResult = {
        success: true,
        taskId,
        url: mergeResult.url
      };

      // 触发完成事件
      triggerComplete(result);

      // 更新任务状态
      task.status = "completed";

      // 重置全局状态
      isUploading.value = false;
      uploadStatus.value = "completed";
    } catch (error) {
      console.error("上传失败:", error);

      // 触发错误事件
      triggerError(error as Error);

      // 更新任务状态
      task.status = "failed";

      // 重置全局状态
      isUploading.value = false;
      uploadStatus.value = "failed";
    }
  };

  // 上传文件
  const uploadFile = async (
    file: File,
    scene: UploadSceneEnum,
    options?: {
      chunkSize?: number;
      headers?: Record<string, string>;
      retryCount?: number;
    }
  ): Promise<string> => {
    try {
      // 生成任务ID
      const taskId = generateTaskId(file);
      currentTaskId.value = taskId;

      // 根据场景获取默认配置
      const defaultConfig = getDefaultConfigByScene(scene);
      // 合并配置
      const chunkSize = options?.chunkSize || defaultConfig.chunkSize;
      const directUploadThreshold = defaultConfig.directUploadThreshold;

      // 判断是否需要直接上传
      const isDirectUpload = file.size <= directUploadThreshold;

      // 计算分片
      const { chunks, totalChunks } = calculateChunks(file, chunkSize);

      // 创建任务
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

      // 添加到任务列表
      tasks.value.set(taskId, task);

      // 更新状态
      isUploading.value = true;
      uploadStatus.value = "uploading";

      // 开始上传
      executeUpload(taskId);

      return taskId;
    } catch (error) {
      console.error("上传初始化失败:", error);
      throw error;
    }
  };

  // 暂停上传
  const pauseUpload = (taskId?: string) => {
    const targetTaskId = taskId || currentTaskId.value;
    if (!targetTaskId) {
      return;
    }

    // 设置暂停标志
    isPaused.value = true;
  };

  // 恢复上传
  const resumeUpload = (taskId?: string) => {
    const targetTaskId = taskId || currentTaskId.value;
    if (!targetTaskId) {
      return;
    }

    // 继续执行上传
    executeUpload(targetTaskId);
  };

  // 取消上传
  const cancelUpload = (taskId?: string) => {
    const targetTaskId = taskId || currentTaskId.value;
    if (!targetTaskId) {
      return;
    }

    // 设置暂停标志
    isPaused.value = true;

    // 从任务列表中移除
    tasks.value.delete(targetTaskId);

    // 重置状态
    if (currentTaskId.value === targetTaskId) {
      currentTaskId.value = null;
      isUploading.value = false;
      uploadStatus.value = "idle";
    }
  };

  // 获取任务状态
  const getTaskStatus = (taskId: string): UploadStatus => {
    const task = tasks.value.get(taskId);
    return task?.status || "idle";
  };

  // 获取任务进度
  const getTaskProgress = (taskId: string): UploadProgress | null => {
    const task = tasks.value.get(taskId);
    return task?.progress || null;
  };

  // 组件卸载时清理
  onUnmounted(() => {
    // 设置暂停标志，停止所有上传任务
    isPaused.value = true;
  });

  return {
    // 状态
    isUploading,
    uploadProgress,
    uploadStatus,
    currentTaskId,

    // 方法
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    getTaskStatus,
    getTaskProgress,

    // 事件钩子
    onProgress,
    onComplete,
    onError
  };
};
