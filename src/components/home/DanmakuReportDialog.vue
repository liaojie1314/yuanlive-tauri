<template>
  <base-dialog
    v-model:show="dialogVisible"
    title="举报弹幕"
    :close-on-overlay-click="true"
    height="400px"
    width="420px">
    <template #default>
      <div class="danmaku-report-container max-w-[400px] mx-auto">
        <!-- 举报类型选择 -->
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

        <!-- 详细描述 -->
        <div class="report-description">
          <textarea
            v-model="reportDescription"
            placeholder="请详细描述举报原因，便于平台判断违规情况"
            maxlength="120"
            class="description-input"
            rows="4"></textarea>
          <div class="description-counter">{{ reportDescription.length }}/140</div>
        </div>

        <!-- 提交按钮 -->
        <div class="submit-container">
          <button class="submit-btn" :disabled="!selectedReportType" @click="handleSubmit">提交</button>
        </div>
      </div>
    </template>
  </base-dialog>
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

// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

// 举报类型选项
const reportTypes = [
  { label: "色情低俗", value: "pornographic" },
  { label: "违法犯罪", value: "illegal" },
  { label: "造谣传谣", value: "rumor" },
  { label: "垃圾广告", value: "spam" },
  { label: "骚扰", value: "harassment" },
  { label: "人身攻击", value: "personal_attack" },
  { label: "时政不实信息", value: "political_misinformation" }
];

// 选中的举报类型
const selectedReportType = ref("");
// 举报描述
const reportDescription = ref("");

// 提交举报
const handleSubmit = () => {
  if (selectedReportType.value) {
    emit("submit-report", props.danmakuIndex, selectedReportType.value, reportDescription.value);
    // 重置表单
    selectedReportType.value = "";
    reportDescription.value = "";
    // 关闭对话框
    dialogVisible.value = false;
  }
};
</script>

<style scoped lang="scss">
.danmaku-report-container {
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
}

.radio-button {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

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
  color: #374151;
}

.report-description {
  position: relative;
  margin-bottom: 20px;
}

.description-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: #9ca3af;
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
  color: #9ca3af;
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
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #ff1a60;
  }

  &:disabled {
    background-color: #fecdd3;
    cursor: not-allowed;
  }
}
</style>
