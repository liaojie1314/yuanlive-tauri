<template>
  <report-dialog
    v-model:show="dialogVisible"
    :title="$t('dialog.report.video.title')"
    :report-types="reportTypes"
    @submit="handleReportSubmit" />
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
  videoId?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  videoId: ""
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  "submit-report": [videoId: number | string, type: string, description: string];
}>();

// 视频的举报类型
const reportTypes = [
  { label: "色情低俗", value: "pornographic" },
  { label: "违法犯罪", value: "illegal" },
  { label: "造谣传谣", value: "rumor" },
  { label: "垃圾广告", value: "spam" },
  { label: "侵权盗版", value: "infringement" },
  { label: "内容引人不适", value: "discomfort" }
];

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/**
 * 处理视频举报提交
 * @param type 举报类型
 * @param description 举报描述
 */
const handleReportSubmit = (type: string, description: string) => {
  emit("submit-report", props.videoId, type, description);
};
</script>
