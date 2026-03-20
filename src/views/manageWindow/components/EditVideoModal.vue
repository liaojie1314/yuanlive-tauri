<template>
  <n-modal v-model:show="dialogVisible">
    <n-card
      style="width: 700px; max-width: 95vw"
      title="编辑视频信息"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="rounded-xl border border-[var(--line-color)] bg-[var(--tray-bg-color)]"
      :bordered="false">
      <template #header-extra>
        <n-button text circle class="text-[var(--text-color)] hover:bg-[var(--line-color)]" @click="close">
          <i-mdi-close />
        </n-button>
      </template>
      <n-scrollbar style="max-height: 60vh" class="pr-2">
        <n-form ref="formRef" label-placement="left" label-width="80px" class="mt-2" :model="form">
          <n-form-item label="视频标题">
            <n-input
              placeholder="请输入视频标题"
              maxlength="50"
              show-count
              class="border-(1px solid #90909080)"
              v-model:value="form.title" />
          </n-form-item>

          <n-form-item label="视频简介">
            <n-input
              type="textarea"
              placeholder="请输入视频简介"
              class="border-(1px solid #90909080)"
              v-model:value="form.description"
              :autosize="{ minRows: 3, maxRows: 5 }" />
          </n-form-item>

          <n-form-item label="视频封面">
            <div class="flex w-full flex-col gap-3">
              <div class="flex items-end gap-4">
                <div
                  class="group relative aspect-video w-48 overflow-hidden rounded-lg border border-[var(--line-color)] bg-black">
                  <img class="h-full w-full object-cover" :src="form.coverUrl" />
                  <div class="absolute right-0 bottom-0 rounded-tl-lg bg-blue-500 px-1.5 py-0.5 text-xs text-white">
                    当前封面
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <n-upload accept="image/*" :show-file-list="false" @change="handleUploadCover">
                    <n-button size="small" secondary>
                      <template #icon><i-mdi-image-plus /></template>
                      上传图片
                    </n-button>
                  </n-upload>

                  <n-button
                    size="small"
                    secondary
                    :disabled="!hasVideoSource"
                    :loading="isGenerating"
                    @click="triggerFrameExtract">
                    <template #icon><i-mdi-filmstrip /></template>
                    从视频提取
                  </n-button>
                </div>
              </div>

              <n-collapse-transition :show="showFrameSelector">
                <div class="rounded-lg border border-[var(--line-color)] bg-[var(--bg-setting-item)] p-3">
                  <div class="mb-2 flex justify-between text-xs text-[var(--user-text-color)]">
                    <span>点击选择一帧作为封面</span>
                    <span v-if="isGenerating">生成中...</span>
                  </div>
                  <n-scrollbar x-scrollable class="pb-2">
                    <div class="flex min-w-max gap-2">
                      <div
                        v-for="(frame, index) in frames"
                        class="relative aspect-video w-32 cursor-pointer rounded border-2 transition-all hover:border-blue-400"
                        :key="index"
                        :class="form.coverUrl === frame ? 'border-blue-500' : 'border-transparent'"
                        @click="form.coverUrl = frame">
                        <img class="h-full w-full object-cover" :src="frame" />
                        <div v-if="form.coverUrl === frame" class="absolute inset-0 flex-center bg-blue-500/20">
                          <i-mdi-check class="text-2xl text-white drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  </n-scrollbar>
                </div>
              </n-collapse-transition>
            </div>
          </n-form-item>

          <n-form-item label="源文件">
            <div class="flex w-full flex-col gap-2">
              <div
                class="box-border flex w-full items-center justify-between overflow-hidden rounded border border-[var(--line-color)] bg-[var(--bg-setting-item)] p-3">
                <div class="mr-4 flex w-0 flex-1 items-center gap-2 text-sm text-[var(--text-color)]">
                  <i-mdi-file-video-outline class="flex-shrink-0 text-lg text-blue-500" />
                  <span class="truncate" :title="videoFileName">{{ videoFileName }}</span>
                </div>

                <div class="flex flex-shrink-0 items-center gap-2">
                  <n-tooltip trigger="hover" v-if="!newVideoFile">
                    <template #trigger>
                      <n-button
                        size="tiny"
                        secondary
                        circle
                        :loading="isDownloading"
                        :disabled="isDownloading || !form.videoUrl"
                        @click="handleDownload">
                        <template #icon>
                          <span v-if="isDownloading" class="text-[10px]">{{ downloadProgress }}</span>
                          <i-mdi-download v-else />
                        </template>
                      </n-button>
                    </template>
                    {{ !form.videoUrl ? "无下载地址" : isDownloading ? `下载中 ${downloadProgress}%` : "下载源文件" }}
                  </n-tooltip>

                  <n-upload
                    accept="video/*"
                    class="block w-auto"
                    :show-file-list="false"
                    :max="1"
                    @change="handleReplaceVideo">
                    <n-button size="tiny" type="primary" ghost>替换源文件</n-button>
                  </n-upload>
                </div>
              </div>

              <span v-if="newVideoFile" class="text-xs text-orange-500">* 已选择新视频，保存后生效。</span>
            </div>
          </n-form-item>

          <n-form-item label="视频状态">
            <div class="flex-y-center gap-4">
              <n-tag :type="statusTagType" :bordered="false">{{ statusText }}</n-tag>

              <n-popconfirm v-if="form.status !== 'auditing'" @positive-click="toggleStatus">
                <template #trigger>
                  <n-button size="small" secondary :type="form.status === 'offline' ? 'success' : 'error'">
                    {{ form.status === "offline" ? "申请上架" : "下架视频" }}
                  </n-button>
                </template>
                {{ form.status === "offline" ? "确定要重新上架该视频吗？" : "下架后视频将不可见，确定操作？" }}
              </n-popconfirm>
            </div>
          </n-form-item>
        </n-form>
      </n-scrollbar>
      <template #footer>
        <div class="flex justify-end gap-3 pt-2">
          <n-button @click="close">取消</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">保存修改</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { save } from "@tauri-apps/plugin-dialog";
import { UploadFileInfo, type TagProps } from "naive-ui";

import { useDownload } from "@/hooks/useDownload";
import { useVideoFrame } from "@/hooks/useVideoFrame";

const { frames, isGenerating, generateFrames, clearFrames } = useVideoFrame();
const { downloadFile, isDownloading, process: downloadProgress, onLoaded } = useDownload();

const props = defineProps<{
  show: boolean;
  videoData: VideoItem | null;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  save: [data: VideoItem];
}>();

interface VideoItem {
  key: string;
  title: string;
  coverUrl: string;
  createTime: string;
  status: "published" | "auditing" | "offline";
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  fileName?: string;
  description?: string;
  videoUrl?: string;
}

const statusMap: Record<string, { type: TagProps["type"]; text: string }> = {
  published: { type: "success", text: "已发布" },
  auditing: { type: "warning", text: "审核中" },
  offline: { type: "error", text: "已下架" }
};

// 表单数据
const form = ref<VideoItem>({} as VideoItem);
const newVideoFile = ref<File | null>(null);
const showFrameSelector = ref(false);
const saving = ref(false);

// 视频源文件名展示
const videoFileName = computed(() => {
  if (newVideoFile.value) return newVideoFile.value.name;
  return form.value.fileName || "原视频文件.mp4";
});

// 是否有可用的视频源来提取帧
const hasVideoSource = computed(() => {
  return !!newVideoFile.value || !!form.value.videoUrl;
});

const statusTagType = computed((): TagProps["type"] => {
  return statusMap[form.value.status]?.type || "default";
});

const statusText = computed(() => statusMap[form.value.status]?.text || "未知");

// 弹窗显示控制
const dialogVisible = computed({
  get: () => props.show,
  set: (val) => {
    if (!val) reset();
    emit("update:show", val);
  }
});

/** 处理视频下载 */
const handleDownload = async () => {
  if (!form.value.videoUrl) {
    window.$message.warning("当前视频无下载地址");
    return;
  }

  try {
    const savePath = await save({
      defaultPath: form.value.fileName || `video_${Date.now()}.mp4`,
      filters: [{ name: "Video", extensions: ["mp4", "mov", "mkv"] }]
    });

    if (savePath) {
      await downloadFile(form.value.videoUrl, savePath, null as any);
      window.$message.loading("开始下载...");
    }
  } catch (error) {
    console.error("下载出错:", error);
    window.$message.error("无法启动下载");
  }
};

/** 上传图片封面 */
const handleUploadCover = (data: { file: UploadFileInfo }) => {
  const file = data.file.file;
  if (file) {
    form.value.coverUrl = URL.createObjectURL(file);
    showFrameSelector.value = false;
  }
};

/**
 * 替换视频源文件
 * @param data 上传的视频文件
 */
const handleReplaceVideo = (data: { file: UploadFileInfo }) => {
  const file = data.file.file;
  if (file) {
    newVideoFile.value = file;
    clearFrames();
    showFrameSelector.value = false;
    window.$message.success("视频源已替换，您可以点击“从视频提取”来生成新封面");
  }
};

/** 触发提取帧 */
const triggerFrameExtract = async () => {
  showFrameSelector.value = true;

  if (newVideoFile.value) {
    await generateFrames(newVideoFile.value, 8);
  } else if (form.value.videoUrl) {
    window.$message.info("暂只支持从新上传的视频中提取封面");
  } else {
    // 既没有新文件也没有 url（比如模拟数据情况）
    window.$message.warning("没有可用的视频源来提取帧");
  }
};

/** 切换上下架状态 */
const toggleStatus = () => {
  if (form.value.status === "published") {
    form.value.status = "offline";
    window.$message.warning("视频已标记为下架状态，保存后生效");
  } else if (form.value.status === "offline") {
    form.value.status = "published";
    window.$message.success("视频已标记为上架状态，保存后生效");
  }
};

/** 保存视频信息 */
const handleSave = async () => {
  saving.value = true;

  await new Promise((resolve) => setTimeout(resolve, 800));

  if (newVideoFile.value) {
    form.value.fileName = newVideoFile.value.name;
    if (form.value.status !== "offline") {
      form.value.status = "auditing";
    }
  }
  emit("save", { ...form.value });
  saving.value = false;
  close();
};

/** 关闭弹窗 */
const close = () => {
  dialogVisible.value = false;
};

/** 重置表单数据 */
const reset = () => {
  newVideoFile.value = null;
  showFrameSelector.value = false;
  clearFrames();
};

// 监听下载状态
onLoaded((status) => {
  if (status === "success") {
    window.$message.success("文件下载完成");
  } else {
    window.$message.error("下载失败或已取消");
  }
});

// 监听 props 数据变化初始化表单
watch(
  () => props.videoData,
  (newVal) => {
    if (newVal) {
      // 深拷贝避免影响父组件列表显示
      form.value = JSON.parse(JSON.stringify(newVal));
    }
  },
  { immediate: true }
);
</script>
