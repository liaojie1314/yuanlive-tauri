import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { isWindows10 } from "@/utils/PlatformUtils";

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
    visible = false
  ) => {
    const webview = new WebviewWindow(label, {
      title,
      width,
      height,
      visible,
      minWidth,
      minHeight,
      resizable,
      transparent,
      center: true,
      url: `/${label}`,
      fullscreen: false,
      skipTaskbar: false,
      decorations: true,
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
      console.error("无法调整窗口大小:", error);
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
        const hidden = await isExistsWinds.isVisible();
        if (!hidden) {
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
    resizeWindow,
    checkWinExist,
    setResizable
  };
};
