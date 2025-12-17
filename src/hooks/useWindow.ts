import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { UserAttentionType } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

import { isCompatibility, isDesktop, isWindows, isWindows10 } from "@/utils/PlatformUtils";
import { EventEnum } from "../enums";

// 判断是兼容的系统
const isCompatibilityMode = computed(() => isCompatibility());

export const useWindow = () => {
  /**
   * 创建窗口
   * @param title 窗口标题
   * @param label 窗口名称
   * @param width 窗口宽度
   * @param height 窗口高度
   * @param wantCloseWindow 创建后需要关闭的窗口
   * @param resizable 调整窗口大小
   * @param minWidth 窗口最小宽度
   * @param minHeight 窗口最小高度
   * @param transparent 是否透明
   * @param visible 是否显示
   * @param queryParams URL查询参数
   * */
  const createWebviewWindow = async (
    title: string,
    label: string,
    width: number,
    height: number,
    wantCloseWindow?: string,
    resizable = false,
    minWidth = 330,
    minHeight = 495,
    transparent?: boolean,
    visible = false,
    queryParams?: Record<string, string | number | boolean>
  ) => {
    // 移动端不支持窗口管理，直接返回空对象
    if (!isDesktop()) {
      return null;
    }
    const originalLabel = label;
    const isMultiMsgWindow = originalLabel.includes(EventEnum.MULTI_MSG);
    const checkLabel = () => {
      // 如果是打开独立窗口就截取label中的固定label名称
      if (label.includes(EventEnum.ALONE)) {
        return label.replace(/\d/g, "");
      } else {
        return label;
      }
    };
    // 对于multiMsg类型的窗口，保留原始label用于窗口标识，但URL路由统一指向 /multiMsg
    label = isMultiMsgWindow ? originalLabel : checkLabel();
    // 构建URL，包含查询参数
    let url = isMultiMsgWindow ? `/${EventEnum.MULTI_MSG}` : `/${label.split("--")[0]}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }
    const webview = new WebviewWindow(label, {
      url,
      title,
      width,
      height,
      visible,
      minWidth,
      minHeight,
      resizable,
      center: true,
      fullscreen: false,
      skipTaskbar: false,
      decorations: !isCompatibilityMode.value,
      transparent: transparent || isCompatibilityMode.value,
      titleBarStyle: "overlay", // mac覆盖标签栏
      hiddenTitle: true, // mac隐藏标题栏
      ...(isWindows10() ? { shadow: false } : {})
    });

    await webview.once("tauri://created", async () => {
      if (wantCloseWindow) {
        const win = await WebviewWindow.getByLabel(wantCloseWindow);
        win?.close();
      }
    });

    await webview.once("tauri://error", async (e) => {
      console.error("窗口创建失败:", e);
      await checkWinExist(label);
    });

    return webview;
  };

  /**
   * 创建模态子窗口
   * @param title 窗口标题
   * @param label 窗口标识
   * @param width 窗口宽度
   * @param height 窗口高度
   * @param parent 父窗口
   * @param payload 传递给子窗口的数据
   * @param options 窗口选项
   * @returns 创建的窗口实例或已存在的窗口实例
   */
  const createModalWindow = async (
    title: string,
    label: string,
    width: number,
    height: number,
    parent: string,
    payload?: Record<string, any>,
    options?: {
      minWidth?: number;
      minHeight?: number;
    }
  ) => {
    // 移动端不支持窗口管理
    if (!isDesktop()) {
      return null;
    }
    // 检查窗口是否已存在
    const existingWindow = await WebviewWindow.getByLabel(label);
    const parentWindow = parent ? await WebviewWindow.getByLabel(parent) : null;
    if (existingWindow) {
      // 如果窗口已存在，则聚焦到现有窗口并使其闪烁
      existingWindow.requestUserAttention(UserAttentionType.Critical);
      return existingWindow;
    }
    // 创建新窗口
    const modalWindow = new WebviewWindow(label, {
      url: `/${label}`,
      title,
      width,
      height,
      resizable: false,
      center: true,
      minWidth: options?.minWidth ?? 500,
      minHeight: options?.minHeight ?? 500,
      focus: true,
      minimizable: false,
      parent: parentWindow ? parentWindow : parent,
      decorations: !isCompatibilityMode.value,
      transparent: isCompatibilityMode.value,
      titleBarStyle: "overlay", // mac覆盖标签栏
      hiddenTitle: true, // mac隐藏标题栏
      visible: false,
      ...(isWindows10() ? { shadow: false } : {})
    });

    // 监听窗口创建完成事件
    modalWindow.once("tauri://created", async () => {
      if (isWindows()) {
        // 禁用父窗口，模拟模态窗口效果
        await parentWindow?.setEnabled(false);
      }
      // 如果有 payload，发送到子窗口
      if (payload) {
        await sendWindowPayload(label, payload);
      }
      // 设置窗口为焦点
      await modalWindow.setFocus();
    });
    // 监听错误事件
    modalWindow.once("tauri://error", async (e) => {
      console.error(`${title}窗口创建失败:`, e);
      window.$message?.error(`创建${title}窗口失败`);
      await parentWindow?.setEnabled(true);
    });
    modalWindow.once("tauri://destroyed", async () => {
      if (isWindows()) {
        try {
          await parentWindow?.setEnabled(true);
        } catch (error) {
          console.error("重新启用父窗口失败:", error);
        }
      }
    });
    return modalWindow;
  };

  /**
   * 向指定标签的窗口发送载荷（payload），可用于窗口之间通信。
   * @param windowLabel - 要发送载荷的窗口标签，通常是在创建窗口时指定的 label。
   * @param payload - 要发送的 JSON 数据对象，不限制字段内容。
   * @returns 返回一个 Promise，表示调用 Rust 后端命令的完成情况。
   */
  const sendWindowPayload = async (windowLabel: string, payload: any) => {
    // 移动端不支持窗口管理
    if (!isDesktop()) {
      return Promise.resolve();
    }
    console.log("新窗口的载荷：", payload);
    return invoke<void>("push_window_payload", {
      label: windowLabel,
      // 这个payload只要是json就能传，不限制字段
      payload
    });
  };

  /**
   * 获取指定窗口的当前载荷（payload），用于初始化窗口时获取传递的数据。
   * @param windowLabel - 要获取载荷的窗口标签。
   * @param once - 是否仅获取一次载荷，默认值为 true。
   * @returns 返回一个 Promise，解析后为泛型 T，表示窗口中保存的 payload 数据。
   */
  const getWindowPayload = async <T>(windowLabel: string, once: boolean = true) => {
    // 移动端不支持窗口管理
    if (!isDesktop()) {
      return Promise.resolve({} as T);
    }
    return await invoke<T>("get_window_payload", { label: windowLabel, once });
  };

  /**
   * 调整窗口大小
   * @param label 窗口名称
   * @param width 窗口宽度
   * @param height 窗口高度
   * */
  const resizeWindow = async (label: string, width: number, height: number) => {
    const webview = await WebviewWindow.getByLabel(label);
    // 创建一个新的尺寸对象
    const newSize = new LogicalSize(width, height);
    // 调用窗口的 setSize 方法进行尺寸调整
    await webview?.setSize(newSize).catch((error) => {
      console.error("无法调整窗口大小: ", error);
    });
  };

  /**
   * 检查窗口是否存在
   * @param L 窗口标签
   */
  const checkWinExist = async (L: string) => {
    const isExistsWinds = await WebviewWindow.getByLabel(L);
    if (isExistsWinds) {
      nextTick().then(async () => {
        // 如果窗口已存在，首先检查是否最小化了
        const minimized = await isExistsWinds.isMinimized();
        // 检查是否是隐藏
        const isVisible = await isExistsWinds.isVisible();
        if (!isVisible) {
          await isExistsWinds.show();
        }
        if (minimized) {
          // 如果已最小化，恢复窗口
          await isExistsWinds.unminimize();
        }
        // 如果窗口已存在，则给它焦点，使其在最前面显示
        await isExistsWinds.setFocus();
      });
    }
  };

  /**
   * 设置窗口是否可调整大小
   * @param label 窗口名称
   * @param resizable 是否可调整大小
   */
  const setResizable = async (label: string, resizable: boolean) => {
    const webview = await WebviewWindow.getByLabel(label);
    if (webview) {
      await webview.setResizable(resizable).catch((error) => {
        console.error("设置窗口可调整大小失败:", error);
      });
    }
  };

  return {
    createWebviewWindow,
    createModalWindow,
    sendWindowPayload,
    getWindowPayload,
    resizeWindow,
    checkWinExist,
    setResizable
  };
};
