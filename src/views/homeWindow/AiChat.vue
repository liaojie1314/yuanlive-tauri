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
            {{ t("home.aiChat.selected") }}
            <span class="text-blue-500 mx-1">{{ selectedMessageIds.size }}</span>
            {{ t("home.aiChat.message") }}
          </div>

          <div class="flex items-center gap-4">
            <n-button quaternary @click="cancelMessageSelection">{{ t("components.common.cancel") }}</n-button>
            <n-button type="error" :disabled="selectedMessageIds.size === 0" @click="handleBatchDeleteMessages">
              {{ t("home.aiChat.deleteSelected") }}
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
import { useI18n } from "vue-i18n";
import type { ScrollbarInst } from "naive-ui";

import type { MessageData } from "@/types/chat";
import { messageCancelStream } from "@/utils/RequestUtils";

defineOptions({ name: "AiChat" });

const { t } = useI18n();

const chatStatus = ref<"loading" | "streaming" | "normal">("normal");
const activeChatId = ref<string>("1");
const isHistoryCollapsed = ref<boolean>(false);
const scrollbarRef = ref<ScrollbarInst | null>(null);
const scrollContentRef = ref<HTMLElement | null>(null);
const isMessageSelectionMode = ref(false);
const selectedMessageIds = ref<Set<string | number>>(new Set());
const messages = ref<MessageData[]>([]);
const currentRequestId = ref<string | null>(null); // 记录当前请求 ID 用于取消

/**
 * 触发多选模式，并默认选中当前右键的消息
 * @param id 消息 ID
 */
const handleEnterMessageMultiSelect = (id: string | number) => {
  isMessageSelectionMode.value = true;
  selectedMessageIds.value.add(id);
};

/**
 * 切换单条消息的选中状态
 * @param id 消息 ID
 */
const handleToggleMessageSelect = (id: string | number) => {
  if (selectedMessageIds.value.has(id)) {
    selectedMessageIds.value.delete(id);
  } else {
    selectedMessageIds.value.add(id);
  }
};

/** 取消多选模式 */
const cancelMessageSelection = () => {
  isMessageSelectionMode.value = false;
  selectedMessageIds.value.clear();
};

/** 批量删除选中的消息 */
const handleBatchDeleteMessages = () => {
  if (selectedMessageIds.value.size === 0) return;

  window.$dialog.warning({
    content: t("home.aiChat.confirmDeleteSelected", { count: selectedMessageIds.value.size }),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 从本地列表中移除选中的消息
      messages.value = messages.value.filter((msg) => !selectedMessageIds.value.has(msg.id));
      // TODO: 这里可以调用后端 API 删除数据库中的消息记录

      // 删除完成后退出多选模式
      cancelMessageSelection();
    }
  });
};

/** 切换消息列表折叠状态 */
const handleToggleCollapse = () => {
  isHistoryCollapsed.value = !isHistoryCollapsed.value;
};

/** 滚动到消息列表底部 */
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

/** 取消当前 AI 消息生成 */
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
          lastMsg.content += `\n\n*[${t("home.aiChat.stopGenerate")}]*`;
        }
      }
    } else {
      // 兜底：如果没有请求 ID 但状态不对，也要强行重置
      chatStatus.value = "normal";
    }
  }
};

/**
 * 重发消息
 * @param data 消息数据
 */
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

/**
 * 发送消息
 * @param payload 消息内容
 */
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

/**
 * 模拟流式输出 (不再需要复杂的 typingEffect，只需更新数据)
 * 找到 simulateAiStreamResponse 或你实际对接后端的流式接收函数
 */
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
    thinkingTime: 0,
    // 模拟的 RAG 检索数据
    citations: [
      {
        id: 1,
        title: "Tauri2_架构设计文档.pdf",
        type: "file",
        snippet:
          "Tauri 2.0 引入了全新的 IPC 架构，使得前端 Vue 进程能够以极低的延迟与 Rust 后端进行二进制数据通信，同时提供了更完善的插件系统 (Plugin System)...",
        score: 0.92
      },
      {
        id: 2,
        title: "上周二历史对话",
        type: "history",
        snippet:
          "用户询问了关于如何优化 Spring Cloud 高并发直播聊天室的架构。AI 建议使用 Redis 配合 WebSocket 集群进行消息分发...",
        score: 0.85
      },
      {
        id: 3,
        title: "Vue 官方文档: 响应式原理",
        type: "web",
        snippet:
          "Vue 3 使用了 Proxy 来代替 Vue 2 的 Object.defineProperty，这使得 Vue 能够完美拦截对象属性的添加、删除，以及数组索引的修改，极大地提升了性能。"
      }
    ]
  });

  // 消息对象刚插入时，调用一次滚动到底部
  messages.value.push(aiMsg.value);
  const fullThinking = "正在检索相关文档...\n匹配到 3 个高度相关的信息源。\n开始整合并生成最终回答...";
  const fullContent =
    "根据检索到的资料，流式输出测试成功！\n\n这证明了我们的前端架构不仅能丝滑处理 RAG 引用，还能完美兼容 `Tauri 2` 的进程通信与 `Vue 3` 的 Proxy 响应式系统。\n\n你可以把鼠标悬浮在底部的引用标签上，看看弹出的浮窗效果。";

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
        aiMsg.value.content += fullContent[cIndex];
        cIndex++;
        // scrollToBottom(); // 记得在外部处理滚动
      } else {
        clearInterval(contentInterval);
      }
    }, 30);
  };
};

/**
 * 复制消息内容
 * @param id 消息ID
 */
const handleCopy = (id: string) => console.log("Copy", id);

/**
 * 刷新消息内容
 * @param id 消息ID
 */
const handleRefresh = (id: string) => console.log("Refresh", id);

onMounted(() => {
  // initTestData();
  scrollToBottom();
});
</script>
