import { useI18n } from "vue-i18n";
import { useUpload } from "./useUpload";
import { UploadSceneEnum } from "@/enums";
import type { AvatarCropperInstance } from "@/components/common/AvatarCropper.vue";

export interface AvatarUploadOptions {
  onSuccess?: (downloadUrl: string) => void;
  scene?: UploadSceneEnum;
  sizeLimit?: number; // KB
  fileInputRef?: Ref<HTMLInputElement | undefined>;
  cropperRef?: Ref<AvatarCropperInstance | undefined>;
}

export const useAvatarUpload = (options: AvatarUploadOptions = {}) => {
  const { t } = useI18n();

  const {
    onSuccess,
    scene = UploadSceneEnum.AVATAR,
    sizeLimit = 150,
    fileInputRef = ref<HTMLInputElement>(),
    cropperRef = ref<AvatarCropperInstance>()
  } = options;

  const { uploadFile, onComplete, onError } = useUpload();

  const localImageUrl = ref("");
  const showCropper = ref(false);

  // 监听上传完成
  onComplete((result) => {
    if (result.success && result.url) {
      window.$message.success(t("hook.avatarUpload.uploadSuccess"));
      onSuccess?.(result.url);

      // 关闭窗口和清理
      showCropper.value = false;
      cleanup();
    }
    cropperRef.value?.finishLoading();
  });

  // 监听错误
  onError((error) => {
    console.error("上传头像失败:", error);
    window.$message.error(t("hook.avatarUpload.uploadFailed"));
    cropperRef.value?.finishLoading();
  });

  const cleanup = () => {
    if (localImageUrl.value) {
      URL.revokeObjectURL(localImageUrl.value);
      localImageUrl.value = "";
    }
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  };

  const openFileSelector = () => {
    fileInputRef.value?.click();
  };

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      // 限制原图大小或类型可以在这里做初步检查
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        localImageUrl.value = url;
        nextTick(() => {
          showCropper.value = true;
        });
      };
      img.onerror = () => {
        window.$message.error(t("hook.avatarUpload.loadingFailed"));
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const openAvatarCropper = () => {
    fileInputRef.value?.click();
  };

  const handleCrop = async (cropBlob: Blob) => {
    try {
      const fileName = `avatar_${Date.now()}.webp`;
      // 注意：这里创建的是内存 File，没有 path 属性
      // 配合 useUpload 会自动走 upload_chunk_bytes_command，符合预期
      const file = new File([cropBlob], fileName, { type: "image/webp" });

      if (file.size > sizeLimit * 1024) {
        window.$message.error(t("hook.avatarUpload.sizeLimit", { sizeLimit }));
        cropperRef.value?.finishLoading();
        return;
      }

      // 执行上传
      // scene 默认为 Avatar，chunkSize 会很小 (1MB)，直接上传
      await uploadFile(file, scene);
    } catch (e) {
      // uploadFile 内部会处理大部分错误并触发 onError
      // 这里只处理同步抛出的异常
      console.error(e);
      cropperRef.value?.finishLoading();
    }
  };

  onUnmounted(() => {
    cleanup();
  });

  return {
    fileInputRef,
    localImageUrl,
    showCropper,
    cropperRef,
    openFileSelector,
    handleFileChange,
    handleCrop,
    openAvatarCropper
  };
};
