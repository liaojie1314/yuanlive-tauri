import { invoke } from "@tauri-apps/api/core";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import { TauriCommandEnum } from "@/enums";
import { useAiStore } from "@/stores/ai";

const isReady = ref(false);
const isInitializing = ref(false);
let unlistenMcpMessage: UnlistenFn | null = null;

export function useMcp() {
  const pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
  let messageIdCounter = 1;

  /**
   * 初始化 MCP 服务
   * 1. 监听 mcp-message 事件
   * 2. 启动 MCP 进程
   * 3. 执行握手流程
   */
  async function initMcp() {
    // 如果已经就绪，或者正在初始化中，直接 return，防止重复启动 .exe 和重复注册监听器
    if (isReady.value || isInitializing.value) {
      console.log("✅ MCP 已经就绪或正在初始化，跳过启动逻辑...");
      return;
    }

    isInitializing.value = true;

    try {
      // 1. 注册监听前，清理可能存在的旧监听（防御性编程）
      if (unlistenMcpMessage) {
        unlistenMcpMessage();
      }

      unlistenMcpMessage = await listen<string>("mcp-message", (event) => {
        try {
          const response = JSON.parse(event.payload);
          if (response.id && pendingRequests.has(response.id)) {
            const { resolve, reject } = pendingRequests.get(response.id)!;
            if (response.error) {
              reject(response.error);
            } else {
              resolve(response.result);
            }
            pendingRequests.delete(response.id);
          }
        } catch (e) {
          console.error("解析 MCP 消息失败:", e, event.payload);
        }
      });

      // 2. 启动进程
      await invoke(TauriCommandEnum.START_MCP);
      console.log("🚀 MCP 进程启动，准备握手...");

      // 3. 握手
      await initHandshake();

      // 4. 握手成功后，立刻拉取工具列表并缓存
      console.log("正在拉取 windows-mcp 工具列表...");
      const rawToolsResponse = await getToolsList();

      const aiStore = useAiStore();
      // 将拉取到的 Schema 数组存入全局 Store
      if (rawToolsResponse && rawToolsResponse.tools) {
        aiStore.cachedWindowsTools = rawToolsResponse.tools;
        console.log(`✅ 成功缓存了 ${rawToolsResponse.tools.length} 个 Windows 工具`);
      }

      isReady.value = true;
      console.log("🎉 MCP 服务完全就绪！");
    } catch (e) {
      console.error("❌ MCP 服务启动失败:", e);
    } finally {
      // 无论成功还是失败，解除初始化中的锁定状态
      isInitializing.value = false;
    }
  }

  /**
   * 向 MCP 发送请求
   * @param method MCP 方法名
   * @param params 请求参数（可选）
   * @returns Promise 解析为 MCP 响应结果
   */
  function requestMcp(method: string, params?: any) {
    return new Promise((resolve, reject) => {
      const id = messageIdCounter++;

      const reqPayload: any = {
        jsonrpc: "2.0",
        id: id,
        method: method
      };

      // 只有当 params 真正有内容时，才加上 params 字段
      if (params && Object.keys(params).length > 0) {
        reqPayload.params = params;
      }

      pendingRequests.set(id, { resolve, reject });
      invoke(TauriCommandEnum.SEND_TO_MCP, { payload: JSON.stringify(reqPayload) }).catch(reject);
    });
  }

  /**
   * MCP 强制要求的初始化握手流程
   * 1. 发送 initialize 请求
   * 2. 发送 initialized 通知
   */
  async function initHandshake() {
    // 1. 发送 initialize 请求
    const initResult = await requestMcp("initialize", {
      protocolVersion: "2024-11-05", // 标准 MCP 协议版本
      capabilities: {},
      clientInfo: {
        name: "yuanlive-tauri",
        version: "0.4.0"
      }
    });
    console.log("握手回复:", initResult);

    // 2. 发送 initialized 通知 (通知是没有 id 的，直接调用 invoke 发送)
    const notifyPayload = JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized"
    });
    await invoke(TauriCommandEnum.SEND_TO_MCP, { payload: notifyPayload });
  }

  /**
   * 获取 MCP 支持的工具列表
   * @returns Promise 解析为工具列表数组
   */
  async function getToolsList(): Promise<McpToolsResponse> {
    return (await requestMcp("tools/list")) as McpToolsResponse;
  }

  /**
   * 调用 MCP 工具
   * @param name 工具名称
   * @param args 工具参数
   * @returns Promise 解析为工具调用结果
   */
  async function callTool(name: string, args: any) {
    return await requestMcp("tools/call", {
      name: name,
      arguments: args
    });
  }

  return {
    initMcp,
    getToolsList,
    callTool,
    isReady
  };
}
