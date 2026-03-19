<template>
  <report-dialog
    v-model:show="dialogVisible"
    :title="$t('dialog.report.live.title')"
    :report-types="reportTypes"
    @submit="handleReportSubmit" />
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  roomId?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  roomId: ""
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  "submit-report": [roomId: number | string, type: string, description: string];
}>();

// 直播间的举报类型
const reportTypes = [
  { label: "色情低俗", value: "pornographic" },
  { label: "违法犯罪", value: "illegal" },
  { label: "诱导打赏", value: "inducing_tips" },
  { label: "垃圾广告", value: "spam" },
  { label: "未成年人直播", value: "minor_streaming" },
  { label: "内容引人不适", value: "discomfort" }
];

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/**
 * 处理直播间举报提交
 * @param type 举报类型
 * @param description 举报描述
 */
const handleReportSubmit = (type: string, description: string) => {
  // 获取label
  const reportType = reportTypes.find((item) => item.value === type);
  if (!reportType) {
    return;
  }
  emit("submit-report", props.roomId, reportType.label, description);
};
</script>
