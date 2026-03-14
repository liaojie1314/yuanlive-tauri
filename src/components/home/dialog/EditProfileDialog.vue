<template>
  <base-dialog v-model:show="dialogVisible" :title="$t('dialog.editProfile.title')">
    <div class="space-y-6">
      <div class="flex flex-col items-center gap-3">
        <div class="relative cursor-pointer group size-24">
          <n-avatar round :size="96" :src="userInfo?.avatar" class="border-2 border-[--line-color] shadow-sm" />
          <div
            class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]"
            @click="openAvatarCropper">
            <i-mdi-camera class="size-7 text-white" />
          </div>
        </div>
        <span class="text-xs text-[--user-text-color] hover:text-blue-500 transition-colors">
          {{ $t("dialog.editProfile.replaceAvatar") }}
        </span>
      </div>

      <div class="grid gap-5">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[--text-color] ml-1">{{ $t("dialog.editProfile.username") }}</label>
          <n-input
            v-model:value="form.username"
            :placeholder="$t('dialog.editProfile.usernamePlaceholder')"
            class="border-(1px solid #90909080)" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-[--text-color] ml-1">{{ $t("dialog.editProfile.desc") }}</label>
          <n-input
            v-model:value="form.description"
            :placeholder="$t('dialog.editProfile.descPlaceholder')"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 5 }"
            maxlength="100"
            class="border-(1px solid #90909080)"
            show-count />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-[--line-color]">
        <n-button ghost @click="closeDialog">{{ $t("components.common.cancel") }}</n-button>
        <n-button type="primary" class="px-8" @click="saveProfile" :disabled="!form.username">
          {{ $t("dialog.editProfile.save") }}
        </n-button>
      </div>
    </div>
  </base-dialog>

  <input
    ref="fileInputRef"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    class="hidden"
    @change="handleFileChange" />

  <avatar-cropper ref="cropperRef" v-model:show="showCropper" :image-url="localImageUrl" @crop="handleCrop" />
</template>

<script setup lang="ts">
import { UploadSceneEnum } from "@/enums";
import { useUserStore } from "@/stores/user.ts";
import { useAvatarUpload } from "@/hooks/useAvatarUpload.ts";
import type { AvatarCropperInstance } from "@/components/common/AvatarCropper.vue";

const { userInfo } = useUserStore();

const props = defineProps({
  show: Boolean
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  save: [data: { name: string; description: string; avatar?: string }];
}>();

const fileInputRef = ref<HTMLInputElement>();
const cropperRef = ref<AvatarCropperInstance>();
// 本地表单数据
const form = reactive({
  username: userInfo?.username,
  description: "",
  avatar: userInfo?.avatar
});

const {
  localImageUrl,
  showCropper,
  openAvatarCropper,
  handleFileChange,
  handleCrop: onHookCrop
} = useAvatarUpload({
  scene: UploadSceneEnum.AVATAR,
  fileInputRef,
  cropperRef,
  onSuccess: (downloadUrl) => {
    // 上传成功后，更新本地预览头像
    form.avatar = downloadUrl;
    userInfo && (userInfo.avatar = downloadUrl);
  }
});

// 计算属性控制 Dialog 显示
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

/** 关闭弹窗 */
const closeDialog = () => {
  dialogVisible.value = false;
};

/**
 * 处理裁剪事件
 * @param cropBlob 裁剪后的图片 Blob 对象
 */
const handleCrop = async (cropBlob: Blob) => {
  await onHookCrop(cropBlob);
};

/** 保存资料 */
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
