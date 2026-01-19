<template>
  <div class="h-[calc(100%-24px)] flex flex-row bg-gray-50">
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
        ref="chatMessagesRef"
        class="chat-messages flex-1 overflow-y-auto flex justify-center scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div class="w-full max-w-[1000px] p-4">
          <message-render
            v-for="(message, index) in messages"
            :key="index"
            :message="message"
            @image-click="handleImageClick" />
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
defineOptions({
  name: "AiChat"
});

// 混合类型消息的内容结构
interface MixedContent {
  text: string;
  images: string[];
}

// 消息类型定义
interface Message {
  id: number;
  sender: string;
  content: string | string[] | MixedContent;
  type: "text" | "image" | "mixed";
  time: string;
  isSelf: boolean;
  avatar: string;
  isTyping?: boolean;
  rawContent?: string;
  thinking?: string;
  thinkingTime?: number;
  isThinkingExpanded?: boolean;
  // 思考内容打字机相关字段
  thinkingContent?: string;
  isThinkingTyping?: boolean;
  thinkingRawContent?: string;
}

// 激活的聊天ID
const activeChatId = ref<string>("1");

// 历史记录是否折叠
const isHistoryCollapsed = ref<boolean>(false);

// 模拟聊天消息数据
const messages = ref<Message[]>([]);

// 聊天消息区域引用，用于自动滚动
const chatMessagesRef = ref<HTMLElement | null>(null);

// 处理折叠/展开历史记录
const handleToggleCollapse = () => {
  isHistoryCollapsed.value = !isHistoryCollapsed.value;
};

// 滚动到聊天底部
const scrollToBottom = () => {
  // 使用nextTick确保DOM已经更新
  nextTick(() => {
    if (chatMessagesRef.value) {
      // 确保滚动到最底部
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
};

// 打字机效果函数 - 支持思考内容和消息内容的顺序渲染
const typingEffect = (messageId: number, fullText: string, delay: number = 30, thinkingText: string = "") => {
  const messageIndex = messages.value.findIndex((msg) => msg.id === messageId);
  if (messageIndex === -1) return;

  const message = messages.value[messageIndex];
  // 只处理文本类型消息
  if (message.type !== "text") return;

  // 1. 首先处理思考内容的打字机效果
  const renderThinkingContent = () => {
    if (!thinkingText) {
      // 如果没有思考内容，直接渲染消息内容
      renderMessageContent();
      return;
    }

    // 初始化思考内容状态
    message.thinkingRawContent = thinkingText;
    message.thinkingContent = "";
    message.isThinkingTyping = true;

    let thinkingIndex = 0;
    let lastTime = 0;

    const thinkingAnimation = (timestamp: number) => {
      if (!lastTime || timestamp - lastTime >= delay) {
        if (thinkingIndex < thinkingText.length) {
          // 逐字添加思考内容
          message.thinkingContent = thinkingText.substring(0, thinkingIndex + 1);
          thinkingIndex++;
          lastTime = timestamp;
          // 每次更新内容后滚动到底部
          scrollToBottom();
          requestAnimationFrame(thinkingAnimation);
        } else {
          // 思考内容打字结束
          message.isThinkingTyping = false;
          // 思考内容渲染完成后，开始渲染消息内容
          renderMessageContent();
        }
      } else {
        requestAnimationFrame(thinkingAnimation);
      }
    };

    requestAnimationFrame(thinkingAnimation);
  };

  // 2. 处理消息内容的打字机效果
  const renderMessageContent = () => {
    let currentIndex = 0;
    message.rawContent = fullText;
    message.content = "";
    message.isTyping = true;

    let lastTime = 0;

    const messageAnimation = (timestamp: number) => {
      if (!lastTime || timestamp - lastTime >= delay) {
        if (currentIndex < fullText.length) {
          // 逐字添加消息内容
          message.content = fullText.substring(0, currentIndex + 1);
          currentIndex++;
          lastTime = timestamp;
          // 每次更新内容后滚动到底部
          scrollToBottom();
          requestAnimationFrame(messageAnimation);
        } else {
          // 消息内容打字结束
          message.isTyping = false;
          // 打字结束后滚动到底部
          scrollToBottom();
        }
      } else {
        requestAnimationFrame(messageAnimation);
      }
    };

    requestAnimationFrame(messageAnimation);
  };

  // 开始渲染思考内容
  renderThinkingContent();
};

// 处理发送消息
const handleSendMessage = (message: {
  type: "text" | "image" | "mixed";
  content: string | string[] | { text: string; images: string[] };
}) => {
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
  // 发送消息后滚动到底部
  scrollToBottom();

  // 模拟AI回复
  setTimeout(() => {
    let aiContent: string | string[] | MixedContent;
    let aiType: "text" | "image" | "mixed";

    // 根据用户消息类型生成不同的AI回复
    if (message.type === "image" || message.type === "mixed") {
      // 模拟图片相关回复，使用混合类型回复
      const markdownContent = `这是一个关于图片的**AI回复**。

我看到你发送了图片，我可以：
- 分析图片内容
- 提供相关信息
- 进行图像编辑

\`\`\`javascript
// 图片处理示例
function processImage(imageUrl) {
  console.log("Processing image:", imageUrl);
  // 图像处理逻辑
}
\`\`\``;

      aiContent = {
        text: markdownContent,
        images: ["https://picsum.photos/id/1016/600/400"]
      };
      aiType = "mixed";

      // 模拟思考内容
      const thinkingContent = `我需要分析用户的问题并提供详细的解答。首先，我应该考虑用户可能需要的信息类型，然后组织内容结构，确保回答清晰易懂。

1. 理解问题：用户需要关于大文件分片上传的最佳实践建议
2. 分析选项：
   - Worker：适合处理计算密集型任务，如文件分片和哈希计算
   - rAF：适合与浏览器渲染同步的任务，如动画更新
3. 结论：Worker更适合大文件分片上传，因为它可以避免阻塞主线程，提高页面响应速度。`;

      const aiReply: Message = {
        id: messages.value.length + 1,
        sender: "AI助手",
        content: "", // 初始为空，通过打字机效果填充
        type: "text", // 混合消息的文本部分使用打字机效果
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        isSelf: false,
        avatar: "https://picsum.photos/id/1005/100/100",
        isTyping: false,
        rawContent: markdownContent,
        thinking: thinkingContent,
        thinkingTime: 16,
        isThinkingExpanded: true,
        thinkingContent: "",
        isThinkingTyping: false,
        thinkingRawContent: thinkingContent
      };
      messages.value.push(aiReply);
      // 添加AI回复后滚动到底部
      scrollToBottom();

      // 启动打字机效果 - 传入思考内容，实现顺序渲染
      typingEffect(aiReply.id, markdownContent, 30, thinkingContent);
    } else {
      // 模拟文本回复，使用markdown格式
      const markdownContent = `这是一个**AI回复**。

你可以使用：
- 粗体文本
- 列表项
- 代码块

\`\`\`javascript
console.log("Hello, World!");
\`\`\``;

      aiContent = "";
      aiType = "text";

      // 模拟思考内容
      const thinkingContent = `我需要生成一个关于用户问题的详细回答。首先，我应该理解用户的需求，然后组织内容结构，确保回答清晰、全面且易于理解。

1. 理解用户问题：用户发送了一条文本消息，需要AI生成相关回复
2. 确定回答类型：这是一个普通的文本回复，需要使用Markdown格式增强可读性
3. 组织内容：
   - 提供清晰的标题和段落结构
   - 包含示例代码块
   - 使用列表和强调等Markdown特性
4. 确保回答质量：检查语法、逻辑和信息准确性`;

      const aiReply: Message = {
        id: messages.value.length + 1,
        sender: "AI助手",
        content: aiContent,
        type: aiType,
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        isSelf: false,
        avatar: "https://picsum.photos/id/1005/100/100",
        isTyping: false,
        rawContent: markdownContent,
        thinking: thinkingContent,
        thinkingTime: 12,
        isThinkingExpanded: true,
        thinkingContent: "",
        isThinkingTyping: false,
        thinkingRawContent: thinkingContent
      };
      messages.value.push(aiReply);
      // 添加AI回复后滚动到底部
      scrollToBottom();

      // 启动打字机效果 - 传入思考内容，实现顺序渲染
      typingEffect(aiReply.id, markdownContent, 30, thinkingContent);
    }
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
