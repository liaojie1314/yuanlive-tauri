<template>
  <base-dialog v-model:show="dialogVisible" title="发布视频" width="700px">
    <div class="upload-video-content space-y-6">
      <div v-if="!videoFile" class="flex justify-center py-8">
        <n-upload
          directory-dnd
          accept="video/mp4,video/quicktime,video/x-matroska"
          :max="1"
          @change="handleVideoChange"
          :show-file-list="false">
          <n-upload-dragger class="!bg-[--home-bg-color] !border-[--line-color] hover:!border-blue-500">
            <div class="flex flex-col items-center gap-3 py-6 px-12">
              <i-mdi-cloud-upload class="text-6xl text-blue-500/50" />
              <div class="text-base font-medium text-[--text-color]">点击或拖拽视频到此处上传</div>
              <p class="text-xs text-[--user-text-color]">支持 MP4, MOV, MKV 格式，大小不超过 2GB</p>
            </div>
          </n-upload-dragger>
        </n-upload>
      </div>

      <div v-else class="animate-fade-in">
        <div class="flex gap-4 mb-6">
          <div class="w-1/3 aspect-video bg-black rounded-lg overflow-hidden relative group">
            <video :src="videoUrl" class="w-full h-full object-contain"></video>
            <div
              class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              @click="handleReupload">
              <span class="text-white text-sm flex items-center gap-1">
                <i-mdi-refresh />
                更换视频
              </span>
            </div>
          </div>

          <div class="flex-1 space-y-4">
            <n-form-item label="视频标题" :show-label="true" label-style="color: var(--text-color);">
              <n-input
                v-model:value="form.title"
                placeholder="给视频起个响亮的标题吧 (必填)"
                maxlength="50"
                show-count
                class="border-(1px solid #90909080)"
                clearable />
            </n-form-item>

            <n-form-item label="视频简介" :show-label="true" label-style="color: var(--text-color);">
              <n-input
                v-model:value="form.description"
                type="textarea"
                placeholder="介绍一下视频内容..."
                :autosize="{ minRows: 2, maxRows: 4 }"
                class="border-(1px solid #90909080)" />
            </n-form-item>
          </div>
        </div>

        <div class="border-t border-[--line-color] pt-4">
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm font-medium text-[--text-color] whitespace-nowrap shrink-0 mr-2">设置封面</span>
            <n-upload accept="image/*" :show-file-list="false" @change="handleCoverUpload">
              <n-button size="small" secondary>
                <template #icon><i-mdi-image-plus /></template>
                上传封面
              </n-button>
            </n-upload>
          </div>

          <div class="bg-[--tray-bg-color] p-3 rounded-lg border border-[--line-color]">
            <div v-if="isGenerating" class="flex justify-center py-4">
              <n-spin size="small">
                <template #description>正在提取视频帧...</template>
              </n-spin>
            </div>

            <n-scrollbar x-scrollable v-else>
              <div class="flex gap-3 pb-2 min-w-max">
                <div class="relative w-32 aspect-video rounded overflow-hidden border-2 border-blue-500 shrink-0">
                  <img :src="form.coverUrl || frames[0]" class="w-full h-full object-cover" />
                  <div class="absolute bottom-0 right-0 bg-blue-500 text-white text-[10px] px-1">当前封面</div>
                </div>

                <div
                  v-for="(frame, index) in frames"
                  :key="index"
                  class="w-32 aspect-video rounded overflow-hidden cursor-pointer border-2 transition-all hover:border-blue-300 shrink-0"
                  :class="form.coverUrl === frame ? 'border-blue-500' : 'border-transparent'"
                  @click="form.coverUrl = frame">
                  <img :src="frame" class="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </n-scrollbar>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <n-button @click="closeDialog">取消</n-button>
        <n-button type="primary" :loading="isSubmitting" :disabled="!videoFile || !form.title" @click="handleSubmit">
          发布视频
        </n-button>
      </div>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import type { UploadFileInfo } from "naive-ui";
import { useVideoFrame } from "@/hooks/useVideoFrame";

interface Props {
  show: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:show", "success"]);

const { videoUrl, frames, isGenerating, generateFrames, clearFrames } = useVideoFrame();

const videoFile = ref<File | null>(null);
const isSubmitting = ref(false);

const form = reactive({
  title: "",
  description: "",
  coverUrl: ""
});

const dialogVisible = computed({
  get: () => props.show,
  set: (val) => {
    if (!val) resetForm(); // 关闭时重置
    emit("update:show", val);
  }
});

// 处理视频选择
const handleVideoChange = async (data: { file: UploadFileInfo }) => {
  const file = data.file.file;
  if (!file) return;

  // 简单的格式校验
  if (file.size > 2 * 1024 * 1024 * 1024) {
    window.$message.error("视频大小不能超过 2GB");
    return;
  }

  videoFile.value = file;
  form.title = file.name.replace(/\.[^/.]+$/, ""); // 自动填充文件名作为标题

  // 生成预览帧
  await generateFrames(file, 8);
  // 默认选中第一帧作为封面
  if (frames.value.length > 0) {
    form.coverUrl = frames.value[0];
  }
};

// 处理手动上传封面
const handleCoverUpload = (data: { file: UploadFileInfo }) => {
  const file = data.file.file;
  if (file) {
    const url = URL.createObjectURL(file);
    form.coverUrl = url;
  }
};

// 重新上传
const handleReupload = () => {
  videoFile.value = null;
  clearFrames();
  form.title = "";
  form.description = "";
  form.coverUrl = "";
};

// 提交表单
const handleSubmit = async () => {
  if (!form.title.trim()) {
    window.$message.warning("请输入视频标题");
    return;
  }

  try {
    isSubmitting.value = true;

    // TODO: 上传视频

    // 模拟上传延迟
    await new Promise((resolve) => setTimeout(resolve, 2000));

    window.$message.success("发布成功！");
    emit("success");
    dialogVisible.value = false;
  } catch (error) {
    window.$message.error("发布失败，请重试");
  } finally {
    isSubmitting.value = false;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const resetForm = () => {
  handleReupload();
};
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
