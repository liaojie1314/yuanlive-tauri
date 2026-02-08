<template>
  <base-dialog v-model:show="dialogVisible" title="编辑资料">
    <div class="space-y-6 px-4 py-2">
      <div class="flex flex-col items-center gap-3">
        <div class="relative cursor-pointer group size-24">
          <n-avatar
            round
            :size="96"
            :src="userInfo?.avatar || 'https://picsum.photos/id/1005/200/200'"
            class="border-2 border-gray-200 object-cover block"
            @click="openAvatarCropper" />
          <div
            class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            @click="openAvatarCropper">
            <svg class="size-8 text-white" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m8 3a5 5 0 0 0-5 5a5 5 0 0 0 5 5a5 5 0 0 0 5-5a5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3Z" />
            </svg>
          </div>
        </div>
        <span class="text-xs text-gray-500 hover:text-[--primary-color] cursor-pointer" @click="openAvatarCropper">
          点击修改头像
        </span>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-[--text-color]">名字</label>
        <n-input v-model:value="form.username" placeholder="请输入用户名" maxlength="20" show-count clearable />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-[--text-color]">简介</label>
        <n-input
          v-model:value="form.description"
          placeholder="介绍一下你自己"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 5 }"
          maxlength="100"
          show-count />
      </div>

      <div class="flex justify-end gap-3 pt-4">
        <n-button @click="closeDialog">取消</n-button>
        <n-button type="primary" @click="saveProfile" :disabled="!form.username">保存</n-button>
      </div>
    </div>
  </base-dialog>

  <input
    ref="fileInput"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    class="hidden"
    @change="handleFileChange" />

  <avatar-cropper ref="cropperRef" v-model:show="showCropper" :image-url="localImageUrl" @crop="handleCrop" />
</template>

<script setup lang="ts">
import { UploadSceneEnum } from "@/enums";
import { useUserStore } from "@/stores/user";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import type { AvatarCropperInstance } from "@/components/common/AvatarCropper.vue";

const { userInfo } = useUserStore();

const props = defineProps({
  show: Boolean
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  save: [data: { name: string; description: string; avatar?: string }];
}>();

// 本地表单数据
const form = reactive({
  username: userInfo?.username,
  description: "",
  avatar: userInfo?.avatar
});
const fileInputRef = ref<HTMLInputElement>();
const cropperRef = ref<AvatarCropperInstance>();

const {
  localImageUrl,
  showCropper,
  openAvatarCropper,
  handleFileChange,
  handleCrop: onHookCrop
} = useAvatarUpload({
  scene: UploadSceneEnum.AVATAR,
  fileInputRef: fileInputRef,
  cropperRef: cropperRef,
  onSuccess: (downloadUrl) => {
    // 上传成功后，更新本地预览头像
    form.avatar = downloadUrl;
    // TODO: 更新用户信息store
  }
});

// 计算属性控制 Dialog 显示
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

const closeDialog = () => {
  dialogVisible.value = false;
};

// 代理 Hook 的裁剪事件
const handleCrop = async (cropBlob: Blob) => {
  await onHookCrop(cropBlob);
};

// 保存资料
const saveProfile = () => {
  if (!form.username?.trim()) return;

  emit("save", {
    name: form.username,
    description: form.description,
    avatar: form.avatar
  });
  closeDialog();
};
</script>
