import type { Ref } from "vue";
import * as echarts from "echarts";
import { useDebounceFn } from "@vueuse/core";

export function useEcharts(elRef: Ref<HTMLElement | null | undefined>, theme: string | object | null = "default") {
  const chartInstance = ref<echarts.ECharts | null>(null);
  const initChart = async () => {
    await nextTick();
    if (!elRef.value) return;

    const instance = echarts.init(elRef.value, theme);
    chartInstance.value = markRaw(instance);
  };

  const setOption = (option: echarts.EChartsOption) => {
    if (!chartInstance.value) {
      initChart().then(() => {
        chartInstance.value?.setOption(option);
      });
    } else {
      chartInstance.value.setOption(option);
    }
  };

  const resize = useDebounceFn(() => {
    chartInstance.value?.resize();
  }, 200);

  onMounted(() => {
    initChart();
  });

  onUnmounted(() => {
    chartInstance.value?.dispose();
    chartInstance.value = null;
  });

  return {
    chartInstance,
    setOption,
    resize
  };
}
