import { useTimeoutFn } from "@vueuse/core";

import { useWindow } from "@/hooks/useWindow.ts";

export const leftHook = () => {
  const router = useRouter();
  const { createWebviewWindow } = useWindow();

  const tipShow = ref(true);
  const activeUrl = ref<string>("index");
  /** 已打开窗口的列表 */
  const openWindowsList = ref(new Set());

  /**
   * 侧边栏部分跳转窗口路由事件
   * @param url 跳转的路由
   * @param title 创建窗口时的标题
   * @param size 窗口的大小
   * @param window 窗口参数
   * */
  const pageJumps = (
    url: string,
    title?: string,
    size?: { width: number; height: number; minWidth?: number; minHeight?: number },
    window?: { resizable: boolean }
  ) => {
    if (window) {
      useTimeoutFn(async () => {
        const webview = await createWebviewWindow(
          title!,
          url,
          <number>size?.width,
          <number>size?.height,
          "",
          window?.resizable,
          <number>size?.minWidth,
          <number>size?.minHeight
        );
        openWindowsList.value.add(url);

        const unlisten = await webview?.onCloseRequested(() => {
          openWindowsList.value.delete(url);
          if (unlisten) unlisten();
        });
      }, 300);
    } else {
      activeUrl.value = url;
      router.push(`/${url}`);
    }
  };

  onMounted(async () => {
    pageJumps(activeUrl.value);
  });

  return {
    activeUrl,
    tipShow,
    openWindowsList,
    pageJumps
  };
};
