<template>
  <n-config-provider :theme="naiveTheme" abstract>
    <div class="h-full flex flex-col bg-[var(--right-bg-color)] text-[var(--text-color)] overflow-hidden">
      <action-bar />

      <n-scrollbar class="flex-1 p-6 box-border">
        <div class="flex flex-col gap-6 pb-4">
          <div
            class="bg-[var(--tray-bg-color)] p-6 rounded-2xl border border-[var(--line-color)] flex flex-col lg:flex-row gap-6 shadow-sm transition-all hover:shadow-md">
            <div
              class="w-full lg:w-72 aspect-video rounded-xl overflow-hidden border border-[var(--line-color)] relative group shrink-0">
              <img
                src="https://picsum.photos/id/48/600/400"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors cursor-pointer">
                <i-mdi-play-circle-outline
                  class="text-5xl text-white/90 drop-shadow-lg transform transition-transform group-hover:scale-110" />
              </div>
              <div class="absolute top-2 left-2">
                <n-tag type="default" size="small" :bordered="false" class="!bg-black/60 !text-white backdrop-blur-sm">
                  闲聊分区
                </n-tag>
              </div>
              <div
                class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md flex items-center gap-1">
                <i-mdi-video-check-outline />
                回放已生成
              </div>
            </div>

            <div class="flex-1 flex flex-col justify-between py-1 min-w-0">
              <div class="space-y-3">
                <h2
                  class="text-2xl font-bold leading-tight truncate"
                  title="这是昨晚的直播标题：聊聊Tauri开发与Vue3的最佳实践">
                  这是昨晚的直播标题：聊聊Tauri开发与Vue3的最佳实践
                </h2>

                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                  <div class="flex items-center gap-1.5 bg-[var(--bg-setting-item)] px-2 py-1 rounded">
                    <i-mdi-calendar-clock class="text-blue-500" />
                    <span>2026-02-11 19:30 ~ 23:45</span>
                  </div>
                  <div class="flex items-center gap-1.5 bg-[var(--bg-setting-item)] px-2 py-1 rounded">
                    <i-mdi-timer-outline class="text-orange-500" />
                    <span>时长: 04:15:20</span>
                  </div>
                </div>
              </div>

              <div
                class="grid grid-cols-3 gap-4 lg:gap-8 mt-6 lg:mt-0 pt-4 border-t border-[var(--line-color)] border-dashed">
                <div>
                  <div class="text-xs text-gray-400 mb-1">平均人气</div>
                  <div class="font-bold text-xl lg:text-2xl font-mono">45,200</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400 mb-1">最高并发 (PCU)</div>
                  <div class="font-bold text-xl lg:text-2xl font-mono text-[var(--text-color)]">12,045</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400 mb-1">互动率</div>
                  <div class="font-bold text-xl lg:text-2xl font-mono text-blue-500">12.5%</div>
                </div>
              </div>
            </div>

            <div
              class="flex flex-row lg:flex-col gap-3 justify-center lg:border-l border-[var(--line-color)] lg:pl-6 border-t lg:border-t-0 pt-4 lg:pt-0 shrink-0">
              <n-button type="primary" class="flex-1 lg:flex-none lg:w-32" secondary>
                <template #icon><i-mdi-download /></template>
                下载录像
              </n-button>
              <n-button secondary class="flex-1 lg:flex-none lg:w-32">
                <template #icon><i-mdi-file-chart-outline /></template>
                导出报表
              </n-button>
              <n-button secondary class="flex-1 lg:flex-none lg:w-32">
                <template #icon><i-mdi-comment-processing-outline /></template>
                弹幕分析
              </n-button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <n-card class="stats-card" :bordered="false" content-style="padding: 20px;">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">累计观看 (UV)</div>
                  <div class="text-3xl font-bold font-mono text-[var(--text-color)]">156,032</div>
                </div>
                <div class="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-500">
                  <i-mdi-account-group class="text-3xl" />
                </div>
              </div>
            </n-card>
            <n-card class="stats-card" :bordered="false" content-style="padding: 20px;">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总营收 (CNY)</div>
                  <div class="text-3xl font-bold font-mono text-yellow-500">3,240.5</div>
                </div>
                <div class="p-3.5 rounded-2xl bg-yellow-50 dark:bg-yellow-500/20 text-yellow-500">
                  <i-mdi-currency-usd class="text-3xl" />
                </div>
              </div>
            </n-card>
            <n-card class="stats-card" :bordered="false" content-style="padding: 20px;">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">弹幕总量</div>
                  <div class="text-3xl font-bold font-mono text-blue-500">28,902</div>
                </div>
                <div class="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-500">
                  <i-mdi-message-processing class="text-3xl" />
                </div>
              </div>
            </n-card>
            <n-card class="stats-card" :bordered="false" content-style="padding: 20px;">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">净增粉丝</div>
                  <div class="text-3xl font-bold font-mono text-green-500">+456</div>
                </div>
                <div class="p-3.5 rounded-2xl bg-green-50 dark:bg-green-500/20 text-green-500">
                  <i-mdi-heart-plus class="text-3xl" />
                </div>
              </div>
            </n-card>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <n-card
              title="全场流量趋势复盘"
              :bordered="false"
              class="chart-card lg:col-span-2"
              content-style="padding: 10px;"
              header-style="padding: 16px 20px;">
              <div ref="trendChartRef" class="w-full h-[360px]"></div>
            </n-card>

            <n-card
              title="弹幕热词 TOP10"
              :bordered="false"
              class="chart-card lg:col-span-1"
              content-style="padding: 0;"
              header-style="padding: 16px 20px;">
              <div class="h-[360px] p-4 flex flex-col justify-center gap-3">
                <div v-for="(item, idx) in hotWords" :key="idx" class="flex items-center gap-3 group cursor-default">
                  <div class="text-xs font-mono w-6 text-gray-400 group-hover:text-[var(--primary-color)]">
                    #{{ idx + 1 }}
                  </div>
                  <div class="flex-1 relative h-7 bg-[var(--bg-setting-item)] rounded-md overflow-hidden">
                    <div
                      class="absolute left-0 top-0 bottom-0 bg-blue-500/20 transition-all duration-500"
                      :style="{ width: item.percent + '%' }"></div>
                    <div class="absolute inset-0 flex items-center justify-between px-3 text-xs z-10">
                      <span class="font-bold group-hover:text-blue-500 transition-colors">{{ item.word }}</span>
                      <span class="text-gray-500">{{ item.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </n-card>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <n-card
              title="Super Chat (醒目留言) 记录"
              :bordered="false"
              class="chart-card"
              content-style="padding: 0;"
              header-style="padding: 16px 20px;">
              <div class="h-[480px]">
                <n-data-table
                  :columns="scColumns"
                  :data="scData"
                  :bordered="false"
                  size="small"
                  flex-height
                  class="h-full"
                  :row-class-name="() => 'hover:bg-[var(--bg-setting-item)] transition-colors'" />
              </div>
            </n-card>

            <n-card
              title="礼物贡献总榜 (Top 10)"
              :bordered="false"
              class="chart-card"
              content-style="padding: 0;"
              header-style="padding: 16px 20px;">
              <div class="h-[480px]">
                <n-data-table
                  :columns="giftColumns"
                  :data="giftData"
                  :bordered="false"
                  size="small"
                  flex-height
                  class="h-full"
                  :row-class-name="() => 'hover:bg-[var(--bg-setting-item)] transition-colors'" />
              </div>
            </n-card>
          </div>

          <n-card
            title="所有直播记录"
            :bordered="false"
            class="chart-card"
            content-style="padding: 0;"
            header-style="padding: 16px 20px;">
            <template #header-extra>
              <div class="flex gap-2">
                <n-date-picker type="daterange" size="small" clearable class="w-80" />
                <n-input placeholder="搜索标题" size="small" class="w-48">
                  <template #prefix><i-mdi-magnify /></template>
                </n-input>
              </div>
            </template>
            <n-data-table
              class="mb-2"
              :columns="historyColumns"
              :data="historyData"
              :bordered="false"
              :pagination="{ pageSize: 5 }"
              size="large"
              :row-class-name="() => 'hover:bg-[var(--bg-setting-item)] transition-colors'" />
          </n-card>
        </div>
      </n-scrollbar>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { darkTheme, lightTheme, NTag, NButton, NAvatar, type DataTableColumns } from "naive-ui";

import { ThemeEnum } from "@/enums";
import { useEcharts } from "@/hooks/useEcharts";
import { useSettingStore } from "@/stores/setting";

const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);
const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));

const trendChartRef = ref<HTMLElement | null>(null);
const { setOption, resize } = useEcharts(trendChartRef);

// 历史直播列表
interface HistoryStream {
  key: string;
  title: string;
  startTime: string;
  duration: string;
  stats: { uv: number; revenue: number; danmaku: number };
  cover: string;
}

const hotWords = [
  { word: "2333", count: 2103, percent: 100 },
  { word: "太强了", count: 1540, percent: 80 },
  { word: "学废了", count: 890, percent: 60 },
  { word: "下次一定", count: 750, percent: 45 },
  { word: "BGM?", count: 620, percent: 30 },
  { word: "下饭", count: 520, percent: 25 },
  { word: "晚安", count: 480, percent: 20 },
  { word: "Vue", count: 320, percent: 15 }
];

const scColumns = [
  {
    title: "用户",
    key: "user",
    width: 140,
    render: (row: any) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(NAvatar, { size: 24, round: true, src: row.avatar }),
        h("span", { class: "font-bold text-xs" }, row.user)
      ])
  },
  {
    title: "金额",
    key: "price",
    width: 80,
    render: (row: any) =>
      h(NTag, { type: "warning", size: "small", bordered: false }, { default: () => `¥${row.price}` })
  },
  { title: "留言内容", key: "content", ellipsis: { tooltip: true } },
  { title: "时间", key: "time", width: 80, className: "text-gray-400 font-mono text-xs" }
];

// 礼物榜单数据
const giftData = [
  { key: 1, user: "榜一大哥", avatar: "https://picsum.photos/seed/1/40", total: 50000 },
  { key: 2, user: "Tauri粉丝", avatar: "https://picsum.photos/seed/2/40", total: 32000 },
  { key: 3, user: "Vue开发者", avatar: "https://picsum.photos/seed/3/40", total: 18000 },
  { key: 4, user: "路人甲", avatar: "https://picsum.photos/seed/4/40", total: 5000 },
  { key: 5, user: "路人乙", avatar: "https://picsum.photos/seed/5/40", total: 2000 },
  { key: 6, user: "路人丙", avatar: "https://picsum.photos/seed/6/40", total: 1000 },
  { key: 7, user: "路人丁", avatar: "https://picsum.photos/seed/7/40", total: 500 },
  { key: 8, user: "路人戊", avatar: "https://picsum.photos/seed/8/40", total: 200 },
  { key: 9, user: "路人己", avatar: "https://picsum.photos/seed/9/40", total: 100 },
  { key: 10, user: "路人庚", avatar: "https://picsum.photos/seed/10/40", total: 50 },
  { key: 11, user: "路人辛", avatar: "https://picsum.photos/seed/11/40", total: 30 },
  { key: 12, user: "路人壬", avatar: "https://picsum.photos/seed/12/40", total: 10 }
];

const giftColumns: DataTableColumns<any> = [
  {
    title: "排名",
    key: "key",
    width: 60,
    align: "center",
    render: (row: any) =>
      h("div", { class: row.key <= 3 ? "text-yellow-500 font-bold text-lg italic" : "text-gray-400" }, row.key)
  },
  {
    title: "贡献者",
    key: "user",
    render: (row: any) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(NAvatar, { size: 30, round: true, src: row.avatar }),
        h("span", { class: "font-medium text-sm" }, row.user)
      ])
  },
  {
    title: "贡献值",
    key: "total",
    align: "right",
    render: (row: any) => h("span", { class: "font-mono font-bold text-orange-500 pr-1" }, row.total.toLocaleString())
  }
];

const historyColumns: DataTableColumns<HistoryStream> = [
  {
    title: "直播主题",
    key: "title",
    width: 300,
    render(row) {
      return h("div", { class: "flex items-center gap-3 py-1" }, [
        h("div", { class: "w-24 h-14 shrink-0 rounded overflow-hidden border border-[var(--line-color)] relative" }, [
          h("img", { src: row.cover, class: "w-full h-full object-cover" })
        ]),
        h("div", { class: "flex flex-col gap-1 min-w-0" }, [
          h("span", { class: "font-bold text-sm truncate", title: row.title }, row.title),
          h("span", { class: "text-xs text-gray-400 font-mono" }, row.startTime)
        ])
      ]);
    }
  },
  {
    title: "时长",
    key: "duration",
    width: 120,
    render: (row) => h("span", { class: "font-mono text-gray-500" }, row.duration)
  },
  {
    title: "核心数据 (UV / 营收 / 弹幕)",
    key: "stats",
    render(row) {
      return h("div", { class: "flex gap-6 text-xs" }, [
        h("div", { class: "flex items-center gap-1 min-w-[80px]" }, [
          h("i-mdi-account-group", { class: "text-indigo-400" }),
          h("span", row.stats.uv.toLocaleString())
        ]),
        h("div", { class: "flex items-center gap-1 min-w-[80px]" }, [
          h("i-mdi-currency-usd", { class: "text-yellow-500" }),
          h("span", row.stats.revenue.toLocaleString())
        ]),
        h("div", { class: "flex items-center gap-1 min-w-[80px]" }, [
          h("i-mdi-message-processing", { class: "text-blue-400" }),
          h("span", row.stats.danmaku.toLocaleString())
        ])
      ]);
    }
  },
  {
    title: "操作",
    key: "action",
    width: 150,
    render() {
      return h("div", { class: "flex gap-2" }, [
        h(NButton, { size: "tiny", secondary: true, type: "primary" }, { default: () => "详情" }),
        h(NButton, { size: "tiny", secondary: true }, { default: () => "录像" })
      ]);
    }
  }
];

// SC 数据
const scData = Array.from({ length: 15 }).map((_, i) => ({
  key: i,
  user: `老板_${i}`,
  avatar: `https://picsum.photos/seed/${i + 100}/40`,
  price: [30, 50, 100, 500][i % 4],
  time: `20:4${i % 10}`,
  content: i % 2 === 0 ? "主播讲得太好了，支持一下！" : "求问这个主题在哪里下载？"
}));

const historyData = ref<HistoryStream[]>([
  {
    key: "1",
    title: "聊聊Tauri开发与Vue3的最佳实践",
    startTime: "2026-02-11 19:30",
    duration: "04:15:20",
    stats: { uv: 156032, revenue: 3240.5, danmaku: 28902 },
    cover: "https://picsum.photos/id/48/200/112"
  },
  {
    key: "2",
    title: "周末加班：手写一个即时通讯系统",
    startTime: "2026-02-09 14:00",
    duration: "06:20:11",
    stats: { uv: 98021, revenue: 1520.0, danmaku: 14500 },
    cover: "https://picsum.photos/id/2/200/112"
  },
  {
    key: "3",
    title: "原神启动！探索新地图",
    startTime: "2026-02-05 20:00",
    duration: "02:45:30",
    stats: { uv: 210450, revenue: 5680.0, danmaku: 45200 },
    cover: "https://picsum.photos/id/3/200/112"
  },
  {
    key: "4",
    title: "前端面试题在线答疑",
    startTime: "2026-02-01 19:00",
    duration: "03:10:05",
    stats: { uv: 45020, revenue: 320.5, danmaku: 8900 },
    cover: "https://picsum.photos/id/4/200/112"
  },
  {
    key: "5",
    title: "深夜代码ASMR：写Bug",
    startTime: "2026-01-28 23:00",
    duration: "01:30:00",
    stats: { uv: 12005, revenue: 50.0, danmaku: 1200 },
    cover: "https://picsum.photos/id/5/200/112"
  }
]);

/** 初始化图表 */
const initChart = () => {
  // 模拟数据
  const xData = Array.from({ length: 20 }, (_, i) => `20:${(i * 3).toString().padStart(2, "0")}`);
  const popularity = xData.map(() => Math.floor(Math.random() * 20000 + 30000));

  setOption({
    tooltip: { trigger: "axis", backgroundColor: "rgba(0,0,0,0.7)", textStyle: { color: "#fff" }, borderWidth: 0 },
    grid: { left: "10px", right: "20px", top: "20px", bottom: "20px", containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: xData, axisLine: { lineStyle: { color: "#555" } } },
    yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed", color: "#333" } } },
    series: [
      {
        name: "人气",
        type: "line",
        smooth: true,
        showSymbol: false,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255, 69, 69, 0.3)" },
              { offset: 1, color: "rgba(255, 69, 69, 0)" }
            ]
          }
        },
        lineStyle: { width: 3, color: "#ff4545" },
        data: popularity
      }
    ]
  });
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  window.addEventListener("resize", resize);
  // 延迟渲染图表以确保容器高度就绪
  setTimeout(initChart, 200);
});

onUnmounted(() => {
  window.removeEventListener("resize", resize);
});
</script>

<style scoped lang="scss">
.stats-card,
.chart-card {
  background-color: var(--tray-bg-color);
  border: 1px solid var(--line-color);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--primary-color-rgb), 0.3);
}

:deep(.n-data-table-th) {
  background-color: transparent !important;
  border-bottom: 1px solid var(--line-color);
  font-weight: 600;
  color: var(--text-color);
}
:deep(.n-data-table-td) {
  background-color: transparent !important;
}
:deep(.n-data-table:hover .n-data-table-td) {
  background-color: transparent !important;
}
</style>
