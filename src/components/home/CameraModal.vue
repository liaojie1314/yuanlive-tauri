<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="t('components.camera.title')"
    class="max-w-[800px] w-full bg-[--bg-modal]!"
    :on-after-leave="handleAfterLeave"
    :mask-closable="false">
    <div class="flex flex-col items-center gap-4 relative rounded-lg overflow-hidden min-h-[400px]">
      <video
        v-show="!photoUrl"
        ref="videoRef"
        class="w-full h-full object-contain transform -scale-x-100"
        autoplay
        playsinline
        muted></video>

      <img v-if="photoUrl" :src="photoUrl" class="w-full h-full object-contain" />

      <canvas ref="canvasRef" class="hidden"></canvas>

      <div class="absolute bottom-6 flex gap-4 z-10">
        <n-button v-if="!photoUrl" circle type="primary" class="w-14 h-14 !text-2xl" @click="handleCapture">
          <template #icon><i-mdi-camera /></template>
        </n-button>

        <template v-else>
          <n-button round secondary type="error" @click="handleRetake">
            <template #icon><i-mdi-refresh /></template>
            {{ t("components.camera.retake") }}
          </n-button>
          <n-button round type="success" @click="handleConfirm">
            <template #icon><i-mdi-check /></template>
            {{ t("components.camera.usePhoto") }}
          </n-button>
        </template>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useCamera } from "@/hooks/useCamera";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "update:show", visible: boolean): void;
  (e: "confirm", photoUrl: string): void;
}>();

// 双向绑定 show 状态
const showModal = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val)
});

// 引入 Camera Hook
const { startCamera, stopCamera, takePhoto, photoUrl } = useCamera();

// DOM 引用
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// 监听弹窗显示状态，自动开关摄像头
watch(
  () => props.show,
  async (isVisible) => {
    if (isVisible) {
      await nextTick();
      if (videoRef.value) {
        // 重置状态并启动摄像头
        photoUrl.value = "";
        try {
          await startCamera(videoRef.value);
        } catch (e) {
          console.error("Failed to start camera:", e);
          window.$message.error(t("components.camera.startCameraFailed"));
        }
      }
    } else {
      // 弹窗关闭时停止摄像头（双重保险，on-after-leave 也会调）
      stopCamera();
    }
  }
);

// 拍照
const handleCapture = () => {
  if (videoRef.value && canvasRef.value) {
    takePhoto(videoRef.value, canvasRef.value);
  }
};

// 重拍
const handleRetake = () => {
  photoUrl.value = "";
};

// 确认使用
const handleConfirm = () => {
  if (photoUrl.value) {
    emit("confirm", photoUrl.value);
    showModal.value = false; // 关闭弹窗
  }
};

// 弹窗完全关闭后的清理工作
const handleAfterLeave = () => {
  stopCamera();
  photoUrl.value = "";
};
</script>

<style scoped>
.transform {
  transform: scaleX(-1);
}
</style>
