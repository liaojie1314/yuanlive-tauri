<template>
  <div class="h-full flex flex-col bg-gray-50 select-none">
    <!-- 聊天记录区域 - 自动填充剩余空间 -->
    <div class="chat-messages flex-1 overflow-y-auto">
      <div class="h-100px">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message-item mb-4 flex"
          :class="{ 'justify-end': message.isSelf }">
          <!-- 对方消息 -->
          <div v-if="!message.isSelf" class="flex items-start gap-2 max-w-[70%]">
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
              <img :src="message.avatar" :alt="message.sender" class="w-full h-full object-cover" />
            </div>
            <div>
              <div class="text-sm font-medium text-gray-600 mb-1">{{ message.sender }}</div>
              <div class="bg-white rounded-lg p-3 shadow-sm">
                <div v-if="message.type === 'text'" class="text-message">{{ message.content }}</div>
                <div v-else-if="message.type === 'image'" class="image-message">
                  <image-message
                    v-if="typeof message.content === 'string'"
                    :image-url="message.content"
                    @image-click="handleImageClick" />
                  <div v-else class="image-gallery grid grid-cols-2 gap-2">
                    <image-message
                      v-for="(img, imgIndex) in message.content"
                      :key="imgIndex"
                      :image-url="img"
                      :max-width="'small'"
                      @image-click="handleImageClick" />
                  </div>
                </div>
              </div>
              <div class="text-xs text-gray-400 mt-1">{{ message.time }}</div>
            </div>
          </div>

          <!-- 自己消息 -->
          <div v-else class="flex items-end gap-2 max-w-[70%] ml-auto">
            <div>
              <div class="bg-blue-500 text-white rounded-lg p-3 shadow-sm">
                <div v-if="message.type === 'text'" class="text-message">{{ message.content }}</div>
                <div v-else-if="message.type === 'image'">
                  <image-message
                    v-if="typeof message.content === 'string'"
                    :image-url="message.content"
                    @image-click="handleImageClick" />
                  <div v-else class="grid grid-cols-2 gap-2">
                    <image-message
                      v-for="(img, imgIndex) in message.content"
                      :key="imgIndex"
                      :image-url="img"
                      :max-width="'small'"
                      @image-click="handleImageClick" />
                  </div>
                </div>
              </div>
              <div class="text-xs text-gray-400 mt-1 text-right">{{ message.time }}</div>
            </div>
            <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
              <img :src="message.avatar" :alt="message.sender" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息输入区域 - 自适应高度 -->
    <div class="py-1 flex justify-center">
      <message-input @send-message="handleSendMessage" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 消息类型定义
interface Message {
  id: number;
  sender: string;
  content: string | string[];
  type: "text" | "image";
  time: string;
  isSelf: boolean;
  avatar: string;
}

// 模拟聊天消息数据
const messages = ref<Message[]>([]);

// 处理发送消息
const handleSendMessage = (message: { type: "text" | "image"; content: string | string[] }) => {
  const newMessage: Message = {
    id: messages.value.length + 1,
    sender: "我",
    content: message.content,
    type: message.type,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    isSelf: true,
    avatar: "https://picsum.photos/id/1006/100/100"
  };

  messages.value.push(newMessage);
  console.log(newMessage);

  // 模拟AI回复
  setTimeout(() => {
    let aiContent: string | string[];
    let aiType: "text" | "image";

    if (message.type === "image") {
      // 模拟图片回复
      aiContent = "https://picsum.photos/id/1016/600/400";
      aiType = "image";
    } else {
      // 模拟文本回复
      aiContent = "这是一个AI回复。";
      aiType = "text";
    }

    const aiReply: Message = {
      id: messages.value.length + 1,
      sender: "AI助手",
      content: aiContent,
      type: aiType,
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      isSelf: false,
      avatar: "https://picsum.photos/id/1005/100/100"
    };
    messages.value.push(aiReply);
  }, 1000);
};

// 处理图片点击
const handleImageClick = (imageUrl: string) => {
  // 这里可以实现图片放大查看功能
  console.log("Image clicked:", imageUrl);
  // 后续可以集成图片预览组件
};
</script>

<style scoped>
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scrollbar-width: thin;
  scrollbar-color: var(--text-secondary) transparent;
}

.message-item .justify-end {
  justify-content: flex-end;
}

.text-message {
  line-height: 1.5;
  word-break: break-word;
}
</style>
