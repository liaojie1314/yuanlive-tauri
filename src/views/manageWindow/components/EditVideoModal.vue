<template>
  <n-modal v-model:show="dialogVisible">
    <n-card
      style="width: 700px; max-width: 95vw"
      title="编辑视频信息"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="bg-[var(--tray-bg-color)] border border-[var(--line-color)] rounded-xl">
      <template #header-extra>
        <n-button text circle class="text-[var(--text-color)] hover:bg-[var(--line-color)]" @click="close">
          <i-mdi-close />
        </n-button>
      </template>
      <n-scrollbar style="max-height: 60vh" class="pr-2">
        <n-form ref="formRef" :model="form" label-placement="left" label-width="80px" class="mt-2">
          <n-form-item label="视频标题">
            <n-input
              v-model:value="form.title"
              placeholder="请输入视频标题"
              maxlength="50"
              show-count
              class="border-(1px solid #90909080)" />
          </n-form-item>

          <n-form-item label="视频简介">
            <n-input
              type="textarea"
              v-model:value="form.description"
              placeholder="请输入视频简介"
              class="border-(1px solid #90909080)"
              :autosize="{ minRows: 3, maxRows: 5 }" />
          </n-form-item>

          <n-form-item label="视频封面">
            <div class="flex flex-col gap-3 w-full">
              <div class="flex items-end gap-4">
                <div
                  class="w-48 aspect-video rounded-lg overflow-hidden border border-[var(--line-color)] relative group bg-black">
                  <img :src="form.coverUrl" class="w-full h-full object-cover" />
                  <div class="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-tl-lg">
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
                    @click="triggerFrameExtract"
                    :disabled="!hasVideoSource"
                    :loading="isGenerating">
                    <template #icon><i-mdi-filmstrip /></template>
                    从视频提取
                  </n-button>
                </div>
              </div>

              <n-collapse-transition :show="showFrameSelector">
                <div class="bg-[var(--bg-setting-item)] p-3 rounded-lg border border-[var(--line-color)]">
                  <div class="text-xs text-[var(--user-text-color)] mb-2 flex justify-between">
                    <span>点击选择一帧作为封面</span>
                    <span v-if="isGenerating">生成中...</span>
                  </div>
                  <n-scrollbar x-scrollable class="pb-2">
                    <div class="flex gap-2 min-w-max">
                      <div
                        v-for="(frame, index) in frames"
                        :key="index"
                        class="w-32 aspect-video rounded border-2 cursor-pointer transition-all hover:border-blue-400 relative"
                        :class="form.coverUrl === frame ? 'border-blue-500' : 'border-transparent'"
                        @click="form.coverUrl = frame">
                        <img :src="frame" class="w-full h-full object-cover" />
                        <div
                          v-if="form.coverUrl === frame"
                          class="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <i-mdi-check class="text-white text-2xl drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                  </n-scrollbar>
                </div>
              </n-collapse-transition>
            </div>
          </n-form-item>

          <n-form-item label="源文件">
            <div class="w-full flex flex-col gap-2">
              <div
                class="flex items-center justify-between w-full p-3 bg-[var(--bg-setting-item)] rounded border border-[var(--line-color)] overflow-hidden box-border">
                <div class="flex items-center gap-2 text-sm text-[var(--text-color)] flex-1 w-0 mr-4">
                  <i-mdi-file-video-outline class="text-blue-500 text-lg flex-shrink-0" />
                  <span class="truncate" :title="videoFileName">{{ videoFileName }}</span>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  <n-tooltip trigger="hover" v-if="!newVideoFile">
                    <template #trigger>
                      <n-button
                        size="tiny"
                        secondary
                        circle
                        @click="handleDownload"
                        :loading="isDownloading"
                        :disabled="isDownloading || !form.videoUrl">
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
                    :show-file-list="false"
                    @change="handleReplaceVideo"
                    :max="1"
                    class="w-auto block">
                    <n-button size="tiny" type="primary" ghost>替换源文件</n-button>
                  </n-upload>
                </div>
              </div>

              <span class="text-xs text-orange-500" v-if="newVideoFile">* 已选择新视频，保存后生效。</span>
            </div>
          </n-form-item>

          <n-form-item label="视频状态">
            <div class="flex items-center gap-4">
              <n-tag :type="statusTagType" :bordered="false">{{ statusText }}</n-tag>

              <n-popconfirm v-if="form.status !== 'auditing'" @positive-click="toggleStatus">
                <template #trigger>
                  <n-button size="small" :type="form.status === 'offline' ? 'success' : 'error'" secondary>
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
