<template>
  <div class="h-[calc(100%-24px)] flex flex-row w-full overflow-auto">
    <div
      :class="[
        'transition-all duration-300 ease-in-out bg-[--tray-bg-color] border-r border-[--line-color]',
        isHistoryCollapsed ? 'w-[55px]' : 'w-[20%] min-w-[200px]'
      ]">
      <chat-history-list
        :active-chat-id="activeChatId"
        :is-collapsed="isHistoryCollapsed"
        @toggle-collapse="handleToggleCollapse" />
    </div>

    <div
      :class="[
        'w-[80%] lg:w-[60%] flex flex-col transition-all duration-300 ease-in-out min-w-0',
        isHistoryCollapsed ? 'w-[calc(100%-55px)] lg:w-[calc(100%-55px)]' : ''
      ]">
      <n-scrollbar ref="scrollbarRef" class="flex-1">
        <div ref="scrollContentRef" class="flex flex-col items-center w-full">
          <div class="w-full max-w-[1000px]">
            <message-item
              v-for="msg in messages"
              :key="msg.id"
              :message="msg"
              :selection-mode="isMessageSelectionMode"
              :selected="selectedMessageIds.has(msg.id)"
              @enter-multi-select="handleEnterMessageMultiSelect"
              @toggle-select="handleToggleMessageSelect"
              @resend-message="handleResend"
              @copy-message="handleCopy"
              @refresh-message="handleRefresh" />
          </div>
        </div>
      </n-scrollbar>

      <div class="py-1 flex justify-center w-full bg-[--tray-bg-color]">
        <message-input
          v-if="!isMessageSelectionMode"
          :status="chatStatus"
          @send-message="handleSendMessage"
          @cancel-stream="handleCancelAiResponse" />

        <div
          v-else
          class="w-full max-w-[800px] flex items-center justify-between bg-[--input-area-bg] rounded-lg p-4 m-1 border border-[--line-color] shadow-sm transition-all">
          <div class="text-sm font-medium text-[--user-text-color]">
            已选择
            <span class="text-blue-500 mx-1">{{ selectedMessageIds.size }}</span>
            条消息
          </div>

          <div class="flex items-center gap-4">
            <n-button quaternary @click="cancelMessageSelection">取消</n-button>
            <n-button type="error" :disabled="selectedMessageIds.size === 0" @click="handleBatchDeleteMessages">
              删除选中
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-0 lg:w-[20%] bg-[--tray-bg-color] border-l border-[--line-color] overflow-hidden transition-all duration-300 ease-in-out">
      <div class="p-4 text-center text-[--user-text-color]">右侧面板</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScrollbarInst } from "naive-ui";
import type { MessageData } from "@/types/chat";
import { messageCancelStream } from "@/utils/RequestUtils";

defineOptions({ name: "AiChat" });

const chatStatus = ref<"loading" | "streaming" | "normal">("normal");
const activeChatId = ref<string>("1");
const isHistoryCollapsed = ref<boolean>(false);
const scrollbarRef = ref<ScrollbarInst | null>(null);
const scrollContentRef = ref<HTMLElement | null>(null);
const isMessageSelectionMode = ref(false);
const selectedMessageIds = ref<Set<string | number>>(new Set());
const messages = ref<MessageData[]>([]);

// 触发多选模式，并默认选中当前右键的消息
const handleEnterMessageMultiSelect = (id: string | number) => {
  isMessageSelectionMode.value = true;
  selectedMessageIds.value.add(id);
};

// 切换单条消息的选中状态
const handleToggleMessageSelect = (id: string | number) => {
  if (selectedMessageIds.value.has(id)) {
    selectedMessageIds.value.delete(id);
  } else {
    selectedMessageIds.value.add(id);
  }
};

// 取消多选模式
const cancelMessageSelection = () => {
  isMessageSelectionMode.value = false;
  selectedMessageIds.value.clear();
};

// 批量删除选中的消息
const handleBatchDeleteMessages = () => {
  if (selectedMessageIds.value.size === 0) return;

  window.$dialog.warning({
    content: `确定要删除选中的 ${selectedMessageIds.value.size} 条消息吗？`,
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: () => {
      // 从本地列表中移除选中的消息
      messages.value = messages.value.filter((msg) => !selectedMessageIds.value.has(msg.id));
      // TODO: 这里可以调用后端 API 删除数据库中的消息记录

      // 删除完成后退出多选模式
      cancelMessageSelection();
    }
  });
};

const handleToggleCollapse = () => {
  isHistoryCollapsed.value = !isHistoryCollapsed.value;
};

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollbarRef.value && scrollContentRef.value) {
      // scrollContentRef.value.scrollHeight 获取的是内部所有消息叠加的总高度
      scrollbarRef.value.scrollTo({
        top: scrollContentRef.value.scrollHeight
      });
    }
  });
};

// const initTestData = () => {
//   messages.value = [
//     // 1. 用户消息
//     {
//       id: 1,
//       role: "user",
//       sender: "我",
//       avatar: "https://picsum.photos/id/1006/100/100",
//       content: "请给我写一个 Vue3 的计数器组件，并解释一下原理。",
//       time: "10:00"
//     },
//     // 2. AI 消息：带深度思考 + Markdown 代码
//     {
//       id: 2,
//       role: "assistant",
//       sender: "DeepSeek",
//       avatar: "https://picsum.photos/id/1005/100/100",
//       time: "10:01",
//       thinking: `用户想要一个 Vue3 计数器组件。
// 1. 我需要使用 <script setup> 语法。
// 2. 需要引入 ref。
// 3. 需要解释响应式原理。`,
//       thinkingTime: 5,
//       content: `好的，这是一个简单的 **Vue 3 计数器** 示例：

// \`\`\`vue
// <template>
//   <button @click="count++">Count is: {{ count }}</button>
// </template>

// <script setup>
// import { ref } from 'vue';
// const count = ref(0);
// <\/script>
// \`\`\`

// **原理：**
// 使用 \`ref\` 创建响应式数据，Vue 会自动追踪依赖并在数据变化时更新 DOM。`,
//       currentVersion: 2,
//       versionCount: 3
//     },
//     // 3. AI 消息：混合内容 (图文混排)
//     {
//       id: 3,
//       role: "assistant",
//       sender: "AI助手",
//       avatar: "https://picsum.photos/id/1011/100/100",
//       time: "10:05",
//       // 适配器会自动处理这种对象结构
//       content: {
//         text: "这是你要的风景图片，非常壮观：",
//         images: ["https://picsum.photos/id/1018/800/400", "https://picsum.photos/id/1015/800/400"]
//       }
//     },
//     // 4. 测试视频组件
//     {
//       id: 4,
//       role: "assistant",
//       sender: "AI助手",
//       avatar: "https://picsum.photos/id/1005/100/100",
//       time: "10:06",
//       content: {
//         text: "这是一段测试视频（Big Buck Bunny）：",
//         videos: ["https://www.w3schools.com/html/mov_bbb.mp4"]
//       }
//     },

//     // 5. 测试音频组件
//     {
//       id: 5,
//       role: "assistant",
//       sender: "AI助手",
//       avatar: "https://picsum.photos/id/1005/100/100",
//       time: "10:07",
//       content: {
//         text: "这是一段测试音频消息：",
//         audios: ["https://www.w3schools.com/html/horse.mp3"]
//       }
//     }
//   ];
// };

const currentRequestId = ref<string | null>(null); // 记录当前请求 ID 用于取消

// const handleSendMessage = async (payload: {
//   type: string;
//   content: string | any;
//   options: { useReasoning: boolean; useNetwork: boolean };
// }) => {
//   if (chatStatus.value !== "normal") return;

//   // 1. 构造用户消息并推入列表
//   const userMsg: MessageData = {
//     id: Date.now(),
//     role: "user",
//     sender: "我",
//     avatar: "https://picsum.photos/id/1006/100/100",
//     content: payload.content,
//     time: new Date().toLocaleTimeString()
//   };
//   messages.value.push(userMsg);
//   scrollToBottom();

//   // 2. 初始化 AI 响应状态
//   chatStatus.value = "loading";
//   const aiMsgId = Date.now() + 1;
//   const aiMsg = ref<MessageData>({
//     id: aiMsgId,
//     role: "assistant",
//     sender: "AI助手",
//     avatar: "https://picsum.photos/id/1005/100/100",
//     time: new Date().toLocaleTimeString(),
//     thinking: "",
//     content: "",
//     thinkingTime: 0
//   });
//   messages.value.push(aiMsg.value);
//   scrollToBottom();

//   // 提取纯文本内容
//   const textContent = typeof payload.content === "string" ? payload.content : (payload.content as any).text || "";

//   // 3. 发送流式请求
//   try {
//     // 调用接口并记录返回的 Promise 逻辑（如果需要 requestId，需确保接口已返回）
//     // 假设 messageSendStream 内部生成了 requestId 并通过某种方式暴露，
//     // 或者你可以预生成 requestId 传给接口。
//     const requestId = `ai-stream-${Date.now()}`;
//     currentRequestId.value = requestId;

//     await messageSendStream(
//       {
//         conversationId: activeChatId.value,
//         content: textContent,
//         useContext: true,
//         useReasoning: payload.options.useReasoning,
//         useNetwork: payload.options.useNetwork
//       },
//       {
//         onChunk: (chunk: string) => {
//           if (chatStatus.value === "loading") chatStatus.value = "streaming";
//           aiMsg.value.content += chunk;
//         },
//         onDone: (fullContent: string) => {
//           chatStatus.value = "normal";
//           currentRequestId.value = null;
//           console.log("消息：", fullContent);
//         },
//         onError: (error: string) => {
//           chatStatus.value = "normal";
//           currentRequestId.value = null;
//           aiMsg.value.content += `\n\n**请求失败:** ${error}`;
//         }
//       }
//     );
//   } catch (error) {
//     chatStatus.value = "normal";
//     currentRequestId.value = null;
//   }
// };

/**
 * 取消当前 AI 消息生成
 */
const handleCancelAiResponse = async () => {
  if (currentRequestId.value) {
    if (currentRequestId.value) {
      try {
        await messageCancelStream(currentRequestId.value);
      } catch (err) {
        console.error("取消请求失败:", err);
      } finally {
        // 无论后端取消是否成功，前端先恢复状态
        chatStatus.value = "normal";
        currentRequestId.value = null;
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.content += "\n\n*[已停止生成]*";
        }
      }
    } else {
      // 兜底：如果没有请求 ID 但状态不对，也要强行重置
      chatStatus.value = "normal";
    }
  }
};

const handleResend = (data: { id: string | number; content: string }) => {
  // 1. 找到这条消息在列表中的索引
  const index = messages.value.findIndex((m) => m.id === data.id);
  if (index === -1) return;
  // 2. 删除该消息及其之后的所有消息 (重新开始这一段对话)
  // 如果你只想修改这一条而不影响后面的，可以只修改内容，但通常重发意味着逻辑覆盖
  messages.value.splice(index);
  // 3. 调用原有的发送逻辑，传入修改后的内容
  // 假设你的 payload 格式是 { content: { text: string } }
  handleSendMessage({
    type: "text",
    content: data.content,
    options: {
      useReasoning: false, // 可以根据需要获取状态
      useNetwork: false
    }
  });
};

const handleSendMessage = (payload: {
  type: string;
  content: string;
  options: { useReasoning: boolean; useNetwork: boolean };
}) => {
  // 1. 构造用户消息
  const userMsg: MessageData = {
    id: Date.now(),
    role: "user",
    sender: "我",
    avatar: "https://picsum.photos/id/1006/100/100",
    content: payload.content,
    time: new Date().toLocaleTimeString()
  };

  messages.value.push(userMsg);
  scrollToBottom();

  // 2. 模拟 AI 回复
  simulateAiStreamResponse();
};

// 模拟流式输出 (不再需要复杂的 typingEffect，只需更新数据)
// 找到 simulateAiStreamResponse 或你实际对接后端的流式接收函数
const simulateAiStreamResponse = () => {
  const aiMsgId = Date.now() + 1;
  const aiMsg = ref<MessageData>({
    id: aiMsgId,
    role: "assistant",
    sender: "AI助手",
    avatar: "https://picsum.photos/id/1005/100/100",
    time: new Date().toLocaleTimeString(),
    thinking: "",
    content: "",
    thinkingTime: 0
  });

  // 1. 消息对象刚插入时，调用一次滚动到底部 (保留这里)
  messages.value.push(aiMsg.value);
  scrollToBottom();

  const fullThinking = "正在分析用户意图...\n用户似乎在测试流式输出功能。\n检查组件响应速度...";
  const fullContent =
    "流式输出测试成功！\n\n```python\nprint('Hello World')\n```\n\n你可以看到思考过程先出现，然后是正文逐字显示。";

  let tIndex = 0;
  let cIndex = 0;

  // 阶段 1: 输出思考过程
  const thinkInterval = setInterval(() => {
    if (tIndex < fullThinking.length) {
      aiMsg.value.thinking += fullThinking[tIndex];
      aiMsg.value.thinkingTime = Math.floor(tIndex / 5);
      tIndex++;
    } else {
      clearInterval(thinkInterval);
      startContentStream();
    }
  }, 50);

  // 阶段 2: 输出正文
  const startContentStream = () => {
    const contentInterval = setInterval(() => {
      if (cIndex < fullContent.length) {
        scrollToBottom();
        aiMsg.value.content += fullContent[cIndex];
        cIndex++;
      } else {
        clearInterval(contentInterval);
      }
    }, 30);
  };
};

const handleCopy = (id: string) => console.log("Copy", id);
const handleRefresh = (id: string) => console.log("Refresh", id);

onMounted(() => {
  // initTestData();
  scrollToBottom();
});
</script>
