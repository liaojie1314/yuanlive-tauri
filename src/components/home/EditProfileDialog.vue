<template>
  <base-dialog v-model:show="dialogVisible" title="编辑资料">
    <div class="space-y-6">
      <!-- 头像上传区域 -->
      <div class="flex flex-col items-center gap-2">
        <div class="relative cursor-pointer group">
          <img
            :src="avatar || 'https://picsum.photos/id/1005/200/200'"
            alt="头像"
            class="w-24 h-24 rounded-full border-2 border-gray-200 object-cover"
            @click="openAvatarCropper" />
          <div
            class="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            @click="triggerFileInput">
            <n-icon size="28" color="white">
              <i-mdi-camera />
            </n-icon>
          </div>
        </div>
        <span class="text-sm text-gray-500" @click="triggerFileInput">点击修改头像</span>
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
  </base-dialog>
  <input
    ref="fileInput"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    class="hidden"
    @change="handleFileChange" />
  <!-- 头像裁剪组件 -->
  <avatar-cropper ref="cropperRef" v-model:show="showCropper" :image-url="localImageUrl" @crop="handleCrop" />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

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

const { t } = useI18n();

const {
  fileInput,
  localImageUrl,
  showCropper,
  cropperRef,
  openAvatarCropper,
  handleFileChange,
  handleCrop: onCrop
} = useAvatarUpload({
  onSuccess: async (downloadUrl) => {
    // TODO 调用更新头像的API
    avatar.value = downloadUrl;
    // 更新用户信息
    // 更新store缓存里面的用户信息
    window.$message.success(t("home.profileEdit.toast.avatarUpdateSuccess"));
  }
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

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
};

// 触发文件输入
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleCrop = async (cropBlob: Blob) => {
  await onCrop(cropBlob);
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
