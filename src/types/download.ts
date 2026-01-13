// WebWorker 消息类型
export type MessageType = "download" | "cancel" | "progress";

// 下载请求类型
export type DownloadRequest = {
  type?: MessageType;
  url: string;
  headers?: Record<string, string>;
  retryCount?: number;
  timeout?: number;
};

// 进度消息类型
export type ProgressMessage = {
  type: "progress";
  url: string;
  progress: number;
  speed: number;
  downloaded: number;
  total: number;
};

// 结果消息类型
export type ResultMessage = {
  success: boolean;
  url: string;
  buffer?: ArrayBuffer;
  error?: string;
};
