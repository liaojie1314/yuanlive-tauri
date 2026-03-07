<template>
  <base-dialog v-model:show="dialogVisible" :title="title" height="400px" width="420px">
    <template #default>
      <div class="report-container max-w-[400px] mx-auto">
        <div class="report-types">
          <div
            v-for="type in reportTypes"
            :key="type.value"
            class="report-type-item"
            @click="selectedReportType = type.value">
            <div class="radio-button">
              <div class="radio-inner" v-if="selectedReportType === type.value"></div>
            </div>
            <div class="report-type-label">{{ type.label }}</div>
          </div>
        </div>

        <div class="report-description">
          <textarea
            v-model="reportDescription"
            :placeholder="placeholder || $t('dialog.report.placeholder')"
            maxlength="140"
            class="description-input"
            rows="4"></textarea>
          <div class="description-counter">{{ reportDescription.length }}/140</div>
        </div>

        <div class="submit-container">
          <button class="submit-btn" :disabled="!selectedReportType" @click="handleSubmit">
            {{ submitText || $t("dialog.report.submit") }}
          </button>
        </div>
      </div>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
interface ReportType {
  label: string;
  value: string;
}

interface Props {
  show: boolean;
  title: string;
  reportTypes: ReportType[];
  placeholder?: string;
  submitText?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:show": [value: boolean];
  submit: [type: string, description: string];
}>();

// 选中的举报类型
const selectedReportType = ref("");
// 举报描述
const reportDescription = ref("");

// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/** 提交举报 */
const handleSubmit = () => {
  if (selectedReportType.value) {
    emit("submit", selectedReportType.value, reportDescription.value);
    // 重置表单
    selectedReportType.value = "";
    reportDescription.value = "";
    // 关闭对话框
    dialogVisible.value = false;
  }
};
</script>

<style scoped lang="scss">
.report-container {
  padding: 16px 0;
}

.report-types {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}

.report-type-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 3px 0;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-left-menu-hover);
  }
}

.radio-button {
  width: 18px;
  height: 18px;
  border: 2px solid var(--line-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background-color: transparent;

  .radio-inner {
    width: 10px;
    height: 10px;
    background-color: #ff0050;
    border-radius: 50%;
  }
}

.report-type-item:hover .radio-button {
  border-color: #ff0050;
}

.report-type-label {
  font-size: 13px;
  color: var(--text-color);
}

.report-description {
  position: relative;
  margin-bottom: 20px;
}

.description-input {
  width: 100%;
  padding: 10px;
  background-color: var(--bg-setting-item);
  border: 1px solid var(--line-color);
  color: var(--text-color);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: var(--user-text-color);
  }

  &:focus {
    border-color: #ff0050;
    box-shadow: 0 0 0 3px rgba(255, 0, 80, 0.1);
  }
}

.description-counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 12px;
  color: var(--user-text-color);
}

.submit-container {
  display: flex;
  justify-content: center;
}

.submit-btn {
  width: 100%;
  max-width: 300px;
  height: 44px;
  background-color: #ff0050;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    opacity 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #ff1a60;
  }

  &:disabled {
    background-color: var(--disabled-color);
    color: rgba(255, 255, 255, 0.6);
    cursor: not-allowed;
  }
}
</style>
