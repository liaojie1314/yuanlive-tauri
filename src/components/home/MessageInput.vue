<template>
  <div class="flex flex-col max-w-[800px] w-full">
    <!-- 上传的图片展示区域 -->
    <div v-if="uploadedImages.length > 0" class="uploaded-images flex flex-wrap gap-2 p-2">
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
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.61 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
                <span>Attach</span>
              </button>
            </template>
            <!-- 弹出菜单内容 -->
            <div class="menu-list space-y-1">
              <!-- Upload file -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('file')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.61 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
                <span>Upload file</span>
              </div>
              <!-- Upload photo -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('photo')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
                <span>Upload photo</span>
              </div>
              <!-- Take screenshot -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('screenshot')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-5-7H8v-2h8v2z" />
                </svg>
                <span>Take screenshot</span>
              </div>
              <!-- Take photo -->
              <div
                class="menu-item flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md cursor-pointer"
                @click="handleMenuClick('camera')">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0-5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 8c-2.76 0-5 2.24-5 5h10c0-2.76-2.24-5-5-5zm6-11c0-1.1-.9-2-2-2h-1V2c0-.55-.45-1-1-1s-1 .45-1 1v1H9V2c0-.55-.45-1-1-1s-1 .45-1 1v1H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7zm-8 11H7v-2h3v2zm0-4H7v-2h3v2zm0-4H7V7h3v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
                </svg>
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
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <span>Search</span>
          </button>
        </div>

        <!-- 右侧Voice按钮 - 右对齐 -->
        <button
          class="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200"
          title="Voice message"
          @click="handleVoiceClick">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          </svg>
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
  width: 100%;
  flex-wrap: wrap;
}
</style>
