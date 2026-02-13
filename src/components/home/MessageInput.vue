<template>
  <div class="flex flex-col max-w-[800px] w-full min-w-0">
    <div v-if="attachments.length > 0" class="flex flex-wrap gap-2 m-1 p-1 select-none w-[calc(100%-16px)]">
      <div v-for="(item, index) in attachments" :key="index" class="relative flex-shrink-0 group cursor-default">
        <div
          v-if="item.type === 'image'"
          class="w-16 h-16 rounded-lg overflow-hidden border border-[--line-color] bg-[--input-area-bg] cursor-pointer hover:opacity-90 transition-opacity"
          @click="handleAttachmentClick(item)">
          <img :src="item.previewUrl" alt="img" class="w-full h-full object-cover" />
        </div>

        <div
          v-else
          class="w-16 h-16 rounded-lg border border-[--line-color] bg-[--input-area-bg] flex-center flex-col gap-1 shadow-sm hover:shadow-md transition-shadow select-none cursor-pointer hover:bg-[--tray-hover]"
          :title="item.name"
          @click="handleAttachmentClick(item)">
          <span class="text-sm text-[--text-color] font-medium w-full truncate text-center">
            {{ item.name }}
          </span>

          <div class="flex-center mt-1 gap-1 w-full opacity-80">
            <img
              :src="`/file/${getFileSuffix(item.name || '')}.svg`"
              :alt="getFileSuffix(item.name || '')"
              class="w-5 h-5 object-contain flex-shrink-0" />

            <span class="text-[10px] text-[--user-text-color] uppercase font-bold truncate max-w-[2rem]">
              {{ getFileSuffix(item.name) }}
            </span>
          </div>
        </div>

        <div
          class="absolute top-[-4px] right-[-4px] w-5 h-5 rounded-full bg-[--action-bar-icon-color] text-[--tray-bg-color] flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors shadow-sm z-10 opacity-0 group-hover:opacity-100"
          @click.stop="removeAttachment(index)">
          <i-mdi-close class="w-3 h-3" />
        </div>
      </div>
    </div>

    <div v-resize="handleResize" class="input-container flex flex-col bg-[--input-area-bg] rounded-lg p-2 m-1">
      <n-input
        v-if="!isVoiceMode"
        v-model:value="messageText"
        type="textarea"
        placeholder="Ask anything"
        :min-height="40"
        :max-height="120"
        :autosize="{ minRows: 1, maxRows: 5 }"
        class="w-full !bg-transparent"
        @keydown.enter="handleEnterKey"
        :bordered="false"
        :show-count="false" />

      <div v-if="!isVoiceMode" class="flex justify-between items-center mt-3 pt-2 border-t border-[--line-color]">
        <div class="flex items-center gap-3">
          <n-popover
            class="p-0 bg-[--bg-popover] select-none border border-[--line-color]"
            :show-arrow="false"
            trigger="click"
            v-model:show="showAttachPopover">
            <template #trigger>
              <div
                class="flex items-center gap-1 px-4 py-1.5 text-sm text-[--text-color] rounded-full cursor-pointer transition-colors border"
                :class="
                  showAttachPopover
                    ? 'bg-[--btn-secondary-hover]'
                    : 'bg-[--btn-secondary-bg] hover:bg-[--btn-secondary-hover]'
                "
                style="border-color: var(--btn-secondary-border)"
                title="Attach file">
                <i-mdi-paperclip class="w-4 h-4" />
                <span v-if="showButtonText">Attach</span>
              </div>
            </template>
            <div class="menu-list space-y-1 p-1 rounded-md">
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('file')">
                <i-mdi-file-upload-outline class="w-4 h-4" />
                <span>Upload file</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('photo')">
                <i-mdi-image-outline class="w-4 h-4" />
                <span>Upload photo</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('screenshot')">
                <i-mdi-camera class="w-4 h-4" />
                <span>Take screenshot</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('camera')">
                <i-mdi-camera-plus class="w-4 h-4" />
                <span>Take photo</span>
              </div>
            </div>
          </n-popover>

          <div class="relative">
            <n-select
              v-model:value="selectedModel"
              :options="modelOptions"
              placeholder="auto"
              class="w-32"
              @update:value="handleModelChange"
              :render-label="renderLabel" />
          </div>

          <div
            class="flex items-center gap-1 px-4 py-1.5 text-sm rounded-full cursor-pointer transition-all duration-200 border"
            :class="{
              'text-blue-500 bg-blue-500/15 border-blue-500/50': isThinkActive,
              'text-[--text-color] bg-[--btn-secondary-bg] border-[--btn-secondary-border] hover:bg-[--btn-secondary-hover]':
                !isThinkActive
            }"
            title="Think"
            @click="isThinkActive = !isThinkActive">
            <i-mdi-lightbulb-outline class="w-4 h-4" />
            <span v-if="showButtonText">Think</span>
          </div>

          <div
            class="flex items-center gap-1 px-4 py-1.5 text-sm rounded-full cursor-pointer transition-all duration-200 border"
            :class="{
              'text-blue-500 bg-blue-500/15 border-blue-500/50': isSearchActive,
              'text-[--text-color] bg-[--btn-secondary-bg] border-[--btn-secondary-border] hover:bg-[--btn-secondary-hover]':
                !isSearchActive
            }"
            title="Search"
            @click="isSearchActive = !isSearchActive">
            <i-mdi-magnify class="w-4 h-4" />
            <span v-if="showButtonText">Search</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-8 h-8 text-[--text-color] rounded-full cursor-pointer transition-colors border bg-[--btn-secondary-bg] border-[--btn-secondary-border] hover:bg-[--btn-secondary-hover]"
            title="Voice message"
            @click="handleVoiceClick">
            <i-mdi-microphone-outline class="w-4 h-4" />
          </div>

          <n-button circle type="primary" :disabled="isBtnDisabled" @click="sendMessage">
            <template #icon>
              <n-icon>
                <i-material-symbols-arrow-upward v-if="status === 'normal'" class="w-4 h-4" />
                <i-material-symbols-pause v-else-if="status === 'streaming'" class="w-4 h-4" />
                <i-mdi-loading v-else class="w-4 h-4 animate-spin" />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>

      <voice-recorder v-show="isVoiceMode" @cancel="handleVoiceCancel" @send="sendVoiceDirect" />
      <camera-modal v-model:show="showCameraModal" @confirm="handleCameraConfirm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SelectOption, NEllipsis } from "naive-ui";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { MittEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting";
import { useMitt } from "@/hooks/useMitt";
import { useWindow } from "@/hooks/useWindow";
import { useImageViewer } from "@/hooks/useImageViewer";
import { useVideoViewer } from "@/hooks/useVideoViewer";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { UploadFile } from "@/utils/FileUtil";
import { isMobile } from "@/utils/PlatformUtils";
import { getFileSuffix } from "@/utils/FormattingUtils";

defineOptions({ name: "MessageInput" });

const settingStore = useSettingStore();
const { openImageViewer } = useImageViewer();
const { openVideoViewer } = useVideoViewer();
const { handleScreenshot } = useGlobalShortcut();
const { createWebviewWindow } = useWindow();
const appWindow = WebviewWindow.getCurrent();

interface Attachment {
  type: "image" | "file";
  path: string; // 原始文件路径 (用于发送/预览)
  previewUrl?: string; // 图片预览地址 (asset协议)
  name: string; // 文件名
}

interface MixedContent {
  text: string;
  images: string[];
  files: string[];
}

interface Props {
  status?: "loading" | "streaming" | "normal";
}

const messageText = ref("");
const attachments = ref<Attachment[]>([]);
const isThinkActive = ref(false);
const isSearchActive = ref(false);
const showAttachPopover = ref(false);
const showButtonText = ref(true);
const selectedModel = ref("auto");
const showCameraModal = ref(false);
const isVoiceMode = ref(false);

const props = withDefaults(defineProps<Props>(), {
  status: "normal"
});

const emit =
  defineEmits<
    (
      e: "send-message",
      message: { type: "text" | "image" | "mixed"; content: string | string[] | MixedContent }
    ) => void
  >();

const modelOptions = [
  { label: "auto", value: "auto" },
  {
    type: "group",
    label: "文字",
    key: "text-models",
    children: [
      { label: "gpt-4", value: "gpt-4" },
      { label: "gpt-3.5-turbo", value: "gpt-3.5-turbo" },
      { label: "claude-3-opus", value: "claude-3-opus" },
      { label: "claude-3-sonnet", value: "claude-3-sonnet" }
    ]
  },
  {
    type: "group",
    label: "图片",
    key: "image-models",
    children: [
      { label: "dall-e-3", value: "dall-e-3" },
      { label: "midjourney", value: "midjourney" },
      { label: "stable-diffusion", value: "stable-diffusion" }
    ]
  },
  { label: "前往设置添加模型", value: "settings" }
];

const isBtnDisabled = computed(() => {
  if (props.status === "loading") return true;
  if (props.status === "streaming") return false;
  return !messageText.value.trim() && attachments.value.length === 0;
});

const VIDEO_EXTS = ["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v"];

/**
 * 统一处理附件点击 (预览)
 */
const handleAttachmentClick = async (item: Attachment) => {
  // 1. 图片预览
  if (item.type === "image" && item.previewUrl) {
    const imageList = attachments.value
      .filter((att) => att.type === "image" && att.previewUrl)
      .map((att) => att.previewUrl as string);
    openImageViewer(item.previewUrl, imageList);
    return;
  }

  // 2. 视频预览 (新增逻辑)
  const ext = item.name.split(".").pop()?.toLowerCase();
  if (ext && VIDEO_EXTS.includes(ext)) {
    // 提取附件列表中的所有视频路径
    const videoList = attachments.value
      .filter((att) => {
        const e = att.name.split(".").pop()?.toLowerCase();
        return e && VIDEO_EXTS.includes(e);
      })
      .map((att) => att.path);

    // 打开视频预览窗口
    openVideoViewer(item.path, videoList);
    return;
  }

  // 3. 文档预览
  if (item.type === "file") {
    await openDocumentPreview(item);
  }
};

/**
 * 发送窗口 Payload 辅助函数
 */
const sendWindowPayload = async (windowLabel: string, payload: any) => {
  if (isMobile()) {
    return Promise.resolve();
  }
  // 调用后端 Rust 命令暂存 Payload
  return invoke<void>("push_window_payload", {
    label: windowLabel,
    payload
  });
};

/**
 * 打开文档预览窗口
 */
const openDocumentPreview = async (item: Attachment) => {
  const windowLabel = "previewFile";
  const title = "预览文件";
  const suffix = getFileSuffix(item.name);

  // 构造 Payload
  const payload = {
    uid: "current_user_id",
    conversationId: "current_conversation_id",
    resourceFile: {
      fileName: item.name,
      absolutePath: item.path, // 本地绝对路径
      nativePath: item.path,
      url: convertFileSrc(item.path), // asset:// URL
      localExists: true,
      type: {
        ext: suffix,
        mime: ""
      }
    }
  };

  try {
    // 1. 发送 Payload 到 Rust
    await sendWindowPayload(windowLabel, payload);

    // 2. 检查或创建窗口
    const existingWin = await WebviewWindow.getByLabel(windowLabel);
    if (existingWin) {
      console.log("预览窗口已存在，发送更新事件", payload);
      await existingWin.emit("preview-file-update", { payload });
      await existingWin.setFocus();
    } else {
      console.log("创建新预览窗口", payload);
      await createWebviewWindow(title, windowLabel, 900, 720, "", true);
    }
  } catch (error) {
    console.error("打开文档预览失败:", error);
    window.$message.error("无法预览该文件");
  }
};

const selectFiles = async (isImage: boolean) => {
  if (attachments.value.length >= 6) {
    window.$message.warning("最多只能上传6个文件");
    return;
  }
  try {
    const selected = await open({
      multiple: true,
      directory: false,
      filters: isImage
        ? [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "svg", "gif", "bmp"] }]
        : undefined
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      const remainingSlots = 6 - attachments.value.length;
      if (paths.length > remainingSlots) {
        window.$message.warning(`最多只能再上传${remainingSlots}个文件`);
        paths.length = remainingSlots;
      }
      paths.forEach((path) => {
        const name = path.split(/[\\/]/).pop() || "unknown";
        const isImg = isImage || /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(name);
        attachments.value.push({
          type: isImg ? "image" : "file",
          path: path,
          previewUrl: isImg ? convertFileSrc(path) : undefined,
          name: name
        });
      });
    }
  } catch (err) {
    console.error("Failed to open dialog:", err);
  }
};

const handleGlobalFilesDrop = async (files: UploadFile[]) => {
  if (!files || files.length === 0) return;
  const remainingSlots = 6 - attachments.value.length;
  if (remainingSlots <= 0) {
    window.$message.warning("文件数量已达上限");
    return;
  }
  const filesToProcess = files.length > remainingSlots ? files.slice(0, remainingSlots) : files;
  if (files.length > remainingSlots) {
    window.$message.warning(`最多只能再上传${remainingSlots}个文件`);
  }
  filesToProcess.forEach((file) => {
    let name = "";
    let path = "";
    let isImage = false;
    let previewUrl: string | undefined;

    if ("kind" in file && file.kind === "path") {
      name = file.name;
      path = file.path;
      isImage = /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(name) || file.type.startsWith("image/");
      if (isImage) previewUrl = convertFileSrc(path);
    } else if (file instanceof File) {
      name = file.name;
      isImage = file.type.startsWith("image/");
      const blobUrl = URL.createObjectURL(file);
      path = blobUrl;
      if (isImage) previewUrl = blobUrl;
    }
    attachments.value.push({
      type: isImage ? "image" : "file",
      path: path,
      previewUrl: previewUrl,
      name: name
    });
  });
};

const handleCameraConfirm = (base64Photo: string) => {
  if (attachments.value.length >= 6) {
    window.$message.warning("最多只能上传6个文件");
    return;
  }
  attachments.value.push({
    type: "image",
    path: base64Photo,
    previewUrl: base64Photo,
    name: `photo_${Date.now()}.png`
  });
};

const sendMessage = () => {
  if (isBtnDisabled.value) return;
  const text = messageText.value.trim();
  const imagePaths = attachments.value.filter((item) => item.type === "image").map((item) => item.path);
  const filePaths = attachments.value.filter((item) => item.type === "file").map((item) => item.path);

  let msgType: "text" | "image" | "mixed" = "text";
  let msgContent: string | string[] | MixedContent = text;

  const hasAttachments = imagePaths.length > 0 || filePaths.length > 0;

  if (hasAttachments && text) {
    msgType = "mixed";
    msgContent = { text, images: imagePaths, files: filePaths };
  } else if (imagePaths.length > 0 && filePaths.length === 0) {
    msgType = "image";
    msgContent = imagePaths;
  } else if (filePaths.length > 0 && imagePaths.length === 0 && !text) {
    msgType = "mixed"; // 纯文件也走 mixed 结构
    msgContent = { text: "", images: [], files: filePaths };
  } else if (hasAttachments) {
    msgType = "mixed";
    msgContent = { text, images: imagePaths, files: filePaths };
  } else {
    msgType = "text";
    msgContent = text;
  }

  emit("send-message", {
    type: msgType,
    content: msgContent
  });

  messageText.value = "";
  attachments.value = [];
};

const handleResize = ({ width }: { width: number }) => {
  showButtonText.value = width >= 588;
};

const handleMenuClick = async (menuItem: string) => {
  showAttachPopover.value = false;
  switch (menuItem) {
    case "file":
      await selectFiles(false);
      break;
    case "photo":
      await selectFiles(true);
      break;
    case "screenshot":
      handleScreenshot();
      break;
    case "camera":
      showCameraModal.value = true;
      break;
  }
};

const renderLabel = (option: SelectOption) => {
  return h(
    NEllipsis,
    { tooltip: { keepAliveOnHover: false }, style: { maxWidth: "100%" } },
    { default: () => option.label as string }
  );
};

const handleEnterKey = (e: KeyboardEvent) => {
  const sendKey = settingStore.chat.sendKey;
  if ((sendKey === "Enter" && !e.shiftKey) || (sendKey === "Shift+Enter" && e.shiftKey)) {
    e.preventDefault();
    sendMessage();
  }
};

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1);
};

const handleVoiceClick = () => {
  isVoiceMode.value = true;
};
const handleVoiceCancel = () => {
  isVoiceMode.value = false;
};
const sendVoiceDirect = (voiceData: any) => {
  console.log(voiceData);
};
const handleModelChange = (value: string) => {
  selectedModel.value = value;
};

onMounted(() => {
  useMitt.on(MittEnum.GLOBAL_FILES_DROP, handleGlobalFilesDrop);

  appWindow.listen("screenshot", async (e: any) => {
    if (attachments.value.length >= 6) {
      window.$message.warning("最多只能上传6个文件");
      return;
    }
    try {
      const buffer = new Uint8Array(e.payload.buffer);
      const blob = new Blob([buffer], { type: e.payload.mimeType });
      const file = new File([blob], "screenshot.png", { type: e.payload.mimeType });
      const url = URL.createObjectURL(file);
      attachments.value.push({
        type: "image",
        path: url,
        previewUrl: url,
        name: `Screenshot_${new Date().getTime()}.png`
      });
    } catch (error) {
      console.error("处理截图失败:", error);
    }
  });
});

onUnmounted(() => {
  useMitt.off(MittEnum.GLOBAL_FILES_DROP, handleGlobalFilesDrop);
});
</script>

<style scoped>
.input-container {
  /* 使用 CSS 变量适配边框颜色 */
  border: 1px solid var(--line-color);
  transition: border-color 0.3s var(--n-bezier);
}

.input-container:focus-within {
  /* 聚焦时的颜色 */
  border-color: #3b82f6;
}
</style>
