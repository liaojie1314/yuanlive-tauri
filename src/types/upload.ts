import type { UploadSceneEnum } from "@/enums";

// 分片信息类型
export type ChunkInfo = {
  index: number;
  size: number;
  start: number;
  end: number;
  hash: string;
};

// 进度消息类型
export type UploadProgress = {
  progress: number;
  speed: number;
  uploaded: number;
  total: number;
  currentChunk: number;
  totalChunks: number;
  taskId: string;
  lastProgressTime: number;
  lastUploadedSize: number;
};

// 结果消息类型
export type UploadResult = {
  success: boolean;
  taskId: string;
  url?: string;
  error?: string;
};

// 上传任务状态
export type UploadStatus = "idle" | "uploading" | "paused" | "completed" | "failed";

// 上传任务信息
export type UploadTask = {
  taskId: string;
  file: File;
  scene: UploadSceneEnum;
  status: UploadStatus;
  progress: UploadProgress;
  chunks: ChunkInfo[];
  uploadedChunks: Set<number>;
  uploadedSize: number;
  startTime: number;
  isDirectUpload: boolean;
};
