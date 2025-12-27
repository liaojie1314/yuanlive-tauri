<template>
  <BaseDialog v-model:show="dialogVisible" title="编辑资料">
    <div class="space-y-6">
      <!-- 头像上传区域 -->
      <div class="flex flex-col items-center gap-2">
        <div class="relative cursor-pointer group">
          <img
            :src="avatar || 'https://picsum.photos/id/1005/200/200'"
            alt="头像"
            class="w-24 h-24 rounded-full border-2 border-gray-200 object-cover" />
          <div
            class="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            @click="triggerFileInput">
            <n-icon size="28" color="white">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 13c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2zm8-7h-3v2h3v3h2v-3h3v-2h-3v-3h-2v3zm-1-9H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
              </svg>
            </n-icon>
          </div>
        </div>
        <span class="text-sm text-gray-500" @click="triggerFileInput">点击修改头像</span>
        <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleAvatarChange" />
      </div>

      <!-- 名字输入 -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">名字</label>
        <n-input v-model:value="name" placeholder="请输入名字" maxlength="20" class="w-full" />
        <div class="text-right text-xs text-gray-500">{{ name.length }}/20</div>
      </div>

      <!-- 简介输入 -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">简介</label>
        <n-input
          v-model:value="description"
          placeholder="介绍一下你自己"
          type="textarea"
          :rows="4"
          maxlength="100"
          class="w-full" />
        <div class="text-right text-xs text-gray-500">{{ description.length }}/100</div>
      </div>

      <!-- 底部按钮 -->
      <div class="flex justify-center gap-4 pt-2">
        <n-button type="default" @click="closeDialog" class="w-24">取消</n-button>
        <n-button type="primary" @click="saveProfile" class="w-24" color="#ff6b6b">保存</n-button>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NInput, NButton, NIcon } from "naive-ui";
import BaseDialog from "../common/BaseDialog.vue";

interface Props {
  show: boolean;
  name: string;
  description?: string;
  avatar?: string;
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  avatar: ""
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  save: [data: { name: string; description: string; avatar?: string }];
}>();

// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

// 编辑表单数据
const name = ref(props.name);
const description = ref(props.description);
const avatar = ref(props.avatar);
const fileInput = ref<HTMLInputElement | null>(null);

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
};

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 处理头像上传
const handleAvatarChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      avatar.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// 保存资料
const saveProfile = () => {
  // 简单验证
  if (!name.value.trim()) {
    return;
  }

  emit("save", {
    name: name.value,
    description: description.value,
    avatar: avatar.value
  });
  closeDialog();
};
</script>
