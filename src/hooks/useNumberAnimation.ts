export function useNumberAnimation(targetValue: () => number, duration: number = 1000) {
  const displayedValue = ref(0);

  const animate = () => {
    const end = targetValue() || 0;
    const start = 0; // 每次都从0开始，或者改为 displayedValue.value 以实现增量更新
    const startTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // 使用 easeOutQuart 缓动函数让动画更自然
      const easeProgress = 1 - (1 - progress) ** 4;

      displayedValue.value = Math.floor(start + (end - start) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        displayedValue.value = end;
      }
    };

    requestAnimationFrame(frame);
  };

  // 监听值变化重新动画
  watch(targetValue, () => {
    animate();
  });

  // 组件挂载时执行一次
  onMounted(() => {
    animate();
  });

  return displayedValue;
}
