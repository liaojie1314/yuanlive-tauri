import { UrlEnum } from "@/enums";
import { ErrorType, invokeSilently, invokeWithErrorHandler } from "./TauriInvokeHandler.ts";

/**
 * 请求参数接口
 */
interface RequestParams {
  /** API URL 枚举 */
  url: UrlEnum;
  /** 请求体数据 */
  body?: any;
  /** 查询参数 */
  params?: Record<string, any>;
}

/**
 * 请求选项接口
 */
interface RequestOptions {
  // 是否显示错误提示，默认为 true
  showError?: boolean;
  // 自定义错误消息
  customErrorMessage?: string;
  // 错误类型，默认为 Network
  errorType?: ErrorType;
  // 是否静默调用（不显示错误），默认为 false
  silent?: boolean;
  // 重试选项
  retry?: {
    // 最大重试次数，默认为 3
    maxRetries?: number;
    // 重试间隔（毫秒），默认为 1000
    retryDelay?: number;
  };
}

/**
 * 统一的 API 请求工具
 * @param requestParams 请求参数
 * @param options 请求选项
 */
export async function request<T = any>(
  requestParams: RequestParams,
  options?: Omit<RequestOptions, "client">
): Promise<T> {
  const { retry, ...invokeOptions } = options || {};

  // 构建调用参数
  const args = {
    url: requestParams.url,
    body: requestParams.body || null,
    params: requestParams.params || null
  };

  // 如果需要重试
  if (retry) {
    const { invokeWithRetry } = await import("./TauriInvokeHandler.ts");
    return await invokeWithRetry<T>("request_command", args, {
      ...retry,
      showError: invokeOptions.showError,
      customErrorMessage: invokeOptions.customErrorMessage
    });
  }

  // 普通调用
  return await invokeWithErrorHandler<T>("request_command", args, {
    ...invokeOptions,
    errorType: invokeOptions.errorType || ErrorType.Network
  });
}

/**
 * 静默的请求（不显示错误提示）
 * @param requestParams 请求参数
 */
export async function requestSilent<T = any>(requestParams: RequestParams): Promise<T | null> {
  const args = {
    url: requestParams.url,
    body: requestParams.body || null,
    params: requestParams.params || null
  };
  return await invokeSilently<T>("request_command", args);
}

/**
 * SSE 流式数据事件类型
 */
interface SseStreamEvent {
  requestId: string;
  eventType: "chunk" | "done" | "error";
  data?: string;
  error?: string;
}

/**
 * 流式数据回调函数
 */
export interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onDone?: (fullContent: string) => void;
  onError?: (error: string) => void;
}

export async function messageSendStream(
  body: {
    conversationId: string;
    content: string;
    // 是否使用上下文
    useContext?: boolean;
    // 联网搜索
    useNetwork?: boolean;
    // 深度思考
    useReasoning?: boolean;
  },
  callbacks?: StreamCallbacks
) {
  const { invoke, Channel } = await import("@tauri-apps/api/core");
  const { TauriCommandEnum } = await import("@/enums");

  // 生成唯一的请求 ID
  const requestId = `ai-stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return new Promise<string>((resolve, reject) => {
    let fullContent = "";
    let isResolved = false;

    // 创建 Channel 用于接收流式事件
    const onEvent = new Channel<SseStreamEvent>();
    onEvent.onmessage = (event: SseStreamEvent) => {
      const { eventType, data, error, requestId: eventRequestId } = event;

      // 只处理当前请求的事件
      if (eventRequestId !== requestId) return;

      switch (eventType) {
        case "chunk":
          if (data) {
            fullContent += data;
            callbacks?.onChunk?.(data);
          }
          break;
        case "done":
          if (!isResolved) {
            isResolved = true;
            const finalContent = data || fullContent;
            callbacks?.onDone?.(finalContent);
            resolve(finalContent);
          }
          break;
        case "error":
          if (!isResolved) {
            isResolved = true;
            const errorMsg = error || "未知错误";
            callbacks?.onError?.(errorMsg);
            reject(new Error(errorMsg));
          }
          break;
      }
    };

    // 调用 Rust 后端命令发送请求
    invoke(TauriCommandEnum.AI_MESSAGE_SEND_STREAM, {
      body,
      requestId,
      onEvent
    }).catch((error) => {
      if (!isResolved) {
        isResolved = true;
        const errorMsg = error instanceof Error ? error.message : String(error);
        callbacks?.onError?.(errorMsg);
        reject(error);
      }
    });
  });
}
