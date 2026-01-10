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
    <div class="input-container flex flex-col bg-white rounded-lg p-2 m-1">
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

      <!-- 按钮区域 - 下方 -->
      <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
        <!-- 左侧按钮组 - 左对齐 -->
        <div class="flex items-center gap-3">
          <!-- Attach按钮 -->
          <n-popover class="p-0 bg-transparent select-none" :show-arrow="false" trigger="click">
            <template #trigger>
              <button
                class="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200"
                title="Attach file">
                <i-mdi-paperclip class="w-4 h-4" />
                <span>Attach</span>
              </button>
            </template>
            <!-- 弹出菜单内容 -->
            <div class="menu-list space-y-1">
              <!-- Upload file -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('file')">
                <i-mdi-file-upload-outline class="w-4 h-4" />
                <span>Upload file</span>
              </div>
              <!-- Upload photo -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('photo')">
                <i-mdi-image-outline class="w-4 h-4" />
                <span>Upload photo</span>
              </div>
              <!-- Take screenshot -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('screenshot')">
                <i-mdi-camera class="w-4 h-4" />
                <span>Take screenshot</span>
              </div>
              <!-- Take photo -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('camera')">
                <i-mdi-camera-plus class="w-4 h-4" />
                <span>Take photo</span>
              </div>
            </div>
          </n-popover>
          <!-- 文件输入框 -->
          <input ref="fileInput" type="file" accept="*/*" multiple class="hidden" @change="handleFileChange" />
          <input ref="photoInput" type="file" accept="image/*" multiple class="hidden" @change="handleFileChange" />

          <!-- Search按钮 -->
          <button
            class="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200"
            title="Search"
            @click="handleSearchClick">
            <i-mdi-magnify class="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>

        <!-- 右侧Voice按钮 - 右对齐 -->
        <button
          class="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200"
          title="Voice message"
          @click="handleVoiceClick">
          <i-mdi-microphone-outline class="w-4 h-4" />
          <span>Voice</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义组件名称
// defineOptions({ name: 'MessageInput' });

// 输入的文本
const messageText = ref("");
// 上传的图片列表
const uploadedImages = ref<string[]>([]);
// 文件输入框引用
const fileInput = ref<HTMLInputElement | null>(null);
// 图片输入框引用
const photoInput = ref<HTMLInputElement | null>(null);

// 定义emit事件
const emit =
  defineEmits<(e: "send-message", message: { type: "text" | "image"; content: string | string[] }) => void>();

// 处理Enter键
const handleEnterKey = (e: KeyboardEvent) => {
  // 如果按下了Shift键，则换行
  if (e.shiftKey) {
    return;
  }
  // 否则发送消息
  e.preventDefault();
  sendMessage();
};

// 处理菜单点击事件
const handleMenuClick = (menuItem: string) => {
  switch (menuItem) {
    case "file":
      fileInput.value?.click();
      break;
    case "photo":
      photoInput.value?.click();
      break;
    case "screenshot":
      console.log("Take screenshot");
      // 这里可以添加截图功能
      break;
    case "camera":
      console.log("Take photo");
      // 这里可以添加拍照功能
      break;
  }
};

// 发送消息
const sendMessage = () => {
  const trimmedText = messageText.value.trim();

  // 如果有上传的图片，发送图片消息
  if (uploadedImages.value.length > 0) {
    emit("send-message", {
      type: "image",
      content: [...uploadedImages.value]
    });
    // 清空上传的图片
    uploadedImages.value = [];
  }
  // 如果有输入文本，发送文本消息
  else if (trimmedText) {
    emit("send-message", {
      type: "text",
      content: trimmedText
    });
    // 清空输入文本
    messageText.value = "";
  }
};

// 处理文件选择
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;

  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result as string;
        uploadedImages.value.push(result);
      };

      reader.readAsDataURL(file);
    }

    // 清空文件输入
    target.value = "";
  }
};

// 移除上传的图片
const removeImage = (index: number) => {
  uploadedImages.value.splice(index, 1);
};

// 处理Search按钮点击
const handleSearchClick = () => {
  console.log("Search button clicked");
  // 这里可以实现搜索功能
};

// 处理Voice按钮点击
const handleVoiceClick = () => {
  console.log("Voice button clicked");
  // 这里可以实现语音消息功能
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
