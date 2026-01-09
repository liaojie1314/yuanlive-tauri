import type { Ref } from "vue";

export function useResizeObserver(targetRef: Ref<HTMLElement | null | undefined>, callback: ResizeObserverCallback) {
  let observer: ResizeObserver | null = null;

  const initObserver = () => {
    if (observer) {
      observer.disconnect();
    }

    if (targetRef.value) {
      observer = new ResizeObserver(callback);
      observer.observe(targetRef.value);
    }
  };

  onMounted(() => {
    initObserver();
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  // 监听目标元素变化，支持动态改变目标
  watch(targetRef, () => {
    initObserver();
  });

  // 暴露手动控制方法
  return {
    disconnect: () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },
    reconnect: () => {
      initObserver();
    }
  };
}
