<template>
  <report-dialog
    v-model:show="dialogVisible"
    :title="$t('dialog.report.danmaku.title')"
    :report-types="reportTypes"
    @submit="handleReportSubmit" />
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  danmakuIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  danmakuIndex: -1
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  "submit-report": [index: number, type: string, description: string];
}>();

// 弹幕专属举报类型
const reportTypes = [
  { label: "色情低俗", value: "pornographic" },
  { label: "违法犯罪", value: "illegal" },
  { label: "造谣传谣", value: "rumor" },
  { label: "垃圾广告", value: "spam" },
  { label: "骚扰", value: "harassment" },
  { label: "人身攻击", value: "personal_attack" },
  { label: "时政不实信息", value: "political_misinformation" }
];

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/**
 * 处理弹幕举报提交
 * @param type 举报类型
 * @param description 举报描述
 */
const handleReportSubmit = (type: string, description: string) => {
  const reportType = reportTypes.find((item) => item.value === type);
  if (!reportType) {
    return;
  }
  emit("submit-report", props.danmakuIndex, reportType.label, description);
};
</script>
