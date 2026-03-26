import type { Directive, DirectiveBinding } from "vue";

const map = new WeakMap<Element, (size: { width: number; height: number }, el: HTMLElement) => void>();

const ob = new ResizeObserver((entries) => {
  // 使用 requestAnimationFrame 防止重绘时的 "ResizeObserver loop limit exceeded" 报错
  window.requestAnimationFrame(() => {
    for (const entry of entries) {
      const handler = map.get(entry.target);
      if (handler) {
        const box = entry.borderBoxSize?.[0];
        const el = entry.target as HTMLElement; // 拿到 DOM 元素
        if (box) {
          handler({ width: box.inlineSize, height: box.blockSize }, el); // 🌟 2. 传出 el
        } else {
          handler({ width: entry.contentRect.width, height: entry.contentRect.height }, el); // 🌟 2. 传出 el
        }
      }
    }
  });
});

export const vResize: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    // 将回调函数存入 map
    map.set(el, binding.value);
    // 开始监听
    ob.observe(el);
  },
  // 增加 updated 钩子，保证模板里写内联箭头函数时能拿到最新闭包
  updated(el: HTMLElement, binding: DirectiveBinding) {
    map.set(el, binding.value);
  },
  unmounted(el: HTMLElement) {
    // 取消监听并清理 map
    ob.unobserve(el);
    map.delete(el);
  }
};
