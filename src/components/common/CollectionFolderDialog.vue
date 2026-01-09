<template>
  <BaseDialog v-model:show="dialogVisible" title="新建收藏夹" width="400px">
    <div class="new-folder-dialog">
      <div class="dialog-content">
        <div class="input-group">
          <input
            type="text"
            v-model="folderName"
            placeholder="请输入收藏夹的名称（15个字以内）"
            class="folder-name-input"
            maxlength="15" />
        </div>
        <div class="switch-group">
          <div class="switch-label">
            <span class="main-label">设置为公开</span>
            <span class="sub-label">公开后有机会被推荐，帮助到更多人</span>
          </div>
          <div class="switch-btn">
            <n-switch v-model:value="isPublicFolder" class="public-switch" />
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button class="confirm-btn" @click="handleConfirm">确认</button>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NSwitch } from "naive-ui";
import BaseDialog from "./BaseDialog.vue";

interface Props {
  show: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "create-folder": [name: string, isPublic: boolean];
}>();

// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

// 收藏夹名称
const folderName = ref("");
// 是否公开
const isPublicFolder = ref(false);

// 取消按钮处理
const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

// 确认按钮处理
const handleConfirm = () => {
  if (folderName.value.trim()) {
    emit("create-folder", folderName.value.trim(), isPublicFolder.value);
    dialogVisible.value = false;
    resetForm();
  }
};

// 重置表单
const resetForm = () => {
  folderName.value = "";
  isPublicFolder.value = false;
};
</script>

<style scoped lang="scss">
.dialog-content {
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.folder-name-input {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  background-color: #f8fafc;
}

.folder-name-input:focus {
  border-color: #ff0050;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(255, 0, 80, 0.1);
}

.switch-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.switch-label {
  display: flex;
  flex-direction: column;
}

.main-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.sub-label {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.public-switch {
  --n-switch-on-color: #ff0050;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn {
  background-color: #f1f5f9;
  color: #64748b;
}

.cancel-btn:hover {
  background-color: #e2e8f0;
}

.confirm-btn {
  background-color: #ff0050;
  color: #fff;
}

.confirm-btn:hover {
  background-color: #ff3366;
}
</style>
