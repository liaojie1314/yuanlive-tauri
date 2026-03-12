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
        :placeholder="t('components.messageInput.placeholder')"
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
                :title="t('components.messageInput.attach')">
                <i-mdi-paperclip class="w-4 h-4" />
                <span v-if="showButtonText">{{ t("components.messageInput.attach") }}</span>
              </div>
            </template>
            <div class="menu-list space-y-1 p-1 rounded-md">
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('file')">
                <i-mdi-file-upload-outline class="w-4 h-4" />
                <span>{{ t("components.messageInput.uploadFile") }}</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('photo')">
                <i-mdi-image-outline class="w-4 h-4" />
                <span>{{ t("components.messageInput.uploadPhoto") }}</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('screenshot')">
                <i-mdi-camera class="w-4 h-4" />
                <span>{{ t("components.messageInput.takeScreenshot") }}</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm text-[--text-color] hover:bg-[--tray-hover] rounded-md cursor-pointer transition-colors"
                @click="handleMenuClick('camera')">
                <i-mdi-camera-plus class="w-4 h-4" />
                <span>{{ t("components.messageInput.takePhoto") }}</span>
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
            :title="t('components.messageInput.think')"
            @click="isThinkActive = !isThinkActive">
            <i-mdi-lightbulb-outline class="w-4 h-4" />
            <span v-if="showButtonText">{{ t("components.messageInput.think") }}</span>
          </div>

          <div
            class="flex items-center gap-1 px-4 py-1.5 text-sm rounded-full cursor-pointer transition-all duration-200 border"
            :class="{
              'text-blue-500 bg-blue-500/15 border-blue-500/50': isSearchActive,
              'text-[--text-color] bg-[--btn-secondary-bg] border-[--btn-secondary-border] hover:bg-[--btn-secondary-hover]':
                !isSearchActive
            }"
            :title="t('components.messageInput.search')"
            @click="isSearchActive = !isSearchActive">
            <i-mdi-magnify class="w-4 h-4" />
            <span v-if="showButtonText">{{ t("components.messageInput.search") }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-8 h-8 text-[--text-color] rounded-full cursor-pointer transition-colors border bg-[--btn-secondary-bg] border-[--btn-secondary-border] hover:bg-[--btn-secondary-hover]"
            :title="t('components.messageInput.voiceMessage')"
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
import { useI18n } from "vue-i18n";
import { type SelectOption, NEllipsis } from "naive-ui";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { MittEnum, TauriCommandEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting.ts";
import { useMitt } from "@/hooks/useMitt.ts";
import { useWindow } from "@/hooks/useWindow.ts";
import { useImageViewer } from "@/hooks/useImageViewer.ts";
import { useVideoViewer } from "@/hooks/useVideoViewer.ts";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut.ts";
import { UploadFile } from "@/utils/FileUtil.ts";
import { isMobile } from "@/utils/PlatformUtils.ts";
import { getFileSuffix } from "@/utils/FormattingUtils.ts";

defineOptions({ name: "MessageInput" });

const { t } = useI18n();
const settingStore = useSettingStore();
const { openImageViewer } = useImageViewer();
const { openVideoViewer } = useVideoViewer();
const { handleScreenshot } = useGlobalShortcut();
const { createWebviewWindow } = useWindow();
const appWindow = WebviewWindow.getCurrent();

interface Props {
  status?: "loading" | "streaming" | "normal";
}

const props = withDefaults(defineProps<Props>(), {
  status: "normal"
});

const emit = defineEmits<{
  (e: "send-message", payload: any): void;
  (e: "cancel-stream"): void;
}>();

interface Attachment {
  type: "image" | "file";
  path: string; // 原始文件路径 (用于发送/预览)
  previewUrl?: string; // 图片预览地址 (asset协议)
  name: string; // 文件名
}

const maxAttachments = 6;
const VIDEO_EXTS = ["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v"];

const messageText = ref("");
const attachments = ref<Attachment[]>([]);
const isThinkActive = ref(false);
const isSearchActive = ref(false);
const showAttachPopover = ref(false);
const showButtonText = ref(true);
const selectedModel = ref("auto");
const showCameraModal = ref(false);
const isVoiceMode = ref(false);

const isBtnDisabled = computed(() => {
  if (props.status === "loading") return true;
  if (props.status === "streaming") return false;
  return !messageText.value.trim() && attachments.value.length === 0;
});
const modelOptions = computed(() => [
  { label: t("components.messageInput.modelType.auto"), value: "auto" },
  {
    type: "group",
    label: t("components.messageInput.modelType.text"),
    key: "text-models",
    children: []
  },
  {
    type: "group",
    label: t("components.messageInput.modelType.image"),
    key: "image-models",
    children: []
  },
  {
    type: "group",
    label: t("components.messageInput.modelType.audio"),
    key: "audio-models",
    children: []
  },
  {
    type: "group",
    label: t("components.messageInput.modelType.video"),
    key: "video-models",
    children: []
  },
  { label: t("components.messageInput.goSetting"), value: "settings" }
]);

/**
 * 统一处理附件点击 (预览)
 * @param item 点击的附件项
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
 * @param windowLabel 窗口标签
 * @param payload 要发送的 Payload 数据
 */
const sendWindowPayload = async (windowLabel: string, payload: any) => {
  if (isMobile()) {
    return Promise.resolve();
  }
  // 调用后端 Rust 命令暂存 Payload
  return invoke<void>(TauriCommandEnum.PUSH_WINDOW_PAYLOAD, {
    label: windowLabel,
    payload
  });
};

/**
 * 打开文档预览窗口
 * @param item 要预览的文件附件项
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
    window.$message.error(t("components.messageInput.msg.previewFailed"));
  }
};

/**
 * 选择文件 (图片/文件)
 * @param isImage 是否选择图片文件
 */
const selectFiles = async (isImage: boolean) => {
  if (attachments.value.length >= maxAttachments) {
    window.$message.warning(t("components.messageInput.msg.maxAttachments", { count: maxAttachments }));
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
      const remainingSlots = maxAttachments - attachments.value.length;
      if (paths.length > remainingSlots) {
        window.$message.warning(t("components.messageInput.msg.remainingAttachments", { count: remainingSlots }));
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

/**
 * 全局文件拖放处理
 * @param files 拖放的文件数组
 */
const handleGlobalFilesDrop = async (files: UploadFile[]) => {
  if (!files || files.length === 0) return;
  const remainingSlots = maxAttachments - attachments.value.length;
  if (remainingSlots <= 0) {
    window.$message.warning(t("components.messageInput.msg.fileCountExceeded"));
    return;
  }
  const filesToProcess = files.length > remainingSlots ? files.slice(0, remainingSlots) : files;
  if (files.length > remainingSlots) {
    window.$message.warning(t("components.messageInput.msg.remainingAttachments", { count: remainingSlots }));
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

/**
 * 处理相机确认，添加图片附件
 * @param base64Photo 相机捕获的 base64 图片
 */
const handleCameraConfirm = (base64Photo: string) => {
  if (attachments.value.length >= maxAttachments) {
    window.$message.warning(t("components.messageInput.msg.maxAttachments", { count: maxAttachments }));
    return;
  }
  attachments.value.push({
    type: "image",
    path: base64Photo,
    previewUrl: base64Photo,
    name: `photo_${Date.now()}.png`
  });
};

/** 发送消息 */
const sendMessage = () => {
  // 1. 处理取消生成逻辑
  if (props.status === "streaming" || props.status === "loading") {
    emit("cancel-stream");
    return;
  }
  if (isBtnDisabled.value) return;

  const text = messageText.value.trim();

  // 2. 定义媒体类型检测正则
  // 视频后缀
  const VIDEO_EXT_REGEX = /\.(mp4|avi|mov|mkv|wmv|flv|webm|m4v)$/i;
  // 音频后缀
  const AUDIO_EXT_REGEX = /\.(mp3|wav|ogg|aac|flac|m4a)$/i;

  // 3. 重新分类附件
  const imagePaths: string[] = [];
  const videoPaths: string[] = [];
  const audioPaths: string[] = [];
  const filePaths: string[] = [];

  attachments.value.forEach((item) => {
    // 转换路径
    const assetUrl = item.previewUrl?.startsWith("blob:") ? item.previewUrl : convertFileSrc(item.path);

    if (item.type === "image") {
      imagePaths.push(assetUrl);
    } else {
      // 检查文件类型
      if (VIDEO_EXT_REGEX.test(item.name)) {
        videoPaths.push(assetUrl);
      } else if (AUDIO_EXT_REGEX.test(item.name)) {
        audioPaths.push(assetUrl);
      } else {
        filePaths.push(assetUrl);
      }
    }
  });

  // 4. 构造标准化的混合消息体 (MixedContent)
  let msgContent: any = {
    text: text,
    images: imagePaths.length > 0 ? imagePaths : undefined,
    videos: videoPaths.length > 0 ? videoPaths : undefined,
    audios: audioPaths.length > 0 ? audioPaths : undefined,
    files: filePaths.length > 0 ? filePaths : undefined // 纯文件
  };

  // 5. 简化类型：如果只有纯文本，就不发对象了
  const hasAttachments = imagePaths.length + videoPaths.length + audioPaths.length + filePaths.length > 0;

  if (!hasAttachments && text) {
    msgContent = text;
  }

  // 6. 发送消息
  const finalMessage = {
    type: hasAttachments ? "mixed" : "text",
    content: msgContent,
    options: {
      useReasoning: isThinkActive.value,
      useNetwork: isSearchActive.value
    }
  };

  emit("send-message", finalMessage);

  messageText.value = "";
  attachments.value = [];
};

/**
 * 处理窗口大小变化，动态显示按钮文本
 * @param width 窗口宽度
 */
const handleResize = ({ width }: { width: number }) => {
  showButtonText.value = width >= 588;
};

/**
 * 处理菜单点击事件
 * @param menuItem 点击的菜单项
 */
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

/**
 * 渲染选择选项的标签
 * @param option 选择选项
 * @returns 渲染后的标签元素
 */
const renderLabel = (option: SelectOption) => {
  return h(
    NEllipsis,
    { tooltip: { keepAliveOnHover: false }, style: { maxWidth: "100%" } },
    { default: () => option.label as string }
  );
};

/**
 * 处理键盘事件，触发发送消息
 * @param e 键盘事件对象
 */
const handleEnterKey = (e: KeyboardEvent) => {
  const sendKey = settingStore.chat.sendKey;
  if ((sendKey === "Enter" && !e.shiftKey) || (sendKey === "Shift+Enter" && e.shiftKey)) {
    e.preventDefault();
    sendMessage();
  }
};

/**
 * 删除附件
 * @param index 要删除的附件索引
 */
const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1);
};

/**
 * 处理语音点击事件，切换到语音输入模式
 */
const handleVoiceClick = () => {
  isVoiceMode.value = true;
};

/**
 * 处理语音取消事件，切换到文本输入模式
 */
const handleVoiceCancel = () => {
  isVoiceMode.value = false;
};

/**
 * 直接发送语音数据
 * @param voiceData 语音数据
 */
const sendVoiceDirect = (voiceData: any) => {
  console.log(voiceData);
};

/**
 * 处理模型选择变化事件
 * @param value 选择的模型值
 */
const handleModelChange = (value: string) => {
  if (value === "settings") {
    // TODO: 跳转到模型设置页面
    console.log("跳转到模型设置页面");
    return;
  }
  selectedModel.value = value;
};

/**
 * 处理填充输入框事件
 * @param text 要填充的文本
 */
const handleFillInput = (text: string) => {
  messageText.value = text;
  // 填充后让文本框自动获得焦点 TODO: 是否自动发送
  nextTick(() => {
    const inputEl = document.querySelector(".input-container textarea") as HTMLTextAreaElement;
    if (inputEl) {
      inputEl.focus();
      inputEl.selectionStart = inputEl.value.length;
      inputEl.selectionEnd = inputEl.value.length;
    }
  });
};

useMitt.on(MittEnum.FILL_MESSAGE_INPUT, handleFillInput);

onMounted(() => {
  useMitt.on(MittEnum.GLOBAL_FILES_DROP, handleGlobalFilesDrop);

  appWindow.listen("screenshot", async (e: any) => {
    if (attachments.value.length >= maxAttachments) {
      window.$message.warning(t("components.messageInput.msg.maxAttachments", { count: maxAttachments }));
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
