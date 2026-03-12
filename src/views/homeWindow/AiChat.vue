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
        @toggle-collapse="handleToggleCollapse"
        @select-chat="handleSelectChat"
        @new-chat="handleNewChat" />
    </div>

    <div
      :class="[
        'w-[80%] lg:w-[60%] flex flex-col transition-all duration-300 ease-in-out min-w-0',
        isHistoryCollapsed ? 'w-[calc(100%-55px)] lg:w-[calc(100%-55px)]' : ''
      ]">
      <n-scrollbar ref="scrollbarRef" class="flex-1">
        <div v-if="activeChatId" ref="scrollContentRef" class="flex flex-col items-center w-full">
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
              @refresh-message="handleRefresh"
              @allow-tool="executeLocalTool(msg, $event, true)"
              @deny-tool="executeLocalTool(msg, $event, false)" />
          </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center w-full h-full min-h-[60vh] select-none">
          <div
            class="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20">
            <i-mdi-robot-outline class="w-10 h-10" />
          </div>
          <h2 class="text-2xl font-bold text-[--text-color] mb-4">{{ $t("home.aiChat.startChat") }}</h2>
          <p class="text-sm text-[--user-text-color] opacity-80 mb-10">
            {{ $t("home.aiChat.welcome") }}
          </p>

          <div class="flex gap-4 flex-wrap justify-center max-w-[800px]">
            <div
              class="px-5 py-2.5 rounded-full border border-[--line-color] bg-[--input-area-bg] hover:bg-[--tray-hover] cursor-pointer text-sm text-[--text-color] opacity-80 hover:opacity-100 transition-all hover:shadow-sm"
              @click="handleQuickAction('帮我写一段 Python 代码')">
              帮我写一段 Python 代码
            </div>
            <div
              class="px-5 py-2.5 rounded-full border border-[--line-color] bg-[--input-area-bg] hover:bg-[--tray-hover] cursor-pointer text-sm text-[--text-color] opacity-80 hover:opacity-100 transition-all hover:shadow-sm"
              @click="handleQuickAction('解释什么是闭包')">
              解释什么是闭包
            </div>
            <div
              class="px-5 py-2.5 rounded-full border border-[--line-color] bg-[--input-area-bg] hover:bg-[--tray-hover] cursor-pointer text-sm text-[--text-color] opacity-80 hover:opacity-100 transition-all hover:shadow-sm"
              @click="handleQuickAction('如何优化 SQL 查询')">
              如何优化 SQL 查询
            </div>
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
      <right-panel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ScrollbarInst } from "naive-ui";

import type { MessageData, ToolCallDetail } from "@/types/chat";
import { messageCancelStream } from "@/utils/RequestUtils";

defineOptions({ name: "AiChat" });

const { t } = useI18n();

const chatStatus = ref<"loading" | "streaming" | "normal">("normal");
const activeChatId = ref<string>("");
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
  if (chatStatus.value !== "normal") return;

  if (!activeChatId.value) {
    activeChatId.value = "chat_" + Date.now();
    // TODO: 这里可以发个事件告诉侧边栏去新增一条空历史记录
  }

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

  // 2. 初始化 AI 消息气泡
  chatStatus.value = "loading";
  const aiMsgId = Date.now() + 1;
  const aiMsg: MessageData = {
    id: aiMsgId,
    role: "assistant",
    sender: "AI助手",
    avatar: "https://picsum.photos/id/1005/100/100",
    time: new Date().toLocaleTimeString(),
    thinking: "",
    content: "",
    thinkingTime: 0,
    toolCalls: [],
    citations: [
      {
        id: 1,
        title: "agent-builder-tasks.md",
        type: "file",
        snippet: "本地任务清单文档，记录了所有待办事项和开发进度...",
        score: 0.95
      }
    ]
  };

  messages.value.push(aiMsg);
  scrollToBottom();
  // 直接操作 aiMsg 是没有响应式的。
  const reactiveAiMsg = messages.value[messages.value.length - 1];
  // 3. 启动第一阶段模拟，传入代理对象
  simulatePhase1(reactiveAiMsg);
};

/**
 * 模拟阶段 1: 大模型思考并下发 tool_call 指令
 * @param aiMsg 要更新的 AI 消息对象
 */
const simulatePhase1 = (aiMsg: MessageData) => {
  chatStatus.value = "streaming";
  const thinkText =
    "用户要求读取本地任务清单，我需要调用 file_read 工具来获取 E 盘的 agent-builder-tasks.md 文件内容...\n";
  let tIndex = 0;

  const thinkInterval = setInterval(() => {
    if (tIndex < thinkText.length) {
      aiMsg.thinking += thinkText[tIndex];
      tIndex++;
      scrollToBottom();
    } else {
      clearInterval(thinkInterval);

      // 大模型停止生成文字，下发工具调用请求，状态设为 pending
      aiMsg.toolCalls!.push({
        id: "call_" + Date.now(),
        name: "file_read",
        args: { file_path: "E:/workspace/agent-builder-tasks.md" },
        status: "pending"
      });

      // 释放输入框锁定，让用户可以点击授权卡片
      chatStatus.value = "normal";
      scrollToBottom();
    }
  }, 50);
};

/**
 * 执行或拒绝本地工具并通知大模型
 * @param message 要更新的消息对象
 * @param tool 要执行的工具调用详情
 * @param isAllowed 是否允许执行该工具
 */
const executeLocalTool = async (message: MessageData, tool: ToolCallDetail, isAllowed: boolean) => {
  chatStatus.value = "loading";

  // 更新思考区块中的状态为执行中/错误
  tool.status = isAllowed ? "executing" : "error";
  tool.result = isAllowed ? "" : "用户拒绝了系统授权。";
  scrollToBottom();

  if (isAllowed) {
    // 模拟 Tauri 读取耗时
    setTimeout(() => {
      tool.result = "## Agent 待办事项\n- M4-01: 数据库设计\n- M4-02: 后端 API 对接\n进度: 未开始";
      tool.status = "success"; // 变成绿色打勾图标
      scrollToBottom();

      // 带着工具执行结果，触发第二阶段生成
      simulatePhase2(message);
    }, 1500);
  } else {
    setTimeout(() => {
      simulatePhase2(message);
    }, 500);
  }
};

/**
 * 模拟阶段 2: 大模型拿到本地工具结果后，继续生成最终回答
 * @param aiMsg 要更新的 AI 消息对象
 */
const simulatePhase2 = (aiMsg: MessageData) => {
  chatStatus.value = "streaming";

  const toolResult = aiMsg.toolCalls![0].status;
  const contentText =
    toolResult === "success"
      ? "我已经成功读取了本地文件！根据文件内容，你当前有以下待办事项：\n\n1. **M4-01**: 数据库设计\n2. **M4-02**: 后端 API 对接\n\n请问需要我帮忙写代码吗？"
      : "好的，我已经取消了本地文件读取操作。如果你需要查询任务，请随时授权。";

  let cIndex = 0;

  const contentInterval = setInterval(() => {
    if (cIndex < contentText.length) {
      aiMsg.content += contentText[cIndex];
      cIndex++;
      scrollToBottom();
    } else {
      clearInterval(contentInterval);
      chatStatus.value = "normal";
      aiMsg.thinkingTime = 3;
      scrollToBottom();
    }
  }, 30);
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

/**
 * 监听侧边栏点击某条历史记录
 * @param id 历史记录ID
 */
const handleSelectChat = (id: string) => {
  activeChatId.value = id;
  // TODO: 真实项目中这里需要调用 API 拉取该 ID 的历史消息列表
  messages.value = []; // 暂时模拟清空屏幕
  chatStatus.value = "normal";
  cancelMessageSelection();
};

/** 监听侧边栏点击新建对话 */
const handleNewChat = () => {
  activeChatId.value = ""; // 置空 ID 就会自动切回欢迎屏幕
  messages.value = [];
  chatStatus.value = "normal";
  cancelMessageSelection();
};

/**
 * 监听欢迎界面快捷操作点击
 * @param text 快捷操作文本
 */
const handleQuickAction = (text: string) => {
  handleSendMessage({
    type: "text",
    content: text,
    options: { useReasoning: false, useNetwork: false }
  });
};

onMounted(() => {
  // initTestData();
  scrollToBottom();
});
</script>
