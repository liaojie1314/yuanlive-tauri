<template>
  <base-dialog v-model:show="dialogVisible" :title="t('dialog.uploadVideo.title')" width="700px">
    <div class="flex flex-col max-h-[75vh] min-h-[450px]">
      <div v-if="!videoFile" class="flex-1 flex items-center justify-center p-8">
        <n-upload
          directory-dnd
          accept="video/mp4,video/quicktime,video/x-matroska"
          :max="1"
          @change="handleVideoChange"
          :show-file-list="false">
          <n-upload-dragger class="!bg-[--home-bg-color] !border-[--line-color] hover:!border-blue-500">
            <div class="flex flex-col items-center gap-3 py-6 px-12">
              <i-mdi-cloud-upload class="text-6xl text-blue-500/50" />
              <div class="text-base font-medium text-[--text-color]">{{ t("dialog.uploadVideo.uploadMessage") }}</div>
              <p class="text-xs text-[--user-text-color]">
                {{ t("dialog.uploadVideo.videoInfo", { count: maxVideoSize }) }}
              </p>
            </div>
          </n-upload-dragger>
        </n-upload>
      </div>

      <template v-else>
        <div class="flex-1 min-h-0 relative">
          <n-scrollbar class="absolute inset-0 pr-4">
            <div class="animate-fade-in space-y-6 pb-4">
              <div class="flex gap-5">
                <div class="w-[220px] shrink-0 aspect-video bg-black rounded-lg overflow-hidden relative group">
                  <video :src="videoUrl" class="w-full h-full object-contain"></video>
                  <div
                    class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    @click="handleReupload">
                    <span class="text-white text-sm flex items-center gap-1">
                      <i-mdi-refresh />
                      {{ t("dialog.uploadVideo.reupload") }}
                    </span>
                  </div>
                </div>

                <div class="flex-1 space-y-4">
                  <n-form-item
                    :label="t('dialog.uploadVideo.videoTitle')"
                    :show-label="true"
                    label-style="color: var(--text-color);">
                    <n-input
                      v-model:value="form.title"
                      :placeholder="t('dialog.uploadVideo.videoTitlePlaceholder')"
                      maxlength="50"
                      show-count
                      class="border-(1px solid #90909080) rounded-md"
                      clearable />
                  </n-form-item>

                  <n-form-item
                    :label="t('dialog.uploadVideo.videoDesc')"
                    :show-label="true"
                    label-style="color: var(--text-color);">
                    <n-input
                      v-model:value="form.description"
                      type="textarea"
                      :placeholder="t('dialog.uploadVideo.videoDescPlaceholder')"
                      :autosize="{ minRows: 2, maxRows: 3 }"
                      class="border-(1px solid #90909080) rounded-md" />
                  </n-form-item>
                </div>
              </div>

              <n-form-item :show-label="true" label-style="color: var(--text-color); width: 100%; display: flex;">
                <template #label>
                  <div class="flex justify-between items-center w-full">
                    <span>{{ t("dialog.uploadVideo.videoChapters") }}</span>
                    <span v-if="videoDuration > 0" class="text-[12px] text-[--user-text-color] font-normal font-mono">
                      {{ t("dialog.uploadVideo.totalDuration") }} {{ formatSecondsToTimeStr(videoDuration) }}
                    </span>
                  </div>
                </template>

                <div class="w-full space-y-3">
                  <div class="flex items-center gap-3 w-full">
                    <n-input
                      v-model:value="newChapter.timeStr"
                      placeholder="00:00"
                      style="width: 80px"
                      class="shrink-0 border-(1px solid #90909080) rounded-md"
                      @keyup.enter="handleAddChapter" />
                    <n-input
                      v-model:value="newChapter.title"
                      :placeholder="t('dialog.uploadVideo.chapterTitle')"
                      style="flex: 1; min-width: 0"
                      class="border-(1px solid #90909080) rounded-md"
                      maxlength="30"
                      @keyup.enter="handleAddChapter" />
                    <n-button secondary type="primary" @click="handleAddChapter" class="shrink-0 px-5">
                      {{ t("dialog.uploadVideo.addChapter") }}
                    </n-button>
                  </div>

                  <div
                    v-if="form.chapters.length > 0"
                    class="bg-[--tray-bg-color] p-3 rounded-md border border-[--line-color] space-y-2 max-h-[140px] overflow-y-auto">
                    <div
                      v-for="(chapter, index) in form.chapters"
                      :key="index"
                      class="flex justify-between items-center bg-[--home-bg-color] px-3 py-1.5 rounded text-sm">
                      <div class="flex items-center gap-3">
                        <span class="text-blue-500 font-mono">{{ chapter.timeStr }}</span>
                        <span class="text-[--text-color]">{{ chapter.title }}</span>
                      </div>
                      <i-mdi-close
                        class="text-[--user-text-color] hover:text-red-500 cursor-pointer transition-colors"
                        @click="removeChapter(index)" />
                    </div>
                  </div>

                  <div v-else class="text-xs text-[--user-text-color]">
                    {{
                      t("dialog.uploadVideo.chapterTip", {
                        count: CHAPTER_LIMITS.MAX_COUNT,
                        gap: CHAPTER_LIMITS.MIN_GAP
                      })
                    }}
                  </div>
                </div>
              </n-form-item>

              <div class="border-t border-[--line-color] pt-5">
                <div class="flex justify-between items-center mb-3">
                  <span class="text-sm font-medium text-[--text-color] whitespace-nowrap shrink-0 mr-2">
                    {{ t("dialog.uploadVideo.cover") }}
                  </span>
                  <n-upload accept="image/*" :show-file-list="false" @change="handleCoverUpload">
                    <n-button size="small" secondary>
                      <template #icon><i-mdi-image-plus /></template>
                      {{ t("dialog.uploadVideo.uploadCover") }}
                    </n-button>
                  </n-upload>
                </div>

                <div class="bg-[--tray-bg-color] p-3 rounded-lg border border-[--line-color]">
                  <div v-if="isGenerating" class="flex justify-center py-4">
                    <n-spin size="small">
                      <template #description>{{ t("dialog.uploadVideo.extractFrame") }}</template>
                    </n-spin>
                  </div>

                  <div v-else class="flex gap-3">
                    <div
                      class="relative w-[140px] aspect-video rounded-md overflow-hidden border-2 border-blue-500 shrink-0 bg-black">
                      <img :src="form.coverUrl || frames[0]" class="w-full h-full object-contain" />
                      <div
                        class="absolute bottom-0 right-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-tl">
                        {{ t("dialog.uploadVideo.currentCover") }}
                      </div>
                    </div>

                    <div class="flex-1 min-w-0">
                      <n-scrollbar ref="coverScrollbarRef" x-scrollable @wheel.prevent="handleCoverWheel">
                        <div class="flex gap-3 pb-2 min-w-max">
                          <div
                            v-for="(frame, index) in frames"
                            :key="index"
                            class="w-[140px] aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all hover:border-blue-300 shrink-0 bg-black"
                            :class="form.coverUrl === frame ? 'border-blue-500' : 'border-transparent'"
                            @click="form.coverUrl = frame">
                            <img :src="frame" class="w-full h-full object-contain" loading="lazy" />
                          </div>
                        </div>
                      </n-scrollbar>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>

        <div class="shrink-0 flex justify-end gap-3 pt-4 mt-2 border-t border-[--line-color]">
          <n-button @click="closeDialog" class="px-6">{{ t("components.common.cancel") }}</n-button>
          <n-button
            type="primary"
            :loading="isSubmitting"
            :disabled="!videoFile || !form.title"
            @click="handleSubmit"
            class="px-6">
            {{ t("dialog.uploadVideo.publishVideo") }}
          </n-button>
        </div>
      </template>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { UploadFileInfo, ScrollbarInst } from "naive-ui";

import { UploadSceneEnum, MittEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";
import { useUpload } from "@/hooks/useUpload";
import { useVideoFrame } from "@/hooks/useVideoFrame";
import { formatSecondsToTimeStr, formatTimeStrToSeconds } from "@/utils/FormattingUtils";

const { t } = useI18n();
const { uploadFile } = useUpload();
const { videoUrl, frames, isGenerating, videoDuration, generateFrames, clearFrames } = useVideoFrame();

interface Props {
  show: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(["update:show", "success"]);

const maxVideoSize = 2;
// 定义章节限制条件
const CHAPTER_LIMITS = {
  MAX_COUNT: 10, // 最多允许 10 个章节
  MIN_GAP: 5, // 每个章节之间至少间隔 5 秒
  END_MARGIN: 5 // 不能在视频结束前 5 秒内添加章节
};

const videoFile = ref<File | null>(null);
const isSubmitting = ref(false);
const coverScrollbarRef = ref<ScrollbarInst | null>(null);

const form = reactive({
  title: "",
  description: "",
  coverUrl: "",
  videoUrl: "",
  chapters: [] as Array<{ time: number; timeStr: string; title: string }>
});
const newChapter = reactive({
  timeStr: "",
  title: ""
});

const dialogVisible = computed({
  get: () => props.show,
  set: (val) => {
    if (!val) resetForm(); // 关闭时重置
    emit("update:show", val);
  }
});

/**
 * 处理封面上传
 * @param data 封面文件信息
 */
const handleCoverUpload = async (data: { file: UploadFileInfo }) => {
  const file = data.file.file;
  if (file) {
    try {
      // 先使用临时 URL 显示预览
      const tempUrl = URL.createObjectURL(file);
      form.coverUrl = tempUrl;
      // 然后上传封面文件
      form.coverUrl = await uploadFile(file, UploadSceneEnum.AVATAR);
    } catch (error) {
      console.error("封面上传失败:", error);
      window.$message.error(t("dialog.uploadVideo.msg.coverUploadFailed"));
    }
  }
};

/** 重新上传视频 */
const handleReupload = () => {
  videoFile.value = null;
  clearFrames();
  form.title = "";
  form.description = "";
  form.coverUrl = "";
  form.chapters = [];
};

/** 提交表单 */
const handleSubmit = async () => {
  if (!form.title.trim()) {
    window.$message.warning(t("dialog.uploadVideo.msg.inputVideoTitle"));
    return;
  }

  try {
    isSubmitting.value = true;

    // 上传视频
    form.videoUrl = await uploadFile(videoFile.value!, UploadSceneEnum.VIDEO);

    console.log(form);

    // 上传封面(生成的视频帧)
    // if (form.coverUrl && !form.coverUrl.startsWith("data:")) {
    //   // 从 coverUrl 创建 File 对象
    //   const response = await fetch(form.coverUrl);
    //   const blob = await response.blob();
    //   const coverFile = new File([blob], "cover.jpg", { type: "image/jpeg" });
    //   await uploadFile(coverFile, UploadSceneEnum.AVATAR);
    // }

    window.$message.success(t("dialog.uploadVideo.msg.publishSuccess"));
    emit("success");
    dialogVisible.value = false;
  } catch (error) {
    window.$message.error(t("dialog.uploadVideo.msg.publishFailed"));
  } finally {
    isSubmitting.value = false;
  }
};

/** 关闭弹窗 */
const closeDialog = () => {
  dialogVisible.value = false;
};

/** 重置表单 */
const resetForm = () => {
  handleReupload();
};

/** 添加章节 */
const handleAddChapter = () => {
  const { timeStr, title } = newChapter;
  if (!timeStr || !title.trim()) {
    window.$message.warning(t("dialog.uploadVideo.msg.chapterTimeAndTitle"));
    return;
  }
  // 限制1：数量限制
  if (form.chapters.length >= CHAPTER_LIMITS.MAX_COUNT) {
    window.$message.warning(t("dialog.uploadVideo.msg.maxChapterCount", { count: CHAPTER_LIMITS.MAX_COUNT }));
    return;
  }
  const seconds = formatTimeStrToSeconds(timeStr);
  if (seconds === -1) {
    window.$message.warning(t("dialog.uploadVideo.msg.chapterTimeFormatError"));
    return;
  }
  // 限制2：超出视频时长或太接近末尾
  if (seconds > videoDuration.value - CHAPTER_LIMITS.END_MARGIN) {
    window.$message.warning(t("dialog.uploadVideo.msg.chapterTimeTooCloseToEnd", { gap: CHAPTER_LIMITS.END_MARGIN }));
    return;
  }
  // 限制3：与其他章节间隔太短
  const isTooClose = form.chapters.some((chap) => Math.abs(chap.time - seconds) < CHAPTER_LIMITS.MIN_GAP);
  if (isTooClose) {
    window.$message.warning(t("dialog.uploadVideo.msg.chapterTimeGapError", { gap: CHAPTER_LIMITS.MIN_GAP }));
    return;
  }
  // 添加并按时间排序
  form.chapters.push({ time: seconds, timeStr: formatSecondsToTimeStr(seconds), title: title.trim() });
  form.chapters.sort((a, b) => a.time - b.time);
  // 清空输入框
  newChapter.timeStr = "";
  newChapter.title = "";
};

/**
 * 删除章节
 * @param index 章节索引
 */
const removeChapter = (index: number) => {
  form.chapters.splice(index, 1);
};

/**
 * 监听封面区域鼠标滚轮事件，将纵向滚动转换为横向滚动
 * @param e 滚轮事件
 */
const handleCoverWheel = (e: WheelEvent) => {
  if (!coverScrollbarRef.value) return;
  coverScrollbarRef.value.scrollBy({ left: e.deltaY });
};

/**
 * 核心：处理视频文件（复用于点击上传和拖拽上传）
 */
const processVideoFile = async (file: File) => {
  if (file.size > maxVideoSize * 1024 * 1024 * 1024) {
    window.$message.error(t("dialog.uploadVideo.msg.videoSizeLimit", { count: maxVideoSize }));
    return;
  }
  videoFile.value = file;
  form.title = file.name.replace(/\.[^/.]+$/, ""); // 自动填充文件名

  await generateFrames(file, 8);
  if (frames.value.length > 0) {
    form.coverUrl = frames.value[0];
  }
};

/**
 * 处理视频选择
 * @param data 视频文件信息
 */
const handleVideoChange = async (data: { file: UploadFileInfo }) => {
  if (data.file.file) {
    await processVideoFile(data.file.file);
  }
};

/**
 * 处理 Tauri 传过来的全局拖拽文件
 * @param files 文件列表
 */
const handleVideoDrop = async (files: any[]) => {
  if (!files || files.length === 0) return;
  const fileObj = files[0]; // :max="1" 取第一个

  let file: File | null = null;

  try {
    // 根据你的 UploadFile 结构解析文件
    if (fileObj instanceof File) {
      file = fileObj;
    } else if (fileObj.kind === "path") {
      // Tauri 路径转为 Web File 对象
      const url = convertFileSrc(fileObj.path);
      const response = await fetch(url);
      const blob = await response.blob();
      file = new File([blob], fileObj.name, { type: blob.type });
    }

    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["mp4", "mov", "mkv"].includes(ext || "")) {
        window.$message.warning(t("dialog.uploadVideo.msg.onlySupport"));
        return;
      }
      await processVideoFile(file);
    }
  } catch (error) {
    console.error("处理拖拽视频失败:", error);
    window.$message.error(t("dialog.uploadVideo.msg.readDragVideoFailed"));
  }
};

watch(
  () => props.show,
  (isOpen) => {
    useMitt.emit(MittEnum.TOGGLE_VIDEO_UPLOAD_MODAL, isOpen);
  }
);

onMounted(() => {
  useMitt.on(MittEnum.VIDEO_MODAL_FILE_DROP, handleVideoDrop);
});

onBeforeUnmount(() => {
  useMitt.off(MittEnum.VIDEO_MODAL_FILE_DROP, handleVideoDrop);
});
</script>

<style scoped>
/* 简单的淡入动画 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
