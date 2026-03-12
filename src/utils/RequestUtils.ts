import { TauriCommandEnum, UrlEnum } from "@/enums";
import { ErrorType, invokeWithErrorHandler } from "./TauriInvokeHandler.ts";

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
  /** 路径参数 (Path Variable, e.g. /user/{id}) */
  pathParams?: Record<string, any>;
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
    params: requestParams.params || null,
    pathParams: requestParams.pathParams || null
  };

  // 如果需要重试
  if (retry) {
    const { invokeWithRetry } = await import("./TauriInvokeHandler.ts");
    return await invokeWithRetry<T>(TauriCommandEnum.REQUEST_COMMAND, args, {
      ...retry,
      showError: invokeOptions.showError,
      customErrorMessage: invokeOptions.customErrorMessage
    });
  }

  // 普通调用
  return await invokeWithErrorHandler<T>(TauriCommandEnum.REQUEST_COMMAND, args, {
    ...invokeOptions,
    errorType: invokeOptions.errorType || ErrorType.Network
  });
}

/**
 * SSE 流式数据事件类型
 */
interface SseStreamEvent {
  requestId: string;
  eventType: "chunk" | "done" | "error" | "tool_call";
  data?: string;
  error?: string;
}

// MCP Tool 的标准格式
// export interface McpTool {
//   name: string;
//   description: string;
//   parameters: Record<string, any>; // JSON Schema
// }

export interface AiStreamPayload {
  clientMsgId: string;
  conversationId: string;
  content:
    | string
    | {
        text: string;
        images?: string[];
        videos?: string[];
        audios?: string[];
        files?: string[];
      };
  options?: {
    useReasoning?: boolean;
    useNetwork?: boolean;
  };
  agentSettings?: {
    systemPrompt?: string;
    mcpTools?: any[];
  };
  toolResults?: any[];
}

/**
 * 流式数据回调函数
 */
export interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onToolCall?: (toolCall: any) => void;
  onDone?: (fullContent: string) => void;
  onError?: (error: string) => void;
}

/**
 * 发送 AI 流式消息
 * @param body 请求体
 * @param requestId 请求id，用于取消
 * @param callbacks 回调函数
 */
export async function messageSendStream(
  body: AiStreamPayload,
  requestId: string,
  callbacks?: StreamCallbacks
): Promise<string> {
  const { invoke, Channel } = await import("@tauri-apps/api/core");
  const { TauriCommandEnum } = await import("@/enums");

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
            try {
              const parsedData = JSON.parse(data);
              // 如果是工具调用指令，直接拦截并触发专门的回调，不当做普通文本处理
              if (parsedData.status === "tool_call" && parsedData.toolCall) {
                callbacks?.onToolCall?.(parsedData.toolCall);
                return;
              }
              // 2如果是正常的结构化文本流，提取 chunk 字段
              if (parsedData.chunk !== undefined) {
                fullContent += parsedData.chunk;
                callbacks?.onChunk?.(parsedData.chunk);
                return;
              }
            } catch (_) {
              // 解析失败说明后端传的不是 JSON，而是纯文本，走兜底逻辑原样拼接
              fullContent += data;
              callbacks?.onChunk?.(data);
            }
          }
          break;
        case "done":
          if (!isResolved) {
            isResolved = true;
            callbacks?.onDone?.(fullContent);
            resolve(fullContent);
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

/**
 * 取消 AI 流式消息
 * @param requestId 请求 ID
 */
export async function messageCancelStream(requestId: string): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke(TauriCommandEnum.AI_MESSAGE_CANCEL_STREAM, { requestId });
}
