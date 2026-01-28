import type { Directive, DirectiveBinding } from "vue";

const map = new WeakMap<Element, (size: { width: number; height: number }) => void>();

const ob = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const handler = map.get(entry.target);
    if (handler) {
      // 更加安全的获取尺寸方式
      const box = entry.borderBoxSize?.[0];
      if (box) {
        handler({
          width: box.inlineSize,
          height: box.blockSize
        });
      } else {
        // 降级处理：某些旧浏览器可能只支持 contentRect
        handler({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    }
  }
});

export const vResize: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    // 将回调函数存入 map
    map.set(el, binding.value);
    // 开始监听
    ob.observe(el);
  },
  unmounted(el: HTMLElement) {
    // 取消监听并清理 map
    ob.unobserve(el);
    map.delete(el);
  }
};
