<template>
  <div class="flex flex-col max-w-[800px] w-full">
    <!-- 上传的图片展示区域 -->
    <div v-if="uploadedImages.length > 0" class="uploaded-images flex flex-wrap gap-2 m-1">
      <div v-for="(image, index) in uploadedImages" :key="index" class="relative w-15 h-15 rounded-lg overflow-hidden">
        <img :src="image" alt="Uploaded image" class="w-full h-full object-cover" />
        <div
          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black bg-opacity-50 text-white flex items-center justify-center hover:bg-opacity-70"
          @click="removeImage(index)">
          <svg class="size-10px cursor-pointer">
            <use href="#close"></use>
          </svg>
        </div>
      </div>
    </div>

    <!-- 整体包裹容器 -->
    <div v-resize="handleResize" class="input-container flex flex-col bg-white rounded-lg p-2 m-1">
      <!-- 输入框 -->
      <n-input
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

      <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
        <div class="flex items-center gap-3">
          <!-- Attach按钮 -->
          <n-popover class="p-0 bg-transparent select-none" :show-arrow="false" trigger="click">
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
            @click="handleThinkClick">
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
            @click="handleSearchClick">
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
          <div
            class="text-white flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-all duration-200"
            :class="{
              'bg-blue-500': messageText.trim() || uploadedImages.length > 0,
              'bg-blue-400': !(messageText.trim() || uploadedImages.length > 0)
            }"
            :style="{
              border: '1px solid',
              'border-color': messageText.trim() || uploadedImages.length > 0 ? '#3b82f6' : '#d1d5db'
            }"
            title="Send message"
            @click="sendMessage">
            <i-mdi-arrow-up class="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type SelectOption, NEllipsis } from "naive-ui";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";

import { useSettingStore } from "@/stores/setting";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";

defineOptions({ name: "MessageInput" });
const settingStore = useSettingStore();
const { handleScreenshot } = useGlobalShortcut();

// 输入的文本
const messageText = ref("");
// 上传的图片列表
const uploadedImages = ref<string[]>([]);
// 按钮激活状态管理
const isThinkActive = ref(false);
const isSearchActive = ref(false);
// 控制按钮文字显示状态
const showButtonText = ref(true);

// 模型选择相关
const selectedModel = ref("auto");

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
    value: "settings",
    disabled: true
  }
];

// 混合类型消息的内容结构
interface MixedContent {
  text: string;
  images: string[];
}

// 定义emit事件
const emit =
  defineEmits<
    (
      e: "send-message",
      message: { type: "text" | "image" | "mixed"; content: string | string[] | MixedContent }
    ) => void
  >();

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

// 处理菜单点击事件
const handleMenuClick = async (menuItem: string) => {
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
      console.log("Take photo");
      // 这里可以添加拍照功能
      break;
  }
};

/**
 * 打开文件选择对话框，根据 isImage 确定是否为图片选择
 * @param isImage 是否选择图片文件
 */
const selectFiles = async (isImage: boolean) => {
  try {
    const selected = await open({
      multiple: true,
      directory: false,
      filters: isImage ? [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"] }] : undefined
    });

    if (selected) {
      // selected 可能是 string (单选) 或 string[] (多选) 或 null
      const paths = Array.isArray(selected) ? selected : [selected];
      paths.forEach((path) => {
        // 在 Tauri 中显示本地图片，不能直接用路径，
        // 需要用 convertFileSrc 转换为 asset:// 协议的 URL
        const assetUrl = convertFileSrc(path);
        // 实际发送给后端时，你可能需要根据 path 读取文件内容或直接传 path 给 Rust
        console.log("转换后的图片路径:", assetUrl);
        uploadedImages.value.push(assetUrl);
      });
    }
  } catch (err) {
    console.error("Failed to open dialog:", err);
  }
};

// 发送消息
const sendMessage = () => {
  const trimmedText = messageText.value.trim();
  const hasText = !!trimmedText;
  const hasImages = uploadedImages.value.length > 0;

  // 如果同时有文本和图片，发送混合类型消息
  if (hasText && hasImages) {
    emit("send-message", {
      type: "mixed",
      content: {
        text: trimmedText,
        images: [...uploadedImages.value]
      }
    });
    // 清空输入和图片
    messageText.value = "";
    uploadedImages.value = [];
  }
  // 如果只有图片，发送图片消息
  else if (hasImages) {
    emit("send-message", {
      type: "image",
      content: [...uploadedImages.value]
    });
    // 清空上传的图片
    uploadedImages.value = [];
  }
  // 如果只有文本，发送文本消息
  else if (hasText) {
    emit("send-message", {
      type: "text",
      content: trimmedText
    });
    // 清空输入文本
    messageText.value = "";
  }
};

// 移除上传的图片
const removeImage = (index: number) => {
  uploadedImages.value.splice(index, 1);
};

// 处理Search按钮点击
const handleSearchClick = () => {
  console.log("Search button clicked");
  // 切换激活状态
  isSearchActive.value = !isSearchActive.value;
  // 这里可以实现搜索功能
};

// 处理Think按钮点击
const handleThinkClick = () => {
  console.log("Think button clicked");
  // 切换激活状态
  isThinkActive.value = !isThinkActive.value;
  // 这里可以实现深度思考功能
};

// 处理Voice按钮点击
const handleVoiceClick = () => {
  console.log("Voice button clicked");
  // 这里可以实现语音消息功能
};

// 监听容器宽度变化的回调函数
const handleResize = ({ width }: any) => {
  showButtonText.value = width >= 588;
};
</script>

<style scoped>
.input-container {
  border: 1px solid #707070;
}

.uploaded-images {
  width: calc(100% - 16px);
  flex-wrap: wrap;
}
</style>
