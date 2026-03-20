<template>
  <report-dialog
    v-model:show="dialogVisible"
    :title="$t('dialog.report.user.title')"
    :report-types="reportTypes"
    @submit="handleReportSubmit" />
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  userId?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  userId: ""
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  "submit-report": [userId: number | string, type: string, description: string];
}>();

// 用户的举报类型
const reportTypes = [
  { label: "色情低俗", value: "pornographic" },
  { label: "违法违规", value: "illegal" },
  { label: "欺诈骗钱", value: "fraud" },
  { label: "垃圾广告", value: "spam" },
  { label: "恶意骚扰/谩骂", value: "harassment" },
  { label: "头像/昵称违规", value: "profile_violation" }
];

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/**
 * 处理用户举报提交
 * @param type 举报类型
 * @param description 举报描述
 */
const handleReportSubmit = (type: string, description: string) => {
  const reportType = reportTypes.find((item) => item.value === type);
  if (!reportType) {
    return;
  }
  emit("submit-report", props.userId, reportType.label, description);
};
</script>
