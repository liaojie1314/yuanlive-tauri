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

import type { MessageData, ToolCallDetail } from "@/types/chat";
import { messageCancelStream } from "@/utils/RequestUtils";
import { getOSType, isWindows } from "@/utils/PlatformUtils";

defineOptions({ name: "AiChat" });

const { t } = useI18n();

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

/**
 * 处理滚动事件，判断是否显示滚动到底部按钮
 * @param e 滚动事件对象
 */
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  // 计算距离底部的距离
  const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

  // 1. 控制“回到大底部”按钮的显示
  showScrollToBottomBtn.value = distanceToBottom > 300;

  // 2. 更新是否处于底部的状态
  isAtBottom.value = distanceToBottom < 200;
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

/**
 * 滚动到消息列表底部
 * @param force 是否强制滚动（用户自己发消息或点击回底按钮时传 true）
 */
const scrollToBottom = (force = false) => {
  nextTick(() => {
    // 只有在强制滚动 或 用户本身就在底部时，才执行滚动
    if (force || isAtBottom.value) {
      if (scrollbarRef.value && scrollContentRef.value) {
        scrollbarRef.value.scrollTo({
          top: scrollContentRef.value.scrollHeight,
          behavior: "smooth"
        });
      }
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
  scrollToBottom(true);

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
      },
      {
        id: 2,
        title: "百度",
        type: "web",
        url: "https://www.baidu.com",
        snippet: "本地任务清单文档，记录了所有待办事项和开发进度..."
      },
      {
        id: 3,
        title: "b站",
        type: "web",
        url: "https://www.bilibili.com",
        snippet: "本地任务清单文档，记录了所有待办事项和开发进度..."
      },
      {
        id: 4,
        title: "1.pdf",
        type: "file",
        snippet: "本地任务清单文档，记录了所有待办事项和开发进度...",
        score: 0.85
      },
      {
        id: 5,
        title: "1.png",
        type: "file",
        snippet: "本地任务清单文档，记录了所有待办事项和开发进度...",
        score: 0.65
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
  // 测试数据
  //   `我已经成功读取了本地文件！为了全面测试最新的渲染引擎，我整理了以下**全类型富文本报告** :rocket:：

  // ### 1. 扩展排版语法
  // 这是一段包含**加粗**、*斜体*、~~删除线~~，以及特定的 ==高亮显示 (Mark)== 的文本。
  // 利用上下标插件，我们可以写出化学式 H~2~O 和方程式 $X^2$（或纯文本的 2^10^）。
  // 名词缩写测试：把鼠标悬停在下方的 HTML 上试试看。
  // *[HTML]: Hyper Text Markup Language (超文本标记语言)

  // ### 2. 定义列表 (Deflist)
  // 前端工程化
  // : 构建现代 Web 系统的规范与实践。
  // : 包含 TypeScript, Vite, Vue 等技术栈。

  // ### 3. GFM 任务列表与表格
  // - [x] 迁移到 \`markdown-it\` 解析引擎
  // - [x] 修复 DOMPurify 清洗 MathML 的问题
  // - [ ] 测试所有插件的边界兼容性

  // | 模块名称 | 语言 | 状态 | 耗时评估 |
  // | :--- | :---: | :---: | ---: |
  // | 核心解析器 | TypeScript | 🟢 稳定 | ~20ms |
  // | 样式与动画 | CSS/Sass | 🟡 调优中 | ~15ms |

  // ### 4. 高阶数学公式 (KaTeX)
  // 物理学中最著名的质能方程是 $E = mc^2$。下面是更复杂的**薛定谔方程**块级渲染：
  // $$
  // i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)
  // $$

  // ### 5. 跨语言代码高亮测试
  // 这是带有你自定义 Header 和操作按钮的 Vue 组件代码：
  // \`\`\`vue
  // <template>
  //   <div class="hello">{{ msg }}</div>
  // </template>
  // <script setup lang="ts">
  // import { ref } from 'vue';
  // const msg = ref('Hello Tauri & Vue!');
  // <\/script>
  // \`\`\`

  // 以及系统底层的 Rust 代码块：
  // \`\`\`rust
  // fn main() {
  //     let target = "World";
  //     println!("Hello, {}! 🦀", target);
  // }
  // \`\`\`

  // > **💡 智能提示**：您可以直接点击上方代码块的**运行**按钮来进行预览，或者使用**复制/下载**功能。相关参考信息见文末脚注[^1]。

  // ---
  // [^1]: 这是一个 Footnote (脚注) 测试。通常用于引用文献或补充详细的长文本解释。`
  const contentText =
    toolResult === "success"
      ? "我已经成功读取了本地文件！根据文件内容，你当前有以下待办事项：\n\n1. **M4-01**: 数据库设计\n2. **M4-02**: 后端 API 对接\n\n请问需要我帮忙写代码吗？\n```python\nprint('hello world')\n```"
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
