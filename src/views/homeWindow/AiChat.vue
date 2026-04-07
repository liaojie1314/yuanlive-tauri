<template>
  <div class="flex h-[calc(100%-24px)] w-full flex-row overflow-auto">
    <div
      :class="[
        'border-r border-[--line-color] bg-[--tray-bg-color] transition-all duration-300 ease-in-out',
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
        'flex w-[80%] min-w-0 flex-col transition-all duration-300 ease-in-out lg:w-[60%]',
        isHistoryCollapsed ? 'w-[calc(100%-55px)] lg:w-[calc(100%-55px)]' : ''
      ]">
      <div class="relative flex-1 min-h-0">
        <n-scrollbar ref="scrollbarRef" class="h-full w-full" @scroll="handleScroll">
          <div v-if="activeChatId" ref="scrollContentRef" class="flex w-full flex-col items-center">
            <div class="w-full max-w-[1000px]">
              <message-item
                v-for="msg in messages"
                :key="msg.id"
                :message="msg"
                :selection-mode="isMessageSelectionMode"
                :selected="selectedMessageIds.has(msg.id!)"
                @enter-multi-select="handleEnterMessageMultiSelect"
                @toggle-select="handleToggleMessageSelect"
                @resend-message="handleResend"
                @copy-message="handleCopy"
                @refresh-message="handleRefresh"
                @allow-tool="executeLocalTool(msg, $event, true)"
                @deny-tool="executeLocalTool(msg, $event, false)" />
            </div>
          </div>

          <div v-else class="flex h-full min-h-[60vh] w-full flex-col items-center justify-center select-none">
            <div
              class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
              <i-mdi-robot-outline class="h-10 w-10" />
            </div>
            <h2 class="mb-4 text-2xl font-bold text-[--text-color]">{{ $t("home.aiChat.startChat") }}</h2>
            <p class="mb-10 text-sm text-[--user-text-color] opacity-80">
              {{ $t("home.aiChat.welcome") }}
            </p>

            <div class="flex max-w-[800px] flex-wrap justify-center gap-4">
              <div
                class="cursor-pointer rounded-full border border-[--line-color] bg-[--input-area-bg] px-5 py-2.5 text-sm text-[--text-color] opacity-80 transition-all hover:bg-[--tray-hover] hover:opacity-100 hover:shadow-sm"
                @click="handleQuickAction('帮我写一段 Python 代码')">
                帮我写一段 Python 代码
              </div>
              <div
                class="cursor-pointer rounded-full border border-[--line-color] bg-[--input-area-bg] px-5 py-2.5 text-sm text-[--text-color] opacity-80 transition-all hover:bg-[--tray-hover] hover:opacity-100 hover:shadow-sm"
                @click="handleQuickAction('解释什么是闭包')">
                解释什么是闭包
              </div>
              <div
                class="cursor-pointer rounded-full border border-[--line-color] bg-[--input-area-bg] px-5 py-2.5 text-sm text-[--text-color] opacity-80 transition-all hover:bg-[--tray-hover] hover:opacity-100 hover:shadow-sm"
                @click="handleQuickAction('如何优化 SQL 查询')">
                如何优化 SQL 查询
              </div>
            </div>
          </div>
        </n-scrollbar>

        <div
          class="absolute bottom-4 right-6 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[--line-color] bg-[--tray-bg-color] shadow-md transition-all duration-300 hover:bg-[--tray-hover] hover:shadow-lg active:scale-95"
          :class="showScrollToBottomBtn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'"
          @click="scrollToBottom(true)">
          <i-mdi-arrow-down class="h-5 w-5 text-[--user-text-color]" />
        </div>
      </div>

      <div class="flex w-full justify-center bg-[--tray-bg-color] py-1">
        <message-input
          v-if="!isMessageSelectionMode"
          :status="chatStatus"
          @send-message="handleSendMessage"
          @cancel-stream="handleCancelAiResponse" />

        <div
          v-else
          class="m-1 flex w-full max-w-[800px] items-center justify-between rounded-lg border border-[--line-color] bg-[--input-area-bg] p-4 shadow-sm transition-all">
          <div class="text-sm font-medium text-[--user-text-color]">
            {{ t("home.aiChat.selected") }}
            <span class="mx-1 text-blue-500">{{ selectedMessageIds.size }}</span>
            {{ t("home.aiChat.message") }}
          </div>

          <div class="flex-y-center gap-4">
            <n-button quaternary @click="cancelMessageSelection">{{ t("components.common.cancel") }}</n-button>
            <n-button type="error" :disabled="selectedMessageIds.size === 0" @click="handleBatchDeleteMessages">
              {{ t("home.aiChat.deleteSelected") }}
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="w-0 overflow-hidden border-l border-[--line-color] bg-[--tray-bg-color] transition-all duration-300 ease-in-out lg:w-[20%]">
      <right-panel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ScrollbarInst } from "naive-ui";
import { arch, version } from "@tauri-apps/plugin-os";

import { useAiStore } from "@/stores/ai";
import { useUserStore } from "@/stores/user";
import { nativeFsTools } from "@/utils/McpUtils";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getOSType, isWindows } from "@/utils/PlatformUtils";
import type { MessageData, ToolCallDetail } from "@/types/chat";
import type { AiStreamPayload } from "@/utils/RequestUtils";
import { messageCancelStream, messageSendStream } from "@/utils/RequestUtils";
import { getConversationMessageApi } from "@/api/aiHistory";

defineOptions({ name: "AiChat" });

const { t } = useI18n();
const aiStore = useAiStore();
const userStore = useUserStore();
const { getLocationWithTransform } = useGeolocation();

const osType = ref();
const osArch = ref();
const osVersion = ref();
const chatStatus = ref<"loading" | "streaming" | "normal">("normal");
const activeChatId = ref<string>("");
const isHistoryCollapsed = ref<boolean>(false);
const scrollbarRef = ref<ScrollbarInst | null>(null);
const scrollContentRef = ref<HTMLElement | null>(null);
const isMessageSelectionMode = ref(false);
const selectedMessageIds = ref<Set<string | number>>(new Set());
const messages = ref<MessageData[]>([]);
const currentRequestId = ref<string | null>(null); // 记录当前请求 ID 用于取消
const showScrollToBottomBtn = ref(false);
// 判断用户是否停留在底部附近
const isAtBottom = ref(true);
// 历史消息分页拉取状态
const msgCursor = ref<string | undefined>(undefined);
const hasMoreMsgs = ref(true);
const isLoadingMsgs = ref(false);

/**
 * 处理滚动事件，判断是否显示滚动到底部按钮
 * @param e 滚动事件对象
 */
const handleScroll = (e: Event) => {
  const target = (e.currentTarget || e.target) as HTMLElement;
  // 向底部滚动判断逻辑
  const hasScrollbar = target.scrollHeight > target.clientHeight;
  const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
  showScrollToBottomBtn.value = hasScrollbar && distanceToBottom > 200;
  isAtBottom.value = !hasScrollbar || distanceToBottom < 100;
  // 向上触顶检测 (距离顶部小于 50px 时自动加载上一页)
  if (target.scrollTop <= 50 && hasMoreMsgs.value && !isLoadingMsgs.value) {
    loadMessages(false);
  }
};

/**
 * 滚动到消息列表底部
 * @param force 是否强制滚动（用户自己发消息或点击回底按钮时传 true）
 * @param isSmooth 是否使用平滑动画（流式打字时绝对不能设为 true，否则会疯狂抖动）
 */
const scrollToBottom = (force = false, isSmooth = false) => {
  nextTick(() => {
    // 只有在强制滚动 或 用户本身就在底部时，才执行滚动
    if (force || isAtBottom.value) {
      if (scrollbarRef.value && scrollContentRef.value) {
        scrollbarRef.value.scrollTo({
          top: scrollContentRef.value.scrollHeight,
          behavior: isSmooth ? "smooth" : "auto"
        });
      }
    }
  });
};

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
    title: t("components.common.confirmDelete"),
    content: t("home.aiChat.confirmDeleteSelected", { count: selectedMessageIds.value.size }),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 从本地列表中移除选中的消息
      messages.value = messages.value.filter((msg) => !selectedMessageIds.value.has(msg.id!));
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
 * 发送消息 (真实流式请求)
 * @param payload 消息内容
 */
const handleSendMessage = async (payload: {
  type: string;
  content: string;
  options: { useReasoning: boolean; useNetwork: boolean };
}) => {
  if (chatStatus.value !== "normal") return;

  if (!activeChatId.value) {
    activeChatId.value = "chat_" + Date.now();
  }

  // 1. 构造用户消息并压入
  const userMsg: MessageData = {
    id: String(userStore.userInfo?.uid || Date.now()),
    role: "user",
    sender: userStore.userInfo?.username || "我",
    avatar: userStore.userInfo?.avatar || "https://picsum.photos/id/1006/100/100",
    content: payload.content,
    time: new Date().toLocaleTimeString()
  };
  messages.value.push(userMsg);
  const reactiveUserMsg = messages.value[messages.value.length - 1];
  scrollToBottom(true);

  // 2. 初始化 AI 消息气泡并压入
  chatStatus.value = "loading";
  const aiMsg: MessageData = {
    id: String(Date.now() + 1),
    role: "assistant",
    sender: "AI助手",
    avatar: "https://picsum.photos/id/1005/100/100",
    time: new Date().toLocaleTimeString(),
    thinking: "",
    content: "",
    toolCalls: [],
    citations: []
  };
  messages.value.push(aiMsg);
  const reactiveAiMsg = messages.value[messages.value.length - 1];
  scrollToBottom();

  const requestId = `req_${Date.now()}`;
  currentRequestId.value = requestId;

  // 3. 提取 Agent 配置
  const mcpTools: any[] = [];
  const allAvailableTools = [...nativeFsTools, ...aiStore.cachedWindowsTools];
  for (const [_, config] of Object.entries(aiStore.mcpConfig)) {
    if (config.enabled && config.activeTools.length > 0) {
      const activeSchemas = allAvailableTools.filter((tool) => config.activeTools.includes(tool.name));
      mcpTools.push(...toRaw(activeSchemas));
    }
  }

  // 4. 安全地获取地理位置 (带 2000ms 超时保护)
  let locationData;
  try {
    const locResult = (await Promise.race([
      getLocationWithTransform({ timeout: 6000, enableHighAccuracy: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("获取位置超时")), 6000))
    ])) as any;

    locationData = {
      lat: locResult.transformed?.lat || locResult.original?.lat,
      lng: locResult.transformed?.lng || locResult.original?.lng,
      address: locResult.address || ""
    };
  } catch (e) {
    console.warn("无法获取地理位置，降级为无位置状态发送:", e);
  }

  // 5. 构建带 env 的完整请求载荷
  const streamPayload: AiStreamPayload = {
    clientMsgId: requestId,
    conversationId: activeChatId.value,
    content: payload.content,
    options: payload.options,
    agentSettings: {
      systemPrompt: aiStore.systemPrompt || undefined,
      mcpTools: mcpTools.length > 0 ? mcpTools : undefined
    },
    env: {
      os: {
        type: osType.value,
        arch: osArch.value,
        version: osVersion.value
      },
      location: locationData,
      allowedWorkspaces: toRaw(aiStore.allowedWorkspaces)
    }
  };

  try {
    await messageSendStream(streamPayload, requestId, {
      onMessageIds: ({ userMsgId, aiMsgId }) => {
        if (chatStatus.value === "loading") chatStatus.value = "streaming";
        if (reactiveUserMsg.id !== userMsgId) reactiveUserMsg.id = userMsgId;
        if (reactiveAiMsg.id !== aiMsgId) reactiveAiMsg.id = aiMsgId;
      },
      onChunk: (chunk) => {
        if (chatStatus.value === "loading") chatStatus.value = "streaming";
        reactiveAiMsg.content += chunk;
        scrollToBottom();
      },
      onThinking: (thinkingChunk) => {
        if (chatStatus.value === "loading") chatStatus.value = "streaming";
        if (reactiveAiMsg.thinking === undefined) reactiveAiMsg.thinking = "";
        reactiveAiMsg.thinking += thinkingChunk;
        scrollToBottom();
      },
      onToolCall: (toolCall) => {
        chatStatus.value = "normal";
        reactiveAiMsg.toolCalls!.push({
          id: toolCall.id || `call_${Date.now()}`,
          name: toolCall.name,
          args: toolCall.args || {},
          status: "pending"
        });
        scrollToBottom();
      },
      onDone: () => {
        chatStatus.value = "normal";
        currentRequestId.value = null;
        scrollToBottom();
      },
      onError: (err) => {
        chatStatus.value = "normal";
        currentRequestId.value = null;
        reactiveAiMsg.content += `\n\n**[请求异常: ${err}]**`;
        scrollToBottom();
      }
    });
  } catch (error) {
    console.error("流式请求抛出异常:", error);
    chatStatus.value = "normal";
    currentRequestId.value = null;
  }
};

/**
 * 执行或拒绝本地工具并通知大模型继续生成
 * @param message 要更新的消息对象
 * @param tool 要执行的工具调用详情
 * @param isAllowed 是否允许执行该工具
 */
const executeLocalTool = async (message: MessageData, tool: ToolCallDetail, isAllowed: boolean) => {
  chatStatus.value = "loading";

  // 1. 更新 UI 状态
  tool.status = isAllowed ? "executing" : "error";
  tool.result = isAllowed ? "" : "用户拒绝了系统授权。";
  scrollToBottom();

  // 2. 真实执行工具逻辑
  if (isAllowed) {
    try {
      // TODO: 未来在这里替换为真实的 Tauri invoke，比如 await invoke('read_file', { path: tool.args.file_path })
      await new Promise((resolve) => setTimeout(resolve, 800)); // 模拟本地耗时
      tool.result = `(模拟执行结果) 成功读取数据，时间：${new Date().toLocaleTimeString()}`;
      tool.status = "success";
    } catch (e: any) {
      tool.result = `执行本地工具失败: ${e.message || String(e)}`;
      tool.status = "error";
    }
  }
  scrollToBottom();

  // 3. 构建第二阶段请求：把工具结果提交给大模型
  const requestId = `req_${Date.now()}`;
  currentRequestId.value = requestId;

  const streamPayload: AiStreamPayload = {
    clientMsgId: requestId,
    conversationId: activeChatId.value,
    content: "", // 此时不发送新提问，只发工具结果
    toolResults: [
      {
        tool_call_id: tool.id,
        result: tool.result
      }
    ]
  };

  try {
    chatStatus.value = "streaming";
    await messageSendStream(streamPayload, requestId, {
      onChunk: (chunk) => {
        message.content += chunk;
        scrollToBottom();
      },
      onDone: () => {
        chatStatus.value = "normal";
        currentRequestId.value = null;
        scrollToBottom();
      },
      onError: (err) => {
        chatStatus.value = "normal";
        currentRequestId.value = null;
        message.content += `\n\n**[工具结果提交异常: ${err}]**`;
        scrollToBottom();
      }
    });
  } catch (error) {
    console.error("提交工具结果异常:", error);
    chatStatus.value = "normal";
    currentRequestId.value = null;
  }
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
  chatStatus.value = "normal";
  cancelMessageSelection();
  // 切换后立即加载该对话的第一页数据
  loadMessages(true);
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

/**
 * 加载聊天记录
 * @param isFirstPage 是否是切换对话时的首次加载
 */
const loadMessages = async (isFirstPage = false) => {
  if (!activeChatId.value || isLoadingMsgs.value || (!hasMoreMsgs.value && !isFirstPage)) return;

  if (isFirstPage) {
    msgCursor.value = undefined;
    hasMoreMsgs.value = true;
    messages.value = [];
  }

  isLoadingMsgs.value = true;

  // 记录加载前的内容高度，用于维持滚动条位置 (避免向上加载后画面乱跳)
  const previousScrollHeight = scrollContentRef.value?.scrollHeight || 0;

  try {
    const res = await getConversationMessageApi(activeChatId.value, msgCursor.value);

    // 拿到原始数组
    const rawMessages = res.messages || [];

    // 进行绝对正序排序，修复局部倒序乱序问题
    rawMessages.sort((a: any, b: any) => {
      // 如果时间不同，按时间正序排列（早的在上，晚的在下）
      if (a.time !== b.time) {
        return a.time - b.time;
      }
      // 如果时间完全相同，确保用户的问题排在 AI 回答的前面
      if (a.role === "user" && b.role === "assistant") return -1;
      if (a.role === "assistant" && b.role === "user") return 1;
      return 0;
    });

    // 转换为前端 UI 需要的格式
    const historyData: MessageData[] = rawMessages.map((apiMsg: any) => {
      // 容错处理：如果你的后端 time 是 10 位数(秒)，需要 * 1000 转成毫秒；如果是 13 位数则不用乘
      const timestamp = apiMsg.time.toString().length === 10 ? apiMsg.time * 1000 : apiMsg.time;

      return {
        id: apiMsg.clientId || apiMsg.aiId || Date.now().toString(),
        role: apiMsg.role as "user" | "assistant",
        sender: apiMsg.sender,
        avatar: apiMsg.avatar,
        content: apiMsg.content,
        time: new Date(timestamp).toLocaleTimeString(),
        thinking: apiMsg.thinking || "",
        toolCalls: [],
        citations: []
      };
    });
    if (isFirstPage) {
      messages.value = historyData;
      scrollToBottom(true);
    } else {
      // 向上滚动加载：把旧数据拼接在前面
      messages.value = [...historyData, ...messages.value];

      // 巧妙维持滚动条位置
      nextTick(() => {
        if (scrollbarRef.value && scrollContentRef.value) {
          const newScrollHeight = scrollContentRef.value.scrollHeight;
          scrollbarRef.value.scrollTo({
            top: newScrollHeight - previousScrollHeight,
            behavior: "auto"
          });
        }
      });
    }

    msgCursor.value = res.nextCursor;
    hasMoreMsgs.value = res.hasMore;
  } catch (error) {
    console.error("加载历史消息失败:", error);
    window.$message?.error(t("home.aiChat.loadFailed"));
  } finally {
    isLoadingMsgs.value = false;
  }
};

onMounted(() => {
  // initTestData();
  osType.value = getOSType();
  osArch.value = arch();
  osVersion.value = version();
  if (isWindows()) {
    const parts = version().split(".");
    const build_number = Number(parts[2]);
    osVersion.value = build_number > 22000 ? "11" : "10";
  }
  scrollToBottom();
});
</script>
