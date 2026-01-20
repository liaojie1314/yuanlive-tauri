import { invoke } from "@tauri-apps/api/core";
import { error, info, warn } from "@tauri-apps/plugin-log";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

import { StorageKeyEnum, WsResponseMessageEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";

/// WebSocket 连接状态
export enum ConnectionState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
  ERROR = "ERROR"
}

class ListenerController {
  private listeners: Set<UnlistenFn> = new Set();
  private isAborted = false;

  add(unlisten: UnlistenFn): void {
    if (this.isAborted) {
      // 如果已经中止，立即清理新添加的监听器
      unlisten();
      return;
    }
    this.listeners.add(unlisten);
  }

  async abort(): Promise<void> {
    if (this.isAborted) return;

    this.isAborted = true;
    const cleanupPromises: Promise<void>[] = [];

    // 并行执行所有清理操作
    for (const unlisten of this.listeners) {
      cleanupPromises.push(
        Promise.resolve()
          .then(() => unlisten())
          .catch((err) => {
            error(`[ListenerController] 清理监听器失败: ${err}`);
          })
      );
    }

    // 等待所有清理完成（设置超时防止阻塞）
    try {
      await Promise.race([
        Promise.all(cleanupPromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error("清理超时")), 5000))
      ]);
    } catch (err) {
      warn(`[ListenerController] 部分监听器清理可能未完成: ${err}`);
    }

    this.listeners.clear();
    info(`[ListenerController] 已清理所有监听器`);
  }

  get size(): number {
    return this.listeners.size;
  }

  get aborted(): boolean {
    return this.isAborted;
  }
}

class WebSocketRust {
  private listenerController: ListenerController = new ListenerController();

  /**
   * 初始化 WebSocket 连接
   */
  async initConnect() {
    try {
      const deviceId = localStorage.getItem(StorageKeyEnum.DEVICE_ID);
      const params = {
        deviceId: deviceId || ""
      };
      info(`[RustWS] 初始化连接参数: ${JSON.stringify(params)}`);
      await invoke("ws_init_connection", { params });
      info("[RustWS] 连接初始化成功");
    } catch (e) {
      error(`[RustWS] 连接初始化错误: ${e}`);
      throw e;
    }
  }

  /**
   * 断开 WebSocket 连接
   */
  async disconnect() {
    try {
      await invoke("ws_disconnect");
      info("[RustWS] 断开连接成功");
    } catch (e) {
      error(`[RustWS] 断开连接失败: ${e}`);
      throw e;
    }
  }

  /**
   * 发送消息
   * @param data
   */
  async sendMessage(data: any) {
    try {
      await invoke("ws_send_message", { params: { data } });
      info(`[RustWS] 发送消息: ${data}`);
    } catch (e) {
      error(`[RustWS] 发送消息错误: ${e}`);
      throw e;
    }
  }

  /**
   * 获取连接状态
   */
  async getState(): Promise<ConnectionState> {
    try {
      return await invoke<ConnectionState>("ws_get_state");
    } catch (err) {
      error(`[RustWS] 获取连接状态失败: ${err}`);
      return ConnectionState.ERROR;
    }
  }

  /**
   * 强制重连
   */
  async forceReconnect(): Promise<void> {
    try {
      await invoke("ws_force_reconnect");
      info("[RustWS] 强制重连成功");
    } catch (err) {
      error(`[RustWS] 强制重连失败: ${err}`);
      throw err;
    }
  }

  /**
   * 检查是否已连接
   */
  async isConnected(): Promise<boolean> {
    try {
      return await invoke<boolean>("ws_is_connected");
    } catch (err) {
      error(`[RustWS] 检查连接状态失败: ${err}`);
      return false;
    }
  }

  public async setupBusinessMessageListeners(): Promise<void> {
    this.listenerController.add(
      await listen("ws-remote-login", async (event: any) => {
        info("账号在其他设备登录");
        useMitt.emit(WsResponseMessageEnum.REMOTE_LOGIN, event.payload);
      })
    );

    // 未知消息类型
    this.listenerController.add(
      await listen("ws-unknown-message", (event: any) => {
        info(`接收到未处理类型的消息: ${JSON.stringify(event.payload)}`);
      })
    );
  }
}

const webSocketRust = new WebSocketRust();
export default webSocketRust;
