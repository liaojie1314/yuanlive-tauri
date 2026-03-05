<template>
  <n-config-provider :theme="naiveTheme" abstract>
    <div class="h-full flex flex-col bg-[var(--right-bg-color)] text-[var(--text-color)] overflow-hidden">
      <action-bar />

      <n-scrollbar class="flex-1 p-4 pt-6 box-border">
        <div class="flex flex-col gap-4 py-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <n-card class="stats-card relative overflow-visible" :bordered="false" content-style="padding: 16px;">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">总播放量</div>
                  <div class="text-2xl font-bold font-mono tracking-tight">120,392</div>
                </div>
                <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <i-mdi-play-circle class="text-2xl text-blue-500" />
                </div>
              </div>
            </n-card>

            <n-card class="stats-card relative overflow-visible" :bordered="false" content-style="padding: 16px;">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">粉丝净增</div>
                  <div class="text-2xl font-bold font-mono tracking-tight text-green-500">+2,304</div>
                </div>
                <div class="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <i-mdi-account-group class="text-2xl text-green-500" />
                </div>
              </div>
            </n-card>

            <n-card class="stats-card relative overflow-visible" :bordered="false" content-style="padding: 16px;">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">本月收益 (元)</div>
                  <div class="text-2xl font-bold font-mono tracking-tight text-red-500">5,680.5</div>
                </div>
                <div class="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <i-mdi-currency-usd class="text-2xl text-red-500" />
                </div>
              </div>
            </n-card>

            <n-card class="stats-card relative overflow-visible" :bordered="false" content-style="padding: 16px;">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">综合评分</div>
                  <div class="text-2xl font-bold font-mono tracking-tight text-yellow-500">92.5</div>
                </div>
                <div class="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                  <i-mdi-star class="text-2xl text-yellow-500" />
                </div>
              </div>
            </n-card>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <n-card
              title="互动数据分析"
              :bordered="false"
              class="chart-card lg:col-span-1"
              content-style="padding: 10px;"
              header-style="padding: 16px 20px 0;">
              <div ref="pieChartRef" class="w-full h-[320px]"></div>
            </n-card>

            <n-card
              title="近30天收益趋势"
              :bordered="false"
              class="chart-card lg:col-span-2"
              content-style="padding: 10px;"
              header-style="padding: 16px 20px 0;">
              <div ref="lineChartRef" class="w-full h-[320px]"></div>
            </n-card>
          </div>

          <n-card
            title="视频内容管理"
            :bordered="false"
            class="table-card flex-1"
            content-style="padding: 0;"
            header-style="padding: 16px 20px;">
            <template #header-extra>
              <div class="flex gap-3">
                <n-input
                  placeholder="搜索视频标题"
                  size="small"
                  v-model:value="searchText"
                  class="w-48 !bg-[var(--bg-setting-item)]"
                  clearable>
                  <template #prefix>
                    <i-mdi-magnify class="text-gray-400" />
                  </template>
                </n-input>
                <n-button type="primary" size="small" secondary @click="handleRefresh">
                  <template #icon><i-mdi-refresh /></template>
                  刷新
                </n-button>
              </div>
            </template>

            <n-data-table
              class="mb-2"
              :columns="columns"
              :data="filteredVideos"
              :pagination="{ pageSize: 5 }"
              :bordered="false"
              :row-class-name="() => 'video-row'"
              size="large" />
          </n-card>
        </div>
      </n-scrollbar>

      <edit-video-modal v-model:show="showEditModal" :video-data="currentVideo" @save="handleSaveEdit" />
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme } from "naive-ui";
import { DataTableColumns, NTag, NSpace, NButton } from "naive-ui";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { ThemeEnum } from "@/enums";
import { useEcharts } from "@/hooks/useEcharts";
import { useSettingStore } from "@/stores/setting";
import EditVideoModal from "./components/EditVideoModal.vue";

const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);
const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));

interface VideoItem {
  key: string;
  title: string;
  coverUrl: string;
  createTime: string;
  status: "published" | "auditing" | "offline";
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  fileName?: string;
  description?: string;
}

// 表格列定义
const columns: DataTableColumns<VideoItem> = [
  {
    title: "视频信息",
    key: "title",
    minWidth: 200,
    render(row) {
      return h("div", { class: "flex gap-3 items-center group cursor-pointer" }, [
        h(
          "div",
          {
            class: "relative w-28 h-16 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700"
          },
          [
            h("img", {
              src: row.coverUrl,
              class: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            })
          ]
        ),
        h("div", { class: "flex flex-col gap-1 min-w-0" }, [
          h(
            "span",
            {
              class: "font-medium text-[var(--text-color)] truncate group-hover:text-blue-500 transition-colors",
              title: row.title
            },
            row.title
          ),
          h("span", { class: "text-xs text-gray-400 font-mono" }, row.createTime)
        ])
      ]);
    }
  },
  {
    title: "数据表现",
    key: "stats",
    minWidth: 120,
    render(row) {
      return h("div", { class: "flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400" }, [
        h("div", { class: "flex items-center gap-1" }, [
          h("i-mdi-play-circle-outline", { class: "text-sm" }),
          h("span", row.stats.views.toLocaleString())
        ]),
        h("div", { class: "flex items-center gap-3" }, [
          h("span", { class: "flex items-center gap-1" }, [
            h("i-mdi-thumb-up-outline", { class: "text-sm" }),
            h("span", row.stats.likes)
          ]),
          h("span", { class: "flex items-center gap-1" }, [
            h("i-mdi-comment-outline", { class: "text-sm" }),
            h("span", row.stats.comments)
          ])
        ])
      ]);
    }
  },
  {
    title: "状态",
    key: "status",
    minWidth: 80,
    render(row) {
      const statusMap = {
        published: { type: "success", text: "已发布", icon: "i-mdi-check-circle" },
        auditing: { type: "warning", text: "审核中", icon: "i-mdi-clock-outline" },
        offline: { type: "error", text: "已下架", icon: "i-mdi-alert-circle" }
      } as const;
      const config = statusMap[row.status];
      return h(
        NTag,
        { type: config.type, size: "small", bordered: false, round: true },
        {
          default: () =>
            h("div", { class: "flex items-center gap-1" }, [
              // h(config.icon), // 如果想加图标可以在这里加
              h("span", config.text)
            ])
        }
      );
    }
  },
  {
    title: "操作",
    key: "actions",
    minWidth: 100,
    render(row) {
      return h(
        NSpace,
        { align: "center" },
        {
          default: () => [
            h(
              NButton,
              {
                size: "tiny",
                quaternary: true,
                type: "primary",
                onClick: () => handleEdit(row)
              },
              { default: () => "编辑" }
            ),
            h(
              NButton,
              {
                size: "tiny",
                quaternary: true,
                type: "error",
                onClick: () => handleDelete(row)
              },
              { default: () => "删除" }
            )
          ]
        }
      );
    }
  }
];

// 1. 饼图 (互动数据)
const pieChartRef = ref<HTMLElement | null>(null);
const { setOption: setPieOption, resize: resizePie } = useEcharts(pieChartRef);
// 2. 折线图 (收益趋势)
const lineChartRef = ref<HTMLElement | null>(null);
const { setOption: setLineOption, resize: resizeLine } = useEcharts(lineChartRef);
const currentVideo = ref<VideoItem | null>(null);

const searchText = ref("");
const showEditModal = ref(false);

// 模拟数据
const videoList = ref<VideoItem[]>([
  {
    key: "1",
    title: "原神：纳塔最新探索攻略，宝箱全收集",
    coverUrl: "https://picsum.photos/id/10/200/112",
    createTime: "2024-05-20 12:00",
    status: "published",
    stats: { views: 12000, likes: 3400, comments: 120 }
  },
  {
    key: "2",
    title: "VUE3 + Tauri 开发实战教程 EP01",
    coverUrl: "https://picsum.photos/id/20/200/112",
    createTime: "2024-05-21 14:30",
    status: "auditing",
    stats: { views: 0, likes: 0, comments: 0 }
  },
  {
    key: "3",
    title: "记录我的猫咪日常",
    coverUrl: "https://picsum.photos/id/30/200/112",
    createTime: "2024-05-18 09:00",
    status: "offline",
    stats: { views: 500, likes: 20, comments: 5 }
  },
  {
    key: "4",
    title: "黑神话：悟空 实机演示解析",
    coverUrl: "https://picsum.photos/id/40/200/112",
    createTime: "2024-05-22 10:00",
    status: "published",
    stats: { views: 45000, likes: 8900, comments: 560 }
  },
  {
    key: "5",
    title: "前端性能优化指南 2024版",
    coverUrl: "https://picsum.photos/id/50/200/112",
    createTime: "2024-05-23 16:20",
    status: "published",
    stats: { views: 3200, likes: 450, comments: 32 }
  }
]);

// 过滤列表
const filteredVideos = computed(() => {
  if (!searchText.value) return videoList.value;
  return videoList.value.filter((v) => v.title.includes(searchText.value));
});

/** 初始化echarts图表 */
const initCharts = () => {
  // 饼图配置
  setPieOption({
    tooltip: { trigger: "item" },
    legend: { bottom: "5%", left: "center", itemWidth: 10, itemHeight: 10 },
    series: [
      {
        name: "互动分布",
        type: "pie",
        radius: ["40%", "65%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "var(--tray-bg-color)",
          borderWidth: 2
        },
        label: { show: false, position: "center" },
        emphasis: {
          label: { show: true, fontSize: 18, fontWeight: "bold", color: "var(--text-color)" }
        },
        labelLine: { show: false },
        data: [
          { value: 1048, name: "点赞" },
          { value: 735, name: "评论" },
          { value: 580, name: "转发" },
          { value: 484, name: "收藏" },
          { value: 300, name: "弹幕" }
        ]
      }
    ]
  });

  // 折线图配置
  setLineOption({
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(50, 50, 50, 0.7)",
      borderColor: "#333",
      textStyle: { color: "#fff" }
    },
    grid: { left: "20", right: "20", bottom: "20", top: "40", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      axisLine: { lineStyle: { color: "#888" } },
      axisLabel: { color: "#888" }
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { type: "dashed", color: "#eee" } }
    },
    series: [
      {
        name: "视频收益",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: "#ff0050" },
        areaStyle: {
          opacity: 0.2,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgb(255, 0, 80)" },
              { offset: 1, color: "rgba(255, 255, 255, 0)" }
            ]
          }
        },
        data: [120, 132, 101, 134, 90, 230, 210]
      },
      {
        name: "直播收益",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: "#8884d8" },
        areaStyle: {
          opacity: 0.2,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#8884d8" },
              { offset: 1, color: "rgba(255, 255, 255, 0)" }
            ]
          }
        },
        data: [220, 182, 191, 234, 290, 330, 310]
      }
    ]
  });
};

/** 处理图表.resize事件 */
const handleResize = () => {
  resizePie();
  resizeLine();
};

/** 处理刷新按钮点击事件 */
const handleRefresh = () => {
  window.$message.loading("正在刷新数据...");
  setTimeout(() => {
    window.$message.success("刷新成功");
  }, 1000);
};

/**
 * 处理编辑按钮点击事件
 * @param row 要编辑的视频项
 */
const handleEdit = (row: VideoItem) => {
  currentVideo.value = row;
  showEditModal.value = true;
};

/**
 * 处理保存编辑按钮点击事件
 * @param updatedData 更新后的视频项数据
 */
const handleSaveEdit = (updatedData: VideoItem) => {
  const index = videoList.value.findIndex((v) => v.key === updatedData.key);
  if (index !== -1) {
    videoList.value[index] = updatedData;
    window.$message.success("修改已保存");
  }
};

/**
 * 处理删除按钮点击事件
 * @param row 要删除的视频项
 */
const handleDelete = (row: VideoItem) => {
  window.$dialog.warning({
    title: "确认删除",
    content: `确定要删除视频 "${row.title}" 吗？此操作无法恢复。`,
    positiveText: "确定删除",
    negativeText: "再想想",
    onPositiveClick: () => {
      videoList.value = videoList.value.filter((item) => item.key !== row.key);
      window.$message.success("删除成功");
    }
  });
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  setTimeout(() => {
    initCharts();
  }, 100);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped lang="scss">
/* 统一样式 */
.stats-card,
.chart-card,
.table-card,
.modal-card {
  background-color: var(--tray-bg-color);
  border: 1px solid var(--line-color);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border-color: rgba(var(--primary-color-rgb), 0.3);
  z-index: 10;
}

:deep(.n-data-table .n-data-table-th) {
  background-color: transparent;
  border-bottom: 1px solid var(--line-color);
  font-weight: 600;
}

:deep(.n-data-table .n-data-table-td) {
  background-color: transparent;
  border-bottom: 1px solid var(--line-color);
}

:deep(.n-data-table:hover .n-data-table-td) {
  background-color: transparent !important;
}

/* 隐藏表格底部的边框 */
:deep(.n-data-table-wrapper) {
  border: none;
}

/* 确保表格容器能正确处理滚动 */
:deep(.n-data-table) {
  width: 100%;
}
</style>
