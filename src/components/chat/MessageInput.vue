<template>
  <div class="flex w-full max-w-[800px] min-w-0 flex-col">
    <div v-if="attachments.length > 0" class="m-1 flex w-[calc(100%-16px)] flex-wrap gap-2 p-1 select-none">
      <div v-for="(item, index) in attachments" class="group relative flex-shrink-0 cursor-default" :key="index">
        <div
          v-if="item.type === 'image'"
          class="h-16 w-16 cursor-pointer overflow-hidden rounded-lg border border-[--line-color] bg-[--input-area-bg] transition-opacity hover:opacity-90"
          @click="handleAttachmentClick(item)">
          <img alt="img" class="h-full w-full object-cover" :src="item.previewUrl" />
        </div>

        <div
          v-else
          class="flex-center h-16 w-16 cursor-pointer flex-col gap-1 rounded-lg border border-[--line-color] bg-[--input-area-bg] shadow-sm transition-shadow select-none hover:bg-[--tray-hover] hover:shadow-md"
          :title="item.name"
          @click="handleAttachmentClick(item)">
          <span class="w-full truncate text-center text-sm font-medium text-[--text-color]">
            {{ item.name }}
          </span>

          <div class="flex-center mt-1 w-full gap-1 opacity-80">
            <img
              class="h-5 w-5 flex-shrink-0 object-contain"
              :src="`/file/${getFileSuffix(item.name || '')}.svg`"
              :alt="getFileSuffix(item.name || '')" />

            <span class="max-w-[2rem] truncate text-[10px] font-bold text-[--user-text-color] uppercase">
              {{ getFileSuffix(item.name) }}
            </span>
          </div>
        </div>

        <div
          v-if="item.isUploading"
          class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-[2px]">
          <i-mdi-loading class="h-6 w-6 animate-spin text-white" />
        </div>

        <div
          v-else-if="item.isError"
          class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-red-500/20 border border-red-500/50 backdrop-blur-[1px] cursor-pointer transition-colors hover:bg-red-500/30"
          :title="t('components.messageInput.uploadFailed')"
          @click.stop="retryUpload(item)">
          <i-mdi-refresh class="h-6 w-6 rounded-full bg-white text-red-500 p-0.5 shadow-sm" />
        </div>

        <div
          class="absolute top-[-4px] right-[-4px] z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[--action-bar-icon-color] text-[--tray-bg-color] opacity-0 shadow-sm transition-colors group-hover:opacity-100 hover:bg-red-500"
          @click.stop="removeAttachment(index)">
          <i-mdi-close class="h-3 w-3" />
        </div>
      </div>
    </div>

    <div v-resize="handleResize" class="input-container relative m-1 flex flex-col rounded-lg bg-[--input-area-bg] p-2">
      <transition name="fade-slide">
        <div
          v-if="showMentionMenu"
          class="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-[--line-color] bg-[--bg-popover] py-1.5 shadow-lg z-50 flex flex-col gap-1">
          <div class="px-3 py-1 text-xs text-[--user-text-color] select-none flex justify-between">
            <span>{{ t("components.messageInput.referenceContext") }}</span>
            <span class="opacity-50">{{ t("components.messageInput.selectConfirm") }}</span>
          </div>

          <div v-if="filteredMentions.length === 0" class="px-2 py-3 text-center text-xs text-[--user-text-color]">
            {{ t("components.messageInput.noRelatedFiles") }}
          </div>

          <n-scrollbar style="max-height: 200px" class="px-1.5 w-full box-border">
            <div
              v-for="(item, index) in filteredMentions"
              class="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors box-border"
              :id="`menu-item-${index}`"
              :key="item.name"
              :class="selectedMenuIndex === index ? 'bg-[--tray-hover]' : 'hover:bg-[--tray-hover]'"
              @click="selectMention(item)">
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[--btn-secondary-bg] text-[--text-color]">
                <i-mdi-clipboard-text-outline v-if="item.type === 'clipboard'" class="h-4 w-4" />

                <img
                  v-else
                  alt=""
                  class="h-4 w-4 object-contain"
                  :src="`/file/${getFileSuffix(item.name || '')}.svg`"
                  @error="(e) => ((e.target as HTMLImageElement).src = '/file/unknown.svg')" />
              </div>
              <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
                <span class="truncate text-sm font-medium text-[--text-color]">{{ item.name }}</span>
                <span class="truncate text-[10px] text-[--user-text-color]">{{ item.path }}</span>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </transition>

      <transition name="fade-slide">
        <div
          v-if="showSlashMenu"
          class="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-[--line-color] bg-[--bg-popover] py-1.5 shadow-lg z-50 flex flex-col gap-1">
          <div class="px-3 py-1 text-xs text-[--user-text-color] select-none flex justify-between">
            <span>{{ t("components.messageInput.shortcut") }}</span>
            <span class="opacity-50">{{ t("components.messageInput.selectConfirm") }}</span>
          </div>

          <n-scrollbar style="max-height: 240px" class="px-1.5 w-full box-border">
            <div
              v-for="(cmd, index) in slashCommands"
              class="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors box-border"
              :id="`menu-item-${index}`"
              :key="cmd.label"
              :class="selectedMenuIndex === index ? 'bg-[--tray-hover]' : 'hover:bg-[--tray-hover]'"
              @click="applySlashCommand(cmd.prompt)">
              <div
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[--btn-secondary-bg] text-[--text-color]">
                <i-mdi-translate v-if="cmd.icon === 'translate'" class="h-4 w-4" />
                <i-mdi-code-tags v-else-if="cmd.icon === 'code'" class="h-4 w-4" />
                <i-mdi-file-document-edit-outline v-else-if="cmd.icon === 'summarize'" class="h-4 w-4" />
                <i-mdi-lightning-bolt-outline v-else class="h-4 w-4" />
              </div>
              <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
                <span class="truncate text-sm font-medium text-[--text-color]">{{ cmd.label }}</span>
                <span class="truncate text-xs text-[--user-text-color]">{{ cmd.prompt }}</span>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </transition>
      <n-input
        v-if="!isVoiceMode"
        type="textarea"
        class="w-full !bg-transparent"
        v-model:value="messageText"
        :placeholder="t('components.messageInput.placeholder')"
        :min-height="40"
        :max-height="120"
        :autosize="{ minRows: 1, maxRows: 5 }"
        :bordered="false"
        :show-count="false"
        @keydown="handleKeydown"
        @paste="handlePaste" />

      <div v-if="!isVoiceMode" class="mt-3 flex-between-center border-t border-[--line-color] pt-2">
        <div class="flex-y-center gap-3">
          <n-popover
            trigger="click"
            class="border border-[--line-color] bg-[--bg-popover] p-0 select-none"
            v-model:show="showAttachPopover"
            :show-arrow="false">
            <template #trigger>
              <div
                style="border-color: var(--btn-secondary-border)"
                class="flex cursor-pointer items-center gap-1 rounded-full border px-4 py-1.5 text-sm text-[--text-color] transition-colors"
                :class="
                  showAttachPopover
                    ? 'bg-[--btn-secondary-hover]'
                    : 'bg-[--btn-secondary-bg] hover:bg-[--btn-secondary-hover]'
                "
                :title="t('components.messageInput.attach')">
                <i-mdi-paperclip class="h-4 w-4" />
                <span v-if="showButtonText">{{ t("components.messageInput.attach") }}</span>
              </div>
            </template>
            <div class="menu-list space-y-1 rounded-md p-1">
              <div
                class="menu-item flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--text-color] transition-colors hover:bg-[--tray-hover]"
                @click="handleMenuClick('file')">
                <i-mdi-file-upload-outline class="h-4 w-4" />
                <span>{{ t("components.messageInput.uploadFile") }}</span>
              </div>
              <div
                class="menu-item flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--text-color] transition-colors hover:bg-[--tray-hover]"
                @click="handleMenuClick('photo')">
                <i-mdi-image-outline class="h-4 w-4" />
                <span>{{ t("components.messageInput.uploadPhoto") }}</span>
              </div>
              <div
                class="menu-item flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--text-color] transition-colors hover:bg-[--tray-hover]"
                @click="handleMenuClick('screenshot')">
                <i-mdi-camera class="h-4 w-4" />
                <span>{{ t("components.messageInput.takeScreenshot") }}</span>
              </div>
              <div
                class="menu-item flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--text-color] transition-colors hover:bg-[--tray-hover]"
                @click="handleMenuClick('camera')">
                <i-mdi-camera-plus class="h-4 w-4" />
                <span>{{ t("components.messageInput.takePhoto") }}</span>
              </div>
            </div>
          </n-popover>

          <div class="relative">
            <n-select
              placeholder="auto"
              class="w-32"
              v-model:value="selectedModel"
              :options="modelOptions"
              :render-label="renderLabel"
              @update:value="handleModelChange" />
          </div>

          <div
            class="flex cursor-pointer items-center gap-1 rounded-full border px-4 py-1.5 text-sm transition-all duration-200"
            :class="{
              'border-blue-500/50 bg-blue-500/15 text-blue-500': isThinkActive,
              [`border-[--btn-secondary-border] bg-[--btn-secondary-bg] text-[--text-color] hover:bg-[--btn-secondary-hover]`]:
                !isThinkActive
            }"
            :title="t('components.messageInput.think')"
            @click="isThinkActive = !isThinkActive">
            <i-mdi-lightbulb-outline class="h-4 w-4" />
            <span v-if="showButtonText">{{ t("components.messageInput.think") }}</span>
          </div>

          <div
            class="flex cursor-pointer items-center gap-1 rounded-full border px-4 py-1.5 text-sm transition-all duration-200"
            :class="{
              'border-blue-500/50 bg-blue-500/15 text-blue-500': isSearchActive,
              [`border-[--btn-secondary-border] bg-[--btn-secondary-bg] text-[--text-color] hover:bg-[--btn-secondary-hover]`]:
                !isSearchActive
            }"
            :title="t('components.messageInput.search')"
            @click="isSearchActive = !isSearchActive">
            <i-mdi-magnify class="h-4 w-4" />
            <span v-if="showButtonText">{{ t("components.messageInput.search") }}</span>
          </div>
        </div>

        <div class="flex-y-center gap-3">
          <div
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[--btn-secondary-border] bg-[--btn-secondary-bg] text-[--text-color] transition-colors hover:bg-[--btn-secondary-hover]"
            :title="t('components.messageInput.voiceMessage')"
            @click="handleVoiceClick">
            <i-mdi-microphone-outline class="h-4 w-4" />
          </div>

          <n-button circle type="primary" :disabled="isBtnDisabled" @click="sendMessage">
            <template #icon>
              <n-icon>
                <i-material-symbols-arrow-upward v-if="status === 'normal'" class="h-4 w-4" />
                <i-material-symbols-pause v-else-if="status === 'streaming'" class="h-4 w-4" />
                <i-mdi-loading v-else class="h-4 w-4 animate-spin" />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>

      <voice-recorder v-show="isVoiceMode" @cancel="handleVoiceCancel" @send="sendVoiceDirect" />
      <camera-modal v-model:show="showCameraModal" @confirm="handleCameraConfirm" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { type SelectOption, NEllipsis } from "naive-ui";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { stat } from "@tauri-apps/plugin-fs";

import { MittEnum, TauriCommandEnum, UploadSceneEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting.ts";
import { useMitt } from "@/hooks/useMitt.ts";
import { useWindow } from "@/hooks/useWindow.ts";
import { useUpload } from "@/hooks/useUpload";
import { useImageViewer } from "@/hooks/useImageViewer.ts";
import { useVideoViewer } from "@/hooks/useVideoViewer.ts";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut.ts";
import { UploadFile } from "@/utils/FileUtil.ts";
import { isMobile } from "@/utils/PlatformUtils.ts";
import { getFileSuffix } from "@/utils/FormattingUtils.ts";

defineOptions({ name: "MessageInput" });

const { t } = useI18n();
const settingStore = useSettingStore();
const { openImageViewer } = useImageViewer();
const { openVideoViewer } = useVideoViewer();
const { handleScreenshot } = useGlobalShortcut();
const { createWebviewWindow } = useWindow();
const appWindow = WebviewWindow.getCurrent();
const { uploadFile, onComplete, onError, resumeUpload, getTaskStatus } = useUpload();

interface Props {
  status?: "loading" | "streaming" | "normal";
}

const props = withDefaults(defineProps<Props>(), {
  status: "normal"
});

const emit = defineEmits<{
  (e: "send-message", payload: any): void;
  (e: "cancel-stream"): void;
}>();

interface Attachment {
  type: "image" | "file";
  path: string; // 原始文件路径 (用于发送/预览)
  previewUrl?: string; // 图片预览地址 (asset协议)
  name: string; // 文件名
  taskId?: string; // 记录上传任务 ID
  uploadUrl?: string; // 上传成功后服务器返回的真实 URL
  isUploading?: boolean; // 是否正在上传中
  isError?: boolean; // 标记是否上传失败
}

const DRAFT_KEY = "chat_input_draft";
const maxAttachments = 6;
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"];
const AUDIO_EXTS = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "amr"];
const VIDEO_EXTS = ["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v"];
// 支持向量化的文档与代码格式
const DOC_EXTS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "csv",
  "json",
  "xml",
  "html",
  "css",
  "js",
  "ts",
  "vue",
  "jsx",
  "tsx",
  "py",
  "java",
  "c",
  "cpp",
  "rs",
  "go",
  "sql",
  "sh",
  "yaml",
  "yml",
  "ini"
];
// 用于全局拖拽/粘贴时的统一校验
const ALL_ALLOWED_EXTS = [...IMAGE_EXTS, ...AUDIO_EXTS, ...VIDEO_EXTS, ...DOC_EXTS];
const slashCommands = [
  { icon: "translate", label: "翻译", prompt: "请将以下内容翻译成中文，要求信达雅：" },
  { icon: "code", label: "代码解释", prompt: "请帮我逐行解释下面这段代码的原理：" },
  { icon: "summarize", label: "长文总结", prompt: "请帮我提取以下内容的重点，分点进行总结：" },
  { icon: "prompt", label: "润色优化", prompt: "请帮我重新润色以下文案，使其更加专业、正式：" }
];
// 模拟本地工作区文件列表
const availableContexts = [
  { name: "main.ts", path: "src/main.ts", icon: "i-mdi-language-typescript", type: "file" },
  { name: "App.vue", path: "src/App.vue", icon: "i-mdi-vuejs", type: "file" },
  { name: "package.json", path: "package.json", icon: "i-mdi-code-json", type: "file" },
  { name: "api.ts", path: "src/utils/api.ts", icon: "i-mdi-api", type: "file" },
  {
    name: t("components.messageInput.clipboard"),
    path: "clipboard",
    icon: "i-mdi-clipboard-text-outline",
    type: "clipboard"
  }
];

const messageText = ref("");
const attachments = ref<Attachment[]>([]);
const isThinkActive = ref(false);
const isSearchActive = ref(false);
const showAttachPopover = ref(false);
const showButtonText = ref(true);
const selectedModel = ref("auto");
const showCameraModal = ref(false);
const isVoiceMode = ref(false);
// @ 引用菜单状态
const showMentionMenu = ref(false);
const mentionKeyword = ref("");
// 记录当前上下键选中的菜单项索引
const selectedMenuIndex = ref(0);
// 记录最近发送的文本消息（最多存 20 条）
const sentHistory = ref<string[]>([]);
// 当前在历史记录中回溯的索引 (-1 表示没在回溯)
const historyIndex = ref(-1);

// 根据用户 @ 后面输入的关键词进行实时过滤
const filteredMentions = computed(() => {
  if (!mentionKeyword.value) return availableContexts;
  return availableContexts.filter((item) => item.name.toLowerCase().includes(mentionKeyword.value.toLowerCase()));
});
const showSlashMenu = computed(() => {
  return messageText.value === "/";
});
const isBtnDisabled = computed(() => {
  if (props.status === "loading") return true;
  if (props.status === "streaming") return false;
  return !messageText.value.trim() && attachments.value.length === 0;
});
const modelOptions = computed(() => [
  { label: t("components.messageInput.modelType.auto"), value: "auto" },
  {
    type: "group",
    label: t("components.messageInput.modelType.text"),
    key: "text-models",
    children: []
  },
  {
    type: "group",
    label: t("components.messageInput.modelType.image"),
    key: "image-models",
    children: []
  },
  {
    type: "group",
    label: t("components.messageInput.modelType.audio"),
    key: "audio-models",
    children: []
  },
  {
    type: "group",
    label: t("components.messageInput.modelType.video"),
    key: "video-models",
    children: []
  },
  { label: t("components.messageInput.goSetting"), value: "settings" }
]);

/** 滚动到当前选中的元素（保证键盘下推时元素不会跑出视野） */
const scrollToSelected = () => {
  nextTick(() => {
    const el = document.getElementById(`menu-item-${selectedMenuIndex.value}`);
    if (el) {
      // block: 'nearest' 保证滚动条用最小的移动距离让元素可见
      el.scrollIntoView({ block: "nearest" });
    }
  });
};

/**
 * 接管输入框的全局键盘事件
 * @param e 键盘事件
 */
const handleKeydown = (e: KeyboardEvent) => {
  // 输入法防误触！如果是处于拼音输入法组合状态，直接放行，绝不拦截回车
  if (e.isComposing) return;
  const isMenuVisible = showMentionMenu.value || showSlashMenu.value;

  // 如果菜单正在显示，优先接管 上下、回车、ESC 键
  if (isMenuVisible) {
    // 获取当前显示列表的长度，用于计算上下切换的索引
    const listLength = showMentionMenu.value ? filteredMentions.value.length : slashCommands.length;

    if (e.key === "ArrowDown") {
      e.preventDefault(); // 阻止输入框内光标移动
      selectedMenuIndex.value = (selectedMenuIndex.value + 1) % listLength;
      scrollToSelected();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedMenuIndex.value = (selectedMenuIndex.value - 1 + listLength) % listLength;
      scrollToSelected();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault(); // 阻止回车发送消息或换行
      if (showMentionMenu.value) {
        const selectedItem = filteredMentions.value[selectedMenuIndex.value];
        if (selectedItem) selectMention(selectedItem);
      } else if (showSlashMenu.value) {
        const selectedItem = slashCommands[selectedMenuIndex.value];
        if (selectedItem) applySlashCommand(selectedItem.prompt);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      showMentionMenu.value = false;
      if (showSlashMenu.value) {
        messageText.value = ""; // 因为 slash 菜单是由文本 "/" 触发的，清空即关闭
      }
      return;
    }
    return; // 菜单显示时，直接 return 阻断后续的历史回溯
  }

  // 智能退格键！当没有文字时，按退格键删掉最后一个附件
  if (e.key === "Backspace" && messageText.value === "" && attachments.value.length > 0) {
    e.preventDefault();
    attachments.value.pop(); // 弹出最后一个附件
    return;
  }

  // 历史记录回溯 (ArrowUp)
  // 触发条件：没有显示菜单 + (输入框为空 或者 正在回溯中)
  if (e.key === "ArrowUp" && (messageText.value === "" || historyIndex.value !== -1)) {
    e.preventDefault();
    if (historyIndex.value < sentHistory.value.length - 1) {
      historyIndex.value++;
      messageText.value = sentHistory.value[historyIndex.value];
    }
    return;
  }

  // 历史记录前进 (ArrowDown)
  if (e.key === "ArrowDown" && historyIndex.value !== -1) {
    e.preventDefault();
    if (historyIndex.value > 0) {
      historyIndex.value--;
      messageText.value = sentHistory.value[historyIndex.value];
    } else {
      // 退回最底部了，清空输入框
      historyIndex.value = -1;
      messageText.value = "";
    }
    return;
  }

  // 如果菜单没显示，且按下的是回车键，则走正常的发送逻辑
  if (e.key === "Enter") {
    handleEnterKey(e);
  }
};

/**
 * 处理 @ 引用点击事件
 * @param item 选中的引用项
 */
const selectMention = async (item: any) => {
  // 1. 把输入框里刚才打的 @xxx 给删掉
  messageText.value = messageText.value.replace(/@([^\s]*)$/, "");

  // 2. 如果选的是剪贴板，特殊处理：读取剪贴板文字直接塞进输入框
  if (item.type === "clipboard") {
    try {
      const clipboardText = await navigator.clipboard.readText();
      messageText.value += clipboardText;
    } catch (e) {
      window.$message?.warning(t("components.messageInput.msg.clipboardReadFailed"));
    }
  }
  // 3. 如果选的是文件，完美复用你之前的附件系统！直接变成文件卡片！
  else {
    // 检查是否已经添加过，防止重复添加
    const exists = attachments.value.find((a) => a.name === item.name);
    if (!exists) {
      if (attachments.value.length >= maxAttachments) {
        window.$message?.warning(t("components.messageInput.msg.maxAttachments", { count: maxAttachments }));
      } else {
        attachments.value.push({
          type: "file",
          path: item.path, // 真实的物理路径
          name: item.name
        });
      }
    }
  }

  showMentionMenu.value = false;

  // 选完后自动让输入框重新聚焦
  nextTick(() => {
    const inputEl = document.querySelector(".input-container textarea") as HTMLTextAreaElement;
    if (inputEl) inputEl.focus();
  });
};

/**
 * 应用快捷指令
 * @param promptText 快捷指令的提示文本
 */
const applySlashCommand = (promptText: string) => {
  messageText.value = promptText + "\n";
  // 选完后自动聚焦回输入框，方便用户继续输入
  nextTick(() => {
    const inputEl = document.querySelector(".input-container textarea") as HTMLTextAreaElement;
    if (inputEl) {
      inputEl.focus();
    }
  });
};

/**
 * 统一处理附件点击 (预览)
 * @param item 点击的附件项
 */
const handleAttachmentClick = async (item: Attachment) => {
  // 1. 图片预览
  if (item.type === "image" && item.previewUrl) {
    const imageList = attachments.value
      .filter((att) => att.type === "image" && att.previewUrl)
      .map((att) => att.previewUrl as string);
    openImageViewer(item.previewUrl, imageList);
    return;
  }

  // 2. 视频预览
  const ext = item.name.split(".").pop()?.toLowerCase();
  if (ext && VIDEO_EXTS.includes(ext)) {
    // 提取附件列表中的所有视频路径
    const videoList = attachments.value
      .filter((att) => {
        const e = att.name.split(".").pop()?.toLowerCase();
        return e && VIDEO_EXTS.includes(e);
      })
      .map((att) => att.path);

    // 打开视频预览窗口
    openVideoViewer(item.path, videoList);
    return;
  }

  // 3. 文档预览
  if (item.type === "file") {
    await openDocumentPreview(item);
  }
};

/**
 * 发送窗口 Payload 辅助函数
 * @param windowLabel 窗口标签
 * @param payload 要发送的 Payload 数据
 */
const sendWindowPayload = async (windowLabel: string, payload: any) => {
  if (isMobile()) {
    return Promise.resolve();
  }
  // 调用后端 Rust 命令暂存 Payload
  return invoke<void>(TauriCommandEnum.PUSH_WINDOW_PAYLOAD, {
    label: windowLabel,
    payload
  });
};

/**
 * 打开文档预览窗口
 * @param item 要预览的文件附件项
 */
const openDocumentPreview = async (item: Attachment) => {
  const windowLabel = "previewFile";
  const title = "预览文件";
  const suffix = getFileSuffix(item.name);

  // 构造 Payload
  const payload = {
    uid: "current_user_id",
    conversationId: "current_conversation_id",
    resourceFile: {
      fileName: item.name,
      absolutePath: item.path, // 本地绝对路径
      nativePath: item.path,
      url: convertFileSrc(item.path), // asset:// URL
      localExists: true,
      type: {
        ext: suffix,
        mime: ""
      }
    }
  };

  try {
    // 1. 发送 Payload 到 Rust
    await sendWindowPayload(windowLabel, payload);

    // 2. 检查或创建窗口
    const existingWin = await WebviewWindow.getByLabel(windowLabel);
    if (existingWin) {
      console.log("预览窗口已存在，发送更新事件", payload);
      await existingWin.emit("preview-file-update", { payload });
      await existingWin.setFocus();
    } else {
      console.log("创建新预览窗口", payload);
      await createWebviewWindow(title, windowLabel, 900, 720, "", true);
    }
  } catch (error) {
    console.error("打开文档预览失败:", error);
    window.$message.error(t("components.messageInput.msg.previewFailed"));
  }
};

/**
 * 选择文件 (动态设置 Tauri 操作系统过滤白名单)
 * @param isImage 是否仅仅选择图片
 */
const selectFiles = async (isImage: boolean) => {
  if (attachments.value.length >= maxAttachments) {
    window.$message.warning(t("components.messageInput.msg.maxAttachments", { count: maxAttachments }));
    return;
  }
  try {
    const filters = isImage
      ? [{ name: "Images", extensions: IMAGE_EXTS }]
      : [{ name: "Supported Files", extensions: [...DOC_EXTS, ...AUDIO_EXTS, ...VIDEO_EXTS] }];

    const selected = await open({
      multiple: true,
      directory: false,
      filters: filters
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      const remainingSlots = maxAttachments - attachments.value.length;
      if (paths.length > remainingSlots) {
        window.$message.warning(t("components.messageInput.msg.remainingAttachments", { count: remainingSlots }));
        paths.length = remainingSlots;
      }

      let rejectedCount = 0;

      for (const path of paths) {
        const name = path.split(/[\\/]/).pop() || "unknown";
        const ext = name.split(".").pop()?.toLowerCase() || "";

        if (!ALL_ALLOWED_EXTS.includes(ext)) {
          rejectedCount++;
          continue;
        }

        // 获取真实物理文件大小并拦截 10MB
        const fileStat = await stat(path);
        if (fileStat.size > 10 * 1024 * 1024) {
          window.$message.warning(t("components.messageInput.msg.maxSizeExceeded", { name }));
          continue;
        }

        // 构造符合 hook 要求的 ExtendedFile
        const mockFile = {
          name,
          size: fileStat.size,
          path, // Hook 内部会根据这个 path 走 Rust 直传
          lastModified: fileStat.mtime?.getTime() || Date.now(),
          slice: () => new Blob() // 兜底防止报错
        } as unknown as File;

        // 触发异步上传
        const taskId = await uploadFile(mockFile, UploadSceneEnum.CHAT);

        const isImg = IMAGE_EXTS.includes(ext);
        attachments.value.push({
          type: isImg ? "image" : "file",
          path: path,
          previewUrl: isImg ? convertFileSrc(path) : undefined,
          name: name,
          taskId,
          isUploading: true // 标记处于上传状态
        });
      }

      if (rejectedCount > 0) {
        window.$message.error(t("components.messageInput.msg.filterDangerFiles", { count: rejectedCount }));
      }
    }
  } catch (err) {
    console.error("Failed to open dialog:", err);
  }
};

/**
 * 全局文件拖放处理
 * @param files 拖放的文件数组
 */
const handleGlobalFilesDrop = async (files: UploadFile[]) => {
  if (!files || files.length === 0) return;
  const remainingSlots = maxAttachments - attachments.value.length;
  if (remainingSlots <= 0) return;

  const filesToProcess = files.length > remainingSlots ? files.slice(0, remainingSlots) : files;

  let rejectedCount = 0;

  for (const file of filesToProcess) {
    let name = "";
    let path = "";
    let size = 0;
    let actualFile: any = file;

    // 区分是 Tauri 拖拽的物理路径，还是浏览器的 File 对象
    if ("kind" in file && file.kind === "path") {
      name = file.name;
      path = file.path;
      const fileStat = await stat(path);
      size = fileStat.size;
      actualFile = {
        name,
        size,
        path,
        lastModified: fileStat.mtime?.getTime() || Date.now(),
        slice: () => new Blob()
      };
    } else if (file instanceof File) {
      name = file.name;
      path = URL.createObjectURL(file);
      size = file.size;
    }

    const ext = name.split(".").pop()?.toLowerCase() || "";

    if (!ALL_ALLOWED_EXTS.includes(ext)) {
      rejectedCount++;
      continue;
    }

    // 大小限制 10MB
    if (size > 10 * 1024 * 1024) {
      window.$message.warning(t("components.messageInput.msg.maxSizeExceeded", { name }));
      continue;
    }

    // 触发异步上传
    const taskId = await uploadFile(actualFile as File, UploadSceneEnum.CHAT);

    const isImage = IMAGE_EXTS.includes(ext);
    attachments.value.push({
      type: isImage ? "image" : "file",
      path: path,
      previewUrl: isImage ? (path.startsWith("blob:") ? path : convertFileSrc(path)) : undefined,
      name: name,
      taskId,
      isUploading: true // 标记状态
    });
  }

  if (rejectedCount > 0) {
    window.$message.error(t("components.messageInput.msg.filterDangerFiles", { count: rejectedCount }));
  }
};

/**
 * 处理相机确认，添加图片附件
 * @param base64Photo 相机捕获的 base64 图片
 */
const handleCameraConfirm = (base64Photo: string) => {
  if (attachments.value.length >= maxAttachments) {
    window.$message.warning(t("components.messageInput.msg.maxAttachments", { count: maxAttachments }));
    return;
  }
  attachments.value.push({
    type: "image",
    path: base64Photo,
    previewUrl: base64Photo,
    name: `photo_${Date.now()}.png`
  });
};

/** 发送消息 */
const sendMessage = () => {
  if (props.status === "streaming" || props.status === "loading") {
    emit("cancel-stream");
    return;
  }
  if (isBtnDisabled.value) return;

  // 如果有文件还在上传中，禁止发送并提示用户
  if (attachments.value.some((a) => a.isUploading)) {
    window.$message.warning(t("components.messageInput.msg.waitUploading"));
    return;
  }

  const text = messageText.value.trim();

  const imagePaths: string[] = [];
  const videoPaths: string[] = [];
  const audioPaths: string[] = [];
  const filePaths: string[] = [];

  attachments.value.forEach((item) => {
    // 优先取服务端返回的在线 uploadUrl，如果万一没有，才降级使用本地路径
    const finalUrl = item.uploadUrl || item.previewUrl || convertFileSrc(item.path);

    const ext = item.name.split(".").pop()?.toLowerCase() || "";
    if (item.type === "image") {
      imagePaths.push(finalUrl);
    } else {
      // 直接用数组 includes 替代正则表达式！
      if (VIDEO_EXTS.includes(ext)) {
        videoPaths.push(finalUrl);
      } else if (AUDIO_EXTS.includes(ext)) {
        audioPaths.push(finalUrl);
      } else {
        filePaths.push(finalUrl);
      }
    }
  });

  // 4. 构造标准化的混合消息体 (MixedContent)
  let msgContent: any = {
    text: text,
    images: imagePaths.length > 0 ? imagePaths : undefined,
    videos: videoPaths.length > 0 ? videoPaths : undefined,
    audios: audioPaths.length > 0 ? audioPaths : undefined,
    files: filePaths.length > 0 ? filePaths : undefined // 纯文件
  };

  // 5. 简化类型：如果只有纯文本，就不发对象了
  const hasAttachments = imagePaths.length + videoPaths.length + audioPaths.length + filePaths.length > 0;

  if (!hasAttachments && text) {
    msgContent = text;
  }

  // 6. 发送消息
  const finalMessage = {
    type: hasAttachments ? "mixed" : "text",
    content: msgContent,
    options: {
      useReasoning: isThinkActive.value,
      useNetwork: isSearchActive.value
    }
  };

  emit("send-message", finalMessage);

  // 将本次发送的纯文本存入历史记录（排除全空和连续重复的内容）
  if (text && sentHistory.value[0] !== text) {
    sentHistory.value.unshift(text); // 插到最前面
    if (sentHistory.value.length > 20) {
      sentHistory.value.pop(); // 限制最多存 20 条
    }
  }

  messageText.value = "";
  attachments.value = [];
  historyIndex.value = -1; // 发送完毕，重置回溯索引
  // 清除草稿
  localStorage.removeItem(DRAFT_KEY);
};

/**
 * 处理窗口大小变化，动态显示按钮文本
 * @param width 窗口宽度
 */
const handleResize = ({ width }: { width: number }) => {
  showButtonText.value = width >= 588;
};

/**
 * 处理菜单点击事件
 * @param menuItem 点击的菜单项
 */
const handleMenuClick = async (menuItem: string) => {
  showAttachPopover.value = false;
  switch (menuItem) {
    case "file":
      await selectFiles(false);
      break;
    case "photo":
      await selectFiles(true);
      break;
    case "screenshot":
      handleScreenshot();
      break;
    case "camera":
      showCameraModal.value = true;
      break;
  }
};

/**
 * 渲染选择选项的标签
 * @param option 选择选项
 * @returns 渲染后的标签元素
 */
const renderLabel = (option: SelectOption) => {
  return h(
    NEllipsis,
    { tooltip: { keepAliveOnHover: false }, style: { maxWidth: "100%" } },
    { default: () => option.label as string }
  );
};

/**
 * 处理键盘事件，触发发送消息
 * @param e 键盘事件对象
 */
const handleEnterKey = (e: KeyboardEvent) => {
  const sendKey = settingStore.chat.sendKey;
  if ((sendKey === "Enter" && !e.shiftKey) || (sendKey === "Shift+Enter" && e.shiftKey)) {
    e.preventDefault();
    sendMessage();
  }
};

/**
 * 处理剪贴板粘贴事件
 * @param e 剪贴板事件对象
 */
const handlePaste = (e: ClipboardEvent) => {
  if (!e.clipboardData || !e.clipboardData.items) return;

  const items = e.clipboardData.items;
  const filesToUpload: File[] = [];

  // 遍历剪贴板内容，找出所有文件（比如截图、复制的本地文件）
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === "file") {
      const file = items[i].getAsFile();
      if (file) {
        filesToUpload.push(file);
      }
    }
  }

  // 如果剪贴板里确实有文件，则阻止默认的粘贴行为（防止某些特殊情况下把图片当成 base64 字符串粘贴进文本框）
  if (filesToUpload.length > 0) {
    e.preventDefault();
    // 完美复用你之前写好的拖拽处理逻辑
    handleGlobalFilesDrop(filesToUpload as any);
  }
};

/**
 * 删除附件
 * @param index 要删除的附件索引
 */
const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1);
};

/**
 * 处理语音点击事件，切换到语音输入模式
 */
const handleVoiceClick = () => {
  isVoiceMode.value = true;
};

/**
 * 处理语音取消事件，切换到文本输入模式
 */
const handleVoiceCancel = () => {
  isVoiceMode.value = false;
};

/**
 * 直接发送语音数据
 * @param voiceData 语音数据
 */
const sendVoiceDirect = (voiceData: any) => {
  console.log(voiceData);
};

/**
 * 处理模型选择变化事件
 * @param value 选择的模型值
 */
const handleModelChange = (value: string) => {
  if (value === "settings") {
    // TODO: 跳转到模型设置页面
    console.log("跳转到模型设置页面");
    return;
  }
  selectedModel.value = value;
};

/**
 * 处理填充输入框事件
 * @param text 要填充的文本
 */
const handleFillInput = (text: string) => {
  messageText.value = text;
  // 填充后让文本框自动获得焦点 TODO: 是否自动发送
  nextTick(() => {
    const inputEl = document.querySelector(".input-container textarea") as HTMLTextAreaElement;
    if (inputEl) {
      inputEl.focus();
      inputEl.selectionStart = inputEl.value.length;
      inputEl.selectionEnd = inputEl.value.length;
    }
  });
};

/**
 * 点击重新上传的方法
 * @param item 文件
 */
const retryUpload = (item: Attachment) => {
  if (!item.taskId) return;
  // 恢复 UI 状态
  item.isError = false;
  item.isUploading = true;
  // 直接调用 Hook 提供的断点续传/重试核心方法
  resumeUpload(item.taskId);
};

onComplete((res) => {
  const att = attachments.value.find((a) => a.taskId === res.taskId);
  if (att) {
    att.uploadUrl = res.url;
    att.isUploading = false;
  }
});

// 错误监听与状态映射
onError((err) => {
  console.error("上传失败:", err);
  window.$message?.error(t("components.messageInput.msg.uploadFailed"));
  // 遍历寻找触发失败的任务
  attachments.value.forEach((att) => {
    // 利用 getTaskStatus 查询该任务在 Hook 里的状态
    if (att.taskId && getTaskStatus(att.taskId) === "failed") {
      att.isUploading = false;
      att.isError = true;
    }
  });
});

// 监听菜单状态或搜索词的变化，每次变化时重置选中的索引为 0
watch([showMentionMenu, showSlashMenu, filteredMentions], () => {
  selectedMenuIndex.value = 0;
});

// 监听输入框内容，判断是否唤起 @ 菜单
watch(messageText, (newVal) => {
  // 匹配以 @ 开头，且后面跟着非空字符（不含空格）的字符串，直到光标末尾
  const match = newVal.match(/@([^\s]*)$/);
  if (match) {
    showMentionMenu.value = true;
    mentionKeyword.value = match[1]; // 提取 @ 后面的搜索词
  } else {
    showMentionMenu.value = false;
  }
});

watch(messageText, (newVal) => {
  if (newVal.trim()) {
    localStorage.setItem(DRAFT_KEY, newVal);
  } else {
    localStorage.removeItem(DRAFT_KEY);
  }
});

useMitt.on(MittEnum.FILL_MESSAGE_INPUT, handleFillInput);

onMounted(() => {
  useMitt.on(MittEnum.GLOBAL_FILES_DROP, handleGlobalFilesDrop);

  appWindow.listen("screenshot", async (e: any) => {
    if (attachments.value.length >= maxAttachments) {
      window.$message.warning(t("components.messageInput.msg.maxAttachments", { count: maxAttachments }));
      return;
    }
    try {
      const buffer = new Uint8Array(e.payload.buffer);
      const blob = new Blob([buffer], { type: e.payload.mimeType });
      const file = new File([blob], "screenshot.png", { type: e.payload.mimeType });
      const url = URL.createObjectURL(file);
      attachments.value.push({
        type: "image",
        path: url,
        previewUrl: url,
        name: `Screenshot_${new Date().getTime()}.png`
      });
    } catch (error) {
      console.error("处理截图失败:", error);
    }
  });
  // 读取草稿并恢复
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft) {
    messageText.value = savedDraft;
  }
});

onUnmounted(() => {
  useMitt.off(MittEnum.GLOBAL_FILES_DROP, handleGlobalFilesDrop);
});
</script>

<style scoped>
.input-container {
  /* 使用 CSS 变量适配边框颜色 */
  border: 1px solid var(--line-color);
  transition: border-color 0.3s var(--n-bezier);
}

.input-container:focus-within {
  /* 聚焦时的颜色 */
  border-color: #3b82f6;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
