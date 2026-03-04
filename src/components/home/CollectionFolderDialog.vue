<template>
  <base-dialog v-model:show="dialogVisible" :title="$t('dialog.collectionFolder.title')" width="400px">
    <div class="new-folder-dialog">
      <div class="dialog-content">
        <div class="input-group">
          <n-input
            v-model:value="folderName"
            type="text"
            :placeholder="$t('dialog.collectionFolder.placeholder', { count: maxNameLength })"
            :maxlength="maxNameLength"
            show-count
            clearable
            class="border-(1px solid #90909080)"
            @input="handleInput" />
          <div v-if="folderName.length === 0" class="error-message">
            {{ $t("dialog.collectionFolder.inputMessage") }}
          </div>
        </div>

        <div class="switch-group">
          <div class="switch-label">
            <span class="main-label">{{ $t("dialog.collectionFolder.publicLabel") }}</span>
            <span class="sub-label">{{ $t("dialog.collectionFolder.publicInfo") }}</span>
          </div>
          <div class="switch-btn">
            <n-switch v-model:value="isPublicFolder" />
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <n-button strong secondary @click="handleCancel">
          {{ $t("components.common.cancel") }}
        </n-button>
        <n-button type="primary" @click="handleConfirm" :disabled="!isFormValid" class="confirm-btn-style">
          {{ $t("components.common.confirm") }}
        </n-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
interface Props {
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "create-folder": [name: string, isPublic: boolean];
}>();

const maxNameLength = 15;
// 输入防抖定时器
let inputTimer: number | null = null;

// 收藏夹名称
const folderName = ref("");
// 是否公开
const isPublicFolder = ref(false);
// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

// 表单是否有效
const isFormValid = computed(() => {
  return folderName.value.trim().length > 0 && folderName.value.trim().length <= 15;
});

/** 输入处理（带防抖） */
const handleInput = () => {
  if (inputTimer) {
    clearTimeout(inputTimer);
  }
  inputTimer = window.setTimeout(() => {
    // 可以在这里添加额外的输入验证逻辑
  }, 300);
};

/** 取消按钮处理 */
const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

/** 确认按钮处理 */
const handleConfirm = () => {
  if (isFormValid.value) {
    emit("create-folder", folderName.value.trim(), isPublicFolder.value);
    dialogVisible.value = false;
    resetForm();
  }
};

/** 重置表单 */
const resetForm = () => {
  folderName.value = "";
  isPublicFolder.value = false;
};

// 清理函数
onUnmounted(() => {
  if (inputTimer) {
    clearTimeout(inputTimer);
    inputTimer = null;
  }
});
</script>

<style scoped lang="scss">
.dialog-content {
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.switch-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  // 适配背景色：浅色模式下略深，深色模式下使用对应的 setting-item 色
  background-color: var(--bg-setting-item);
  border-radius: 12px;
  border: 1px solid var(--line-color);
}

.switch-label {
  display: flex;
  flex-direction: column;
}

.main-label {
  font-size: 14px;
  font-weight: 600;
  // 使用主题文字颜色
  color: var(--text-color);
  margin-bottom: 4px;
}

.sub-label {
  font-size: 12px;
  // 使用辅助文字颜色
  color: var(--user-text-color);
}

.error-message {
  margin-top: 8px;
  font-size: 12px;
  // 使用警告色或红色
  color: #ff4757;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

// 针对确认按钮的特殊品牌色覆盖
.confirm-btn-style {
  background-color: #ff0050 !important;
  border-color: #ff0050 !important;
  color: #fff !important;

  &:hover {
    background-color: #ff3366 !important;
  }

  &:disabled {
    background-color: #ff94a6 !important;
    opacity: 0.6;
  }
}
</style>
