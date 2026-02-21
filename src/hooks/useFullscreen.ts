import { type Ref } from "vue";

export function useFullscreen(targetRef?: Ref<HTMLElement | null>) {
  const isFullscreen = ref(false);

  // 兼容获取当前全屏元素
  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  };

  const updateFullscreenState = () => {
    isFullscreen.value = !!getFullscreenElement();
  };

  // 进入全屏
  const enterFullscreen = (element?: HTMLElement) => {
    // 优先使用传入的元素，其次使用 targetRef，默认使用整个 html
    const target = element || targetRef?.value || document.documentElement;
    if (target.requestFullscreen) {
      target.requestFullscreen();
    } else if ((target as any).webkitRequestFullscreen) {
      (target as any).webkitRequestFullscreen();
    } else if ((target as any).mozRequestFullScreen) {
      (target as any).mozRequestFullScreen();
    } else if ((target as any).msRequestFullscreen) {
      (target as any).msRequestFullscreen();
    }
  };

  // 退出全屏
  const exitFullscreen = () => {
    if (!getFullscreenElement()) return;

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  };

  // 切换全屏
  const toggleFullscreen = (element?: HTMLElement) => {
    if (isFullscreen.value) {
      exitFullscreen();
    } else {
      enterFullscreen(element);
    }
  };

  onMounted(() => {
    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);
    document.addEventListener("webkitfullscreenchange", updateFullscreenState);
    document.addEventListener("mozfullscreenchange", updateFullscreenState);
    document.addEventListener("MSFullscreenChange", updateFullscreenState);
  });

  onUnmounted(() => {
    document.removeEventListener("fullscreenchange", updateFullscreenState);
    document.removeEventListener("webkitfullscreenchange", updateFullscreenState);
    document.removeEventListener("mozfullscreenchange", updateFullscreenState);
    document.removeEventListener("MSFullscreenChange", updateFullscreenState);
  });

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
}
