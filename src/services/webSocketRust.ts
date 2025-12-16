import { StorageKeyEnum } from "@/enums";
import { error, info } from "@tauri-apps/plugin-log";
import { invoke } from "@tauri-apps/api/core";

/// WebSocket 连接状态
export enum ConnectionState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
  ERROR = "ERROR"
}

class WebSocketRust {
  /**
   * 初始化 WebSocket 连接
   */
  async initConnect() {
    try {
      const clientId = localStorage.getItem(StorageKeyEnum.CLIENT_ID);
      const params = {
        clientId: clientId || ""
      };
      await info(`[RustWS] 初始化连接参数: ${JSON.stringify(params)}`);
      await invoke("ws_init_connection", { params });
      await info("[RustWS] 连接初始化成功");
    } catch (e) {
      await error(`[RustWS] 连接初始化错误: ${e}`);
      throw e;
    }
  }

  /**
   * 断开 WebSocket 连接
   */
  async disconnect() {
    try {
      await invoke("ws_disconnect");
      await info("[RustWS] 断开连接成功");
    } catch (e) {
      await error(`[RustWS] 断开连接失败: ${e}`);
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
      await info(`[RustWS] 发送消息: ${data}`);
    } catch (e) {
      await error(`[RustWS] 发送消息错误: ${e}`);
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
      await error(`[RustWS] 获取连接状态失败: ${err}`);
      return ConnectionState.ERROR;
    }
  }

  /**
   * 强制重连
   */
  async forceReconnect(): Promise<void> {
    try {
      await invoke("ws_force_reconnect");
      await info("[RustWS] 强制重连成功");
    } catch (err) {
      await error(`[RustWS] 强制重连失败: ${err}`);
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
      await error(`[RustWS] 检查连接状态失败: ${err}`);
      return false;
    }
  }
}

const webSocketRust = new WebSocketRust();
export default webSocketRust;
