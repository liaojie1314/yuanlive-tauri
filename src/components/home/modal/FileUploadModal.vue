<template>
  <n-modal
    transform-origin="center"
    class="rounded-8px"
    v-model:show="visible"
    :trap-focus="false"
    :mask-closable="false">
    <div class="min-w-320px box-border flex h-fit cursor-default flex-col bg-[--bg-modal] select-none">
      <n-flex vertical :size="6">
        <div
          v-if="isMac()"
          class="mac-close size-13px bg-#ed6a5eff rounded-50% mt-6px left-6px absolute shadow-inner select-none"
          @click="visible = false">
          <svg class="size-7px color-#000 top-3px left-3px absolute hidden select-none">
            <use href="#close"></use>
          </svg>
        </div>

        <n-flex justify="center" class="text-(14px [--text-color]) pt-6px select-none">
          {{ t("components.fileUpload.title") }}
        </n-flex>

        <svg
          v-if="isWindows()"
          class="size-14px pt-6px right-6px absolute cursor-pointer select-none"
          @click="visible = false">
          <use href="#close"></use>
        </svg>
        <span class="h-1px w-full bg-[--line-color]"></span>
      </n-flex>

      <!-- 内容 -->
      <div class="p-10px">
        <div class="max-h-400px overflow-y-auto">
          <div v-for="(file, index) in fileList" class="flex-y-center p-12px" :key="index">
            <div class="pr-12px flex-shrink-0">
              <img
                class="size-32px object-contain"
                :src="`/file/${getFileExtension(file.name)}.svg`"
                :alt="getFileExtension(file.name)"
                @error="handleIconError" />
            </div>

            <div class="min-w-0 flex-1">
              <div
                class="text-(14px [--text-color]) pb-4px overflow-hidden text-ellipsis whitespace-nowrap"
                :title="file.name">
                {{ file.name }}
              </div>
              <div class="text-(12px [--user-text-color])">{{ formatFileSize(file.size) }}</div>
            </div>

            <div class="pl-20px flex-shrink-0 cursor-pointer" @click="removeFile(index)">
              <svg class="size-20px hover:color-#909090 transition-colors duration-200 ease-in-out">
                <use href="#squareClose"></use>
              </svg>
            </div>
          </div>
        </div>

        <div class="gap-8px flex justify-end">
          <n-button quaternary @click="handleCancel">{{ t("components.fileUpload.cancel") }}</n-button>
          <n-button secondary type="primary" :disabled="fileList.length === 0" @click="handleConfirm">
            {{ t("components.fileUpload.send", { count: fileList.length }) }}
          </n-button>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { UploadFile } from "@/utils/FileUtil";
import { formatBytes } from "@/utils/FormattingUtils";
import { isMac, isWindows } from "@/utils/PlatformUtils";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    show: boolean;
    files: UploadFile[];
  }>(),
  {
    show: false,
    files: () => []
  }
);

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "confirm", files: UploadFile[]): void;
  (e: "cancel"): void;
}>();

const visible = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value)
});

const fileList = ref<UploadFile[]>([]);

watch(
  () => props.files,
  (newFiles) => {
    fileList.value = [...newFiles];
  },
  { immediate: true }
);

const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toLowerCase() || "file";
};

const formatFileSize = (bytes: number): string => {
  return formatBytes(bytes);
};

const handleIconError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = "/file/other.svg"; // 默认文件图标
};

const removeFile = (index: number) => {
  fileList.value.splice(index, 1);
  // 如果文件列表为空，自动关闭弹窗
  if (fileList.value.length === 0) {
    visible.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
  emit("cancel");
};

const handleConfirm = async () => {
  visible.value = false;
  await nextTick();
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  emit("confirm", fileList.value);
};
</script>

<style scoped lang="scss"></style>
