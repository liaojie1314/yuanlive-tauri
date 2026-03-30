<template>
  <base-dialog v-model:show="dialogVisible" :title="$t('dialog.editProfile.title')">
    <div class="space-y-6">
      <n-scrollbar style="max-height: 60vh" class="pr-4">
        <div class="flex-col-x-center gap-3 py-1">
          <div class="group relative size-24 cursor-pointer">
            <n-avatar round class="border-2 border-[--line-color] shadow-sm" :size="96" :src="userInfo?.avatar" />
            <div
              class="absolute inset-0 flex-center rounded-full bg-black/50 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100"
              @click="openAvatarCropper">
              <i-mdi-camera class="size-7 text-white" />
            </div>
          </div>
          <span class="text-xs text-[--user-text-color] transition-colors hover:text-blue-500">
            {{ $t("dialog.editProfile.replaceAvatar") }}
          </span>
        </div>

        <div class="flex flex-col gap-2 py-1">
          <label class="ml-1 text-sm font-medium text-[--text-color]">{{ $t("dialog.editProfile.username") }}</label>
          <n-input
            clearable
            class="border-(1px solid #90909080)"
            v-model:value="form.username"
            :placeholder="$t('dialog.editProfile.usernamePlaceholder')" />
        </div>

        <div class="flex flex-col gap-2 py-1">
          <label class="ml-1 text-sm font-medium text-[--text-color]">{{ $t("dialog.editProfile.email") }}</label>
          <n-input
            clearable
            class="border-(1px solid #90909080)"
            v-model:value="form.email"
            :placeholder="$t('dialog.editProfile.emailPlaceholder')" />
        </div>

        <div class="flex flex-col gap-2 py-1">
          <label class="ml-1 text-sm font-medium text-[--text-color]">{{ $t("dialog.editProfile.password") }}</label>
          <n-input
            type="password"
            show-password-on="click"
            clearable
            class="border-(1px solid #90909080)"
            v-model:value="form.password"
            :placeholder="$t('dialog.editProfile.passwordPlaceholder')" />
        </div>

        <div class="flex flex-col gap-2 py-1">
          <label class="ml-1 text-sm font-medium text-[--text-color]">{{ $t("dialog.editProfile.gender") }}</label>
          <n-radio-group name="gender" v-model:value="form.gender">
            <n-space>
              <n-radio value="MALE">{{ $t("dialog.editProfile.male") }}</n-radio>
              <n-radio value="FEMALE">{{ $t("dialog.editProfile.female") }}</n-radio>
              <n-radio value="UNKNOWN">{{ $t("dialog.editProfile.unknown") }}</n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <div class="flex flex-col gap-2 py-1">
          <label class="ml-1 text-sm font-medium text-[--text-color]">{{ $t("dialog.editProfile.birthday") }}</label>
          <n-date-picker
            type="date"
            clearable
            class="border-(1px solid #90909080)"
            v-model:value="form.birthday"
            :placeholder="$t('dialog.editProfile.birthdayPlaceholder')" />
        </div>

        <div class="flex flex-col gap-2 py-1">
          <label class="ml-1 text-sm font-medium text-[--text-color]">{{ $t("dialog.editProfile.desc") }}</label>
          <n-input
            type="textarea"
            maxlength="100"
            show-count
            class="border-(1px solid #90909080)"
            v-model:value="form.description"
            :placeholder="$t('dialog.editProfile.descPlaceholder')"
            :autosize="{ minRows: 3, maxRows: 5 }" />
        </div>

        <div class="flex justify-end gap-3 border-t border-[--line-color] pt-4">
          <n-button ghost @click="closeDialog">{{ $t("components.common.cancel") }}</n-button>
          <n-button type="primary" class="px-8" :disabled="!form.username" @click="saveProfile">
            {{ $t("dialog.editProfile.save") }}
          </n-button>
        </div>
      </n-scrollbar>
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
  save: [
    data: {
      name: string;
      description: string;
      avatar?: string;
      email: string;
      password: string;
      gender?: string;
      birthday?: number | null;
    }
  ];
}>();

const fileInputRef = ref<HTMLInputElement>();
const cropperRef = ref<AvatarCropperInstance>();
// 本地表单数据
const form = reactive({
  username: userInfo?.username || "",
  description: userInfo?.description || "",
  avatar: userInfo?.avatar,
  email: userInfo?.email || "",
  password: "",
  gender: userInfo?.gender || "UNKNOWN",
  birthday: userInfo?.birthday || null
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
    avatar: form.avatar,
    email: form.email,
    password: form.password,
    gender: form.gender,
    birthday: form.birthday
  });
  closeDialog();
};
</script>
