<template>
  <div class="flex flex-col max-w-[800px] w-full min-w-0">
    <div v-if="attachments.length > 0" class="flex flex-wrap gap-2 m-1 p-1 select-none w-[calc(100%-16px)]">
      <div v-for="(item, index) in attachments" :key="index" class="relative flex-shrink-0 group cursor-default">
        <div
          v-if="item.type === 'image'"
          class="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img :src="item.previewUrl" alt="img" class="w-full h-full object-cover" />
        </div>

        <div
          v-else
          class="w-16 h-16 bg-white rounded-lg border border-gray-200 flex-center flex-col gap-1 shadow-sm hover:shadow-md transition-shadow select-none cursor-default"
          :title="item.name">
          <span class="text-sm text-gray-700 font-medium w-full truncate text-center">
            {{ item.name }}
          </span>

          <div class="flex-center mt-1 gap-1 w-full opacity-80">
            <img
              :src="`/file/${getFileSuffix(item.name || '')}.svg`"
              :alt="getFileSuffix(item.name || '')"
              class="w-5 h-5 object-contain flex-shrink-0" />

            <span class="text-[10px] text-gray-400 uppercase font-bold truncate max-w-[2rem]">
              {{ getFileSuffix(item.name) }}
            </span>
          </div>
        </div>

        <div
          class="absolute top-[-4px] right-[-4px] w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors shadow-sm z-10 opacity-0 group-hover:opacity-100"
          @click="removeAttachment(index)">
          <i-mdi-close class="w-3 h-3" />
        </div>
      </div>
    </div>

    <!-- 整体包裹容器 -->
    <div v-resize="handleResize" class="input-container flex flex-col bg-white rounded-lg p-2 m-1">
      <!-- 输入框 -->
      <n-input
        v-if="!isVoiceMode"
        v-model:value="messageText"
        type="textarea"
        placeholder="Ask anything"
        :min-height="40"
        :max-height="120"
        :autosize="{ minRows: 1, maxRows: 5 }"
        class="w-full"
        @keydown.enter="handleEnterKey"
        :bordered="false"
        :show-count="false" />

      <div v-if="!isVoiceMode" class="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
        <div class="flex items-center gap-3">
          <!-- Attach按钮 -->
          <n-popover
            class="p-0 bg-transparent select-none"
            :show-arrow="false"
            trigger="click"
            v-model:show="showAttachPopover">
            <template #trigger>
              <div
                class="flex items-center gap-1 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-full cursor-pointer"
                style="border: 1px solid #d1d5db"
                title="Attach file">
                <i-mdi-paperclip class="w-4 h-4" />
                <span v-if="showButtonText">Attach</span>
              </div>
            </template>
            <!-- 弹出菜单内容 -->
            <div class="menu-list space-y-1">
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('file')">
                <i-mdi-file-upload-outline class="w-4 h-4" />
                <span>Upload file</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('photo')">
                <i-mdi-image-outline class="w-4 h-4" />
                <span>Upload photo</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('screenshot')">
                <i-mdi-camera class="w-4 h-4" />
                <span>Take screenshot</span>
              </div>
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('camera')">
                <i-mdi-camera-plus class="w-4 h-4" />
                <span>Take photo</span>
              </div>
            </div>
          </n-popover>

          <!-- 模型选择器 -->
          <div class="relative">
            <n-select
              v-model:value="selectedModel"
              :options="modelOptions"
              placeholder="auto"
              class="w-32"
              @update:value="handleModelChange"
              :render-label="renderLabel" />
          </div>

          <!-- Think按钮 -->
          <div
            class="flex items-center gap-1 px-4 py-1.5 text-sm hover:bg-blue-50 rounded-full cursor-pointer transition-all duration-200"
            :class="{
              'text-blue-500 bg-blue-50': isThinkActive,
              'text-gray-600 bg-white': !isThinkActive
            }"
            :style="{
              border: '1px solid',
              'border-color': isThinkActive ? '#3b82f6' : '#d1d5db'
            }"
            title="Think"
            @click="isThinkActive = !isThinkActive">
            <i-mdi-lightbulb-outline class="w-4 h-4" />
            <span v-if="showButtonText">Think</span>
          </div>

          <!-- Search按钮 -->
          <div
            class="flex items-center gap-1 px-4 py-1.5 text-sm hover:bg-blue-50 rounded-full cursor-pointer transition-all duration-200"
            :class="{
              'text-blue-500 bg-blue-50': isSearchActive,
              'text-gray-600 bg-white': !isSearchActive
            }"
            :style="{
              border: '1px solid',
              'border-color': isSearchActive ? '#3b82f6' : '#d1d5db'
            }"
            title="Search"
            @click="isSearchActive = !isSearchActive">
            <i-mdi-magnify class="w-4 h-4" />
            <span v-if="showButtonText">Search</span>
          </div>
        </div>

        <!-- 右侧按钮组 -->
        <div class="flex items-center gap-3">
          <!-- Voice按钮 -->
          <div
            class="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
            style="border: 1px solid #d1d5db"
            title="Voice message"
            @click="handleVoiceClick">
            <i-mdi-microphone-outline class="w-4 h-4" />
          </div>

          <!-- 发送按钮 -->
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
import { convertFileSrc } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { MittEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting";
import { useMitt } from "@/hooks/useMitt";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { UploadFile } from "@/utils/FileUtil";
import { getFileSuffix } from "@/utils/FormattingUtils";

defineOptions({ name: "MessageInput" });
const settingStore = useSettingStore();
const { handleScreenshot } = useGlobalShortcut();
const appWindow = WebviewWindow.getCurrent();

interface Attachment {
  type: "image" | "file";
  path: string; // 原始文件路径 (用于发送)
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

// 模型数据结构
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
  {
    type: "group",
    label: "音频",
    key: "audio-models",
    children: [
      { label: "whisper-1", value: "whisper-1" },
      { label: "elevenlabs", value: "elevenlabs" }
    ]
  },
  {
    type: "group",
    label: "视频",
    key: "video-models",
    children: [
      { label: "runway-gen-3", value: "runway-gen-3" },
      { label: "pika-labs", value: "pika-labs" }
    ]
  },
  {
    label: "前往设置添加模型",
    value: "settings"
  }
];

// 输入的文本
const messageText = ref("");
const attachments = ref<Attachment[]>([]);
// 按钮激活状态管理
const isThinkActive = ref(false);
const isSearchActive = ref(false);
const showAttachPopover = ref(false);
// 控制按钮文字显示状态
const showButtonText = ref(true);
// 模型选择相关
const selectedModel = ref("auto");
// 拍照相关状态
const showCameraModal = ref(false);
// 录音模式状态
const isVoiceMode = ref(false);

const isBtnDisabled = computed(() => {
  if (props.status === "loading") return true;
  if (props.status === "streaming") return false;
  return !messageText.value.trim() && attachments.value.length === 0;
});

const props = withDefaults(defineProps<Props>(), {
  status: "normal"
});

// 定义emit事件
const emit =
  defineEmits<
    (
      e: "send-message",
      message: { type: "text" | "image" | "mixed"; content: string | string[] | MixedContent }
    ) => void
  >();

/**
 * 渲染选择选项的标签，支持超出部分省略号显示
 * @param option 选择选项对象
 * @returns 渲染后的标签元素
 */
const renderLabel = (option: SelectOption) => {
  return h(
    NEllipsis,
    {
      tooltip: {
        keepAliveOnHover: false
      },
      style: {
        maxWidth: "100%"
      }
    },
    { default: () => option.label as string }
  );
};

// 处理模型选择变化
const handleModelChange = (value: string) => {
  console.log("Selected model:", value);
  selectedModel.value = value;
};

// 处理Enter键
const handleEnterKey = (e: KeyboardEvent) => {
  const sendKey = settingStore.chat.sendKey;
  if ((sendKey === "Enter" && !e.shiftKey) || (sendKey === "Shift+Enter" && e.shiftKey)) {
    e.preventDefault();
    sendMessage();
  }
};

const sendVoiceDirect = (voiceData: any) => {
  console.log(voiceData);
};

const handleVoiceCancel = () => {
  isVoiceMode.value = false;
};

const handleCameraConfirm = (base64Photo: string) => {
  if (attachments.value.length >= 6) {
    window.$message.warning("最多只能上传6个文件");
    return;
  }
  attachments.value.push({
    type: "image",
    path: base64Photo, // Base64 字符串直接作为路径/内容
    previewUrl: base64Photo,
    name: `photo_${Date.now()}.png`
  });
};

// 处理菜单点击事件
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
 * 打开文件选择对话框，根据 isImage 确定是否为图片选择
 * @param isImage 是否选择图片文件
 */
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
        // 截取前面的文件
        paths.length = remainingSlots;
      }
      paths.forEach((path) => {
        // 获取文件名
        // 注意：Windows路径可能是反斜杠，Mac/Linux是正斜杠，这里做个简单兼容处理
        const name = path.split(/[\\/]/).pop() || "unknown";

        // 判断是否为图片 (如果不是强制图片模式，则通过后缀判断)
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

// 发送消息
const sendMessage = () => {
  if (isBtnDisabled.value) return;
  const text = messageText.value.trim();
  // 分离图片和文件
  const imagePaths = attachments.value.filter((item) => item.type === "image").map((item) => item.path);
  const filePaths = attachments.value.filter((item) => item.type === "file").map((item) => item.path);
  let msgType: "text" | "image" | "mixed" | "file" = "text";
  // 构造 content
  let msgContent: string | string[] | MixedContent = text;
  const hasAttachments = imagePaths.length > 0 || filePaths.length > 0;
  if (hasAttachments && text) {
    msgType = "mixed";
    msgContent = {
      text: text,
      images: imagePaths,
      files: filePaths
    };
  } else if (imagePaths.length > 0 && filePaths.length === 0) {
    msgType = "image";
    msgContent = imagePaths;
  } else if (filePaths.length > 0 && imagePaths.length === 0 && !text) {
    // 如果只有文件且没文字
    msgType = "mixed";
    msgContent = { text: "", images: [], files: filePaths };
  } else {
    // 兜底混合
    msgType = "mixed";
    msgContent = {
      text: text,
      images: imagePaths,
      files: filePaths
    };
  }
  if (!hasAttachments && text) {
    msgType = "text";
    msgContent = text;
  }
  emit("send-message", {
    type: msgType as any,
    content: msgContent
  });

  // 重置
  messageText.value = "";
  attachments.value = [];
};

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1);
};

// 处理Voice按钮点击
const handleVoiceClick = () => {
  console.log("Voice button clicked");
  isVoiceMode.value = true;
};

// 监听容器宽度变化的回调函数
const handleResize = ({ width }: any) => {
  showButtonText.value = width >= 588;
};

// 处理全局拖拽文件
const handleGlobalFilesDrop = async (files: UploadFile[]) => {
  console.log("处理全局拖拽文件:", files);
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
    let path = ""; // 这里的 path 将作为附件的标识
    let isImage = false;
    let previewUrl: string | undefined;
    // 判断是否为 PathUploadFile (Tauri 系统拖拽)
    if ("kind" in file && file.kind === "path") {
      name = file.name;
      path = file.path;
      // 通过后缀名或 type 字段粗略判断是否为图片
      isImage = /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(name) || file.type.startsWith("image/");
      if (isImage) {
        //如果是系统路径，必须用 convertFileSrc 转换才能显示预览
        previewUrl = convertFileSrc(path);
      }
    }
    // 判断是否为标准 File 对象 (浏览器内部拖拽)
    else if (file instanceof File) {
      name = file.name;
      isImage = file.type.startsWith("image/");
      // 对于 File 对象，生成临时的 blob: URL 用于预览
      // 注意：发送消息时，如果是 blob URL，后端 rust 无法直接读取，
      const blobUrl = URL.createObjectURL(file);
      path = blobUrl; // 暂时用 blobUrl 作为 path 占位
      if (isImage) {
        previewUrl = blobUrl;
      }
    }
    // 推送到 attachments 数组
    attachments.value.push({
      type: isImage ? "image" : "file",
      path: path,
      previewUrl: previewUrl,
      name: name
    });
  });
};

onMounted(() => {
  // 监听全局文件拖拽
  useMitt.on(MittEnum.GLOBAL_FILES_DROP, handleGlobalFilesDrop);

  // 监听截图事件
  appWindow.listen("screenshot", async (e: any) => {
    if (attachments.value.length >= 6) {
      window.$message.warning("最多只能上传6个文件");
      return;
    }
    try {
      // 1. 从 ArrayBuffer 重建 Blob
      const buffer = new Uint8Array(e.payload.buffer);
      const blob = new Blob([buffer], { type: e.payload.mimeType });
      const file = new File([blob], "screenshot.png", { type: e.payload.mimeType });
      // 2. 生成预览地址
      const url = URL.createObjectURL(file);
      // 3. 推送到新的 attachments 数组中
      attachments.value.push({
        type: "image",
        path: url,
        previewUrl: url,
        name: `Screenshot_${new Date().getTime()}.png` // 给一个唯一的文件名
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
  border: 1px solid #707070;
}
</style>
