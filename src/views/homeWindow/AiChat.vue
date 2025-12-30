<template>
  <div class="h-[calc(100%-24px)] flex flex-row bg-gray-50 select-none">
    <!-- 左侧面板 -->
    <div
      :class="[
        'transition-all duration-300 ease-in-out',
        isHistoryCollapsed
          ? 'w-[55px] bg-white border-r border-gray-200'
          : 'w-[20%] min-w-[200px] bg-white border-r border-gray-200'
      ]">
      <chat-history-list
        :active-chat-id="activeChatId"
        :is-collapsed="isHistoryCollapsed"
        @new-chat="handleNewChat"
        @select-chat="handleSelectChat"
        @rename-chat="handleRenameChat"
        @share-chat="handleShareChat"
        @delete-chat="handleDeleteChat"
        @clear-all="handleClearAll"
        @toggle-collapse="handleToggleCollapse" />
    </div>

    <!-- 中间聊天区域 -->
    <div
      :class="[
        'w-[80%] lg:w-[60%] flex flex-col transition-all duration-300 ease-in-out',
        isHistoryCollapsed ? 'w-[calc(100%-55px)] lg:w-[calc(100%-55px)]' : ''
      ]">
      <!-- 聊天记录区域 - 自动填充剩余空间 -->
      <div
        class="chat-messages flex-1 overflow-y-auto flex justify-center scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div class="w-full max-w-[800px] p-4">
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

    <!-- 右侧面板 -->
    <div
      class="w-0 lg:w-[20%] bg-white border-l border-gray-200 overflow-hidden transition-all duration-300 ease-in-out">
      <!-- 右侧面板内容（占位） -->
      <div class="p-4 text-center text-gray-500">右侧面板</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatHistoryList from "../../components/home/ChatHistoryList.vue";
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

// 激活的聊天ID
const activeChatId = ref<string>("1");

// 历史记录是否折叠
const isHistoryCollapsed = ref<boolean>(false);

// 模拟聊天消息数据
const messages = ref<Message[]>([]);

// 处理折叠/展开历史记录
const handleToggleCollapse = () => {
  isHistoryCollapsed.value = !isHistoryCollapsed.value;
};

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

// 处理新建对话
const handleNewChat = () => {
  console.log("New chat clicked");
  // 后续可以实现新建对话的逻辑
};

// 处理选择对话
const handleSelectChat = (id: string) => {
  console.log("Select chat:", id);
  activeChatId.value = id;
  // 后续可以实现加载对话内容的逻辑
};

// 处理重命名对话
const handleRenameChat = (id: string) => {
  console.log("Rename chat:", id);
  // 后续可以实现重命名对话的逻辑
};

// 处理分享对话
const handleShareChat = (id: string) => {
  console.log("Share chat:", id);
  // 后续可以实现分享对话的逻辑
};

// 处理删除对话
const handleDeleteChat = (id: string) => {
  console.log("Delete chat:", id);
  // 后续可以实现删除对话的逻辑
};

// 处理清空所有历史
const handleClearAll = () => {
  console.log("Clear all history");
  // 后续可以实现清空所有历史的逻辑
};
</script>
