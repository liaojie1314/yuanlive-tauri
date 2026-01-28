<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    :mask-closable="false"
    class="rounded-8px"
    transform-origin="center">
    <div class="bg-[--bg-edit] w-560px h-480px box-border flex flex-col items-center justify-between">
      <n-flex :size="6" vertical class="w-full">
        <div
          v-if="isMac()"
          @click="closeWindow"
          class="mac-close size-13px shadow-inner bg-#ed6a5eff rounded-50% mt-6px select-none absolute left-6px cursor-pointer">
          <svg class="hidden size-7px color-#000 select-none absolute top-3px left-3px">
            <use href="#close"></use>
          </svg>
        </div>

        <n-flex class="text-(14px [--text-color]) select-none pt-6px" justify="center">
          {{ t("components.avatarCropper.title") }}
        </n-flex>

        <svg
          v-if="isWindows()"
          class="size-14px cursor-pointer pt-6px select-none absolute right-6px"
          @click="closeWindow">
          <use href="#close"></use>
        </svg>
        <span class="h-1px w-full bg-[--line-color]"></span>
      </n-flex>

      <n-flex align="center">
        <div class="w-320px h-320px p-10px mr-20px">
          <vue-cropper
            ref="vueCropperRef"
            :img="localImageUrl"
            :outputSize="0.6"
            :outputType="'webp'"
            :autoCrop="true"
            :fixedBox="true"
            :fixed="true"
            :centerBox="true"
            :autoCropWidth="320"
            :autoCropHeight="320"
            :fixedNumber="[1, 1]"
            @realTime="handleRealTime" />
        </div>

        <n-flex vertical class="px-20px">
          <div class="mb-20px">
            <div class="text-14px text-[--text-color] mb-8px">
              {{ t("components.avatarCropper.preview.round") }}
            </div>
            <div class="preview-wrapper rounded-full">
              <div class="preview-content" :style="previewStyle">
                <img :src="previewUrl?.url" :style="previewUrl?.img" />
              </div>
            </div>
          </div>

          <div>
            <div class="text-14px text-[--text-color] mb-8px w-120px">
              {{ t("components.avatarCropper.preview.square") }}
            </div>
            <div class="preview-wrapper rounded-12px">
              <div class="preview-content" :style="previewStyle">
                <img :src="previewUrl?.url" :style="previewUrl?.img" />
              </div>
            </div>
          </div>
        </n-flex>
      </n-flex>

      <n-flex class="p-12px" align="center" justify="center" :size="12">
        <n-button quaternary @click="closeWindow" :disabled="loading">{{ t("components.common.cancel") }}</n-button>
        <n-button type="primary" @click="handleConfirm" :loading="loading">{{ loadingText }}</n-button>
      </n-flex>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import "vue-cropper/dist/index.css";
import { useI18n } from "vue-i18n";
import { VueCropper } from "vue-cropper";
import { isMac, isWindows } from "@/utils/PlatformUtils";

export interface AvatarCropperInstance {
  finishLoading: () => void;
}

const props = defineProps<{
  show: boolean;
  imageUrl: string;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  crop: [data: Blob];
}>();

const { t } = useI18n();
const localImageUrl = ref("");
const vueCropperRef = ref(); // 内部 vue-cropper 的引用
const loading = ref(false);

const loadingText = computed(() =>
  loading.value ? t("components.avatarCropper.uploading") : t("components.common.confirm")
);

const previewUrl = ref<any>({});

watch(
  () => props.imageUrl,
  (newVal) => {
    localImageUrl.value = newVal;
  },
  { immediate: true }
);

// 提取公共预览样式
const previewStyle = computed(() => ({
  width: (previewUrl.value?.w || 0) + "px",
  height: (previewUrl.value?.h || 0) + "px",
  overflow: "hidden",
  transform: "scale(0.4)", // 这里的缩放比例需要根据实际 UI 调整
  position: "absolute" as const,
  top: 0,
  left: 0,
  transformOrigin: "0 0"
}));

const handleRealTime = (data: any) => {
  previewUrl.value = data;
};

const handleConfirm = () => {
  loading.value = true;
  // 获取 WebP 格式的 Blob
  vueCropperRef.value?.getCropBlob((blob: Blob) => {
    emit("crop", blob);
  });
};

const closeWindow = () => {
  if (!loading.value) {
    emit("update:show", false);
  }
};

const finishLoading = () => {
  loading.value = false;
};

// 暴露给父组件
defineExpose<AvatarCropperInstance>({
  finishLoading
});

onUnmounted(() => {
  previewUrl.value = {};
});
</script>

<style scoped>
.mac-close:hover svg {
  display: block;
}
:deep(.cropper-view-box) {
  border-radius: 50%;
  outline: 2px solid var(--primary-color);
  outline-color: rgba(255, 255, 255, 0.5);
}
:deep(.cropper-face) {
  background-color: transparent;
  border-radius: 50%;
}
.preview-wrapper {
  position: relative;
  width: 128px; /* 320 * 0.4 */
  height: 128px;
  overflow: hidden;
  background-color: #f0f0f0;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}
</style>
