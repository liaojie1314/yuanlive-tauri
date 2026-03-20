<template>
  <base-dialog v-model:show="dialogVisible" :title="title" :height="showImageUpload ? '520px' : '400px'" width="420px">
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
            :placeholder="placeholder || t('dialog.report.placeholder')"
            maxlength="140"
            class="description-input"
            rows="4"></textarea>
          <div class="description-counter">{{ reportDescription.length }}/140</div>
        </div>

        <div v-if="showImageUpload" class="image-upload-section mb-5">
          <div class="text-sm text-[--text-color] mb-2 font-medium">
            {{ t("dialog.report.provideEvidence") }}
            <span class="text-[--user-text-color] font-normal text-xs">
              ({{ t("dialog.report.optional") }}, {{ selectedImages.length }}/{{ maxImages }})
            </span>
          </div>
          <div class="flex flex-wrap gap-3">
            <!-- 图片预览列表 -->
            <div
              v-for="(img, index) in selectedImages"
              :key="index"
              class="relative w-16 h-16 rounded-md overflow-hidden border border-[--line-color] group">
              <img :src="convertFileSrc(img)" class="w-full h-full object-cover" />
              <!-- 删除按钮 -->
              <div
                class="absolute top-0 right-0 bg-black/60 text-white w-5 h-5 flex items-center justify-center rounded-bl-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ff0050]"
                @click="removeImage(index)">
                <i-mdi-close class="w-3 h-3" />
              </div>
            </div>

            <!-- 上传触发按钮 -->
            <div
              v-if="selectedImages.length < maxImages"
              class="w-16 h-16 rounded-md border border-dashed border-[--line-color] flex flex-col items-center justify-center cursor-pointer bg-[--bg-setting-item] hover:border-[#ff0050] hover:text-[#ff0050] text-[--user-text-color] transition-colors"
              @click="handleSelectImage">
              <i-mdi-plus class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="submit-container">
          <button class="submit-btn" :disabled="!selectedReportType" @click="handleSubmit">
            {{ submitText || t("dialog.report.submit") }}
          </button>
        </div>
      </div>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";

const { t } = useI18n();

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
  showImageUpload?: boolean; // 是否显示图片上传
  maxImages?: number; // 最大上传数量
}

// 使用 withDefaults 为新增的可选属性赋予默认值
const props = withDefaults(defineProps<Props>(), {
  showImageUpload: false,
  maxImages: 4
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  submit: [type: string, description: string, images: string[]];
}>();

const selectedReportType = ref("");
const reportDescription = ref("");
// 存储选中的图片本地物理路径
const selectedImages = ref<string[]>([]);

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/** 调用 Tauri 2 API 选择图片 */
const handleSelectImage = async () => {
  try {
    const selected = await open({
      multiple: true, // 允许多选
      directory: false,
      filters: [{ name: "Images", extensions: ["png", "jpeg", "jpg", "webp"] }]
    });

    if (selected) {
      // 兼容单选和多选的返回结果
      const paths = Array.isArray(selected) ? selected : [selected];
      const total = selectedImages.value.length + paths.length;

      if (total > props.maxImages) {
        window.$message?.warning(t("dialog.report.msg.maxImages", { count: props.maxImages }));
        // 截取剩余允许的数量
        const allowed = paths.slice(0, props.maxImages - selectedImages.value.length);
        selectedImages.value.push(...allowed);
      } else {
        selectedImages.value.push(...paths);
      }
    }
  } catch (error) {
    console.error("文件选择失败:", error);
  }
};

/**
 * 移除图片
 * @param index 图片在列表中的索引
 */
const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1);
};

/** 提交举报 */
const handleSubmit = () => {
  if (selectedReportType.value) {
    emit("submit", selectedReportType.value, reportDescription.value, selectedImages.value);

    // 重置表单
    selectedReportType.value = "";
    reportDescription.value = "";
    selectedImages.value = [];
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
