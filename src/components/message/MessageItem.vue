<template>
  <div
    class="message-row mb-6 box-border flex w-full transition-all duration-200"
    :class="[selectionMode ? 'cursor-pointer rounded-lg p-3 hover:bg-[--tray-hover]' : '']"
    @click="selectionMode ? $emit('toggle-select', message.id) : null">
    <div v-if="selectionMode" class="mt-1 mr-2 flex w-8 flex-shrink-0 items-center justify-center">
      <n-checkbox size="large" :checked="selected" />
    </div>

    <div class="flex min-w-0 flex-grow" :class="isSelf ? 'justify-end' : 'justify-start'">
      <div v-if="!isSelf" class="avatar-col mr-3 flex-shrink-0" :class="{ 'pointer-events-none': selectionMode }">
        <div class="h-9 w-9 overflow-hidden rounded-full bg-[--line-color]">
          <img class="h-full w-full object-cover" :src="message.avatar" />
        </div>
      </div>

      <div class="content-col flex max-w-[85%] min-w-0 flex-col" :class="isSelf ? 'items-end' : 'items-start'">
        <div v-if="!isSelf" class="mb-1 ml-1 text-xs text-[--user-text-color]">
          {{ message.sender || t("components.messageItem.ai") }}
        </div>

        <context-menu :menu="selectionMode ? [] : contextMenuOptions" @select="handleContextMenuSelect">
          <div
            style="max-width: 100%"
            class="bubble-container box-border flex w-fit min-w-0 flex-col gap-1 overflow-hidden rounded-xl border shadow-sm transition-all duration-300 select-text"
            :class="[
              bubbleClasses,
              isEditing
                ? 'w-[95%] min-w-[300px] !border-[--line-color] !bg-[--tray-bg-color] p-1 shadow-md sm:w-[400px]'
                : 'p-3',
              selectionMode ? 'pointer-events-none' : ''
            ]"
            @contextmenu="handleBubbleContext">
            <div v-if="isEditing" class="pointer-events-auto flex w-full flex-col p-1.5">
              <div class="px-2">
                <n-input
                  type="textarea"
                  autosize
                  autofocus
                  class="edit-textarea w-full !bg-transparent"
                  v-model:value="editText"
                  :bordered="false"
                  :placeholder="t('components.messageItem.placeholder')" />
              </div>
              <div class="mt-2 flex justify-end gap-2 border-t border-[--line-color] px-1 pt-2">
                <div
                  class="cursor-pointer rounded-md border border-[--line-color] bg-[--input-area-bg] px-3 py-1 text-xs text-[--user-text-color] transition-colors hover:bg-[--line-color]"
                  @click="cancelEdit">
                  {{ t("components.common.cancel") }}
                </div>
                <div
                  class="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-xs whitespace-nowrap text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
                  @click="submitEdit">
                  {{ t("components.messageItem.resend") }}
                </div>
              </div>
            </div>

            <template v-else>
              <div class="relative w-full">
                <n-tooltip v-if="isSelf && showCollapseToggle" placement="bottom-end">
                  <template #trigger>
                    <div
                      class="absolute -top-1 -right-1 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/15 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/25"
                      @click.stop="isCollapsed = !isCollapsed">
                      <i-mdi-chevron-down v-if="isCollapsed" class="h-4 w-4" />
                      <i-mdi-chevron-up v-else class="h-4 w-4" />
                    </div>
                  </template>
                  {{ isCollapsed ? t("components.messageItem.expand") : t("components.messageItem.collapse") }}
                </n-tooltip>

                <div
                  ref="contentRef"
                  class="w-full overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  :class="[
                    isSelf && isCollapsed && showCollapseToggle ? 'max-h-[140px]' : 'max-h-[5000px]',
                    isSelf && showCollapseToggle ? 'pr-7' : ''
                  ]">
                  <div
                    v-if="
                      !isSelf &&
                      !message.content &&
                      !message.thinking &&
                      (!message.toolCalls || message.toolCalls.length === 0)
                    "
                    class="flex h-6 items-center gap-1.5 px-1 py-1">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                  </div>
                  <template v-else>
                    <div
                      v-for="block in blocks"
                      class="w-full"
                      :key="block.id"
                      @contextmenu="handleBlockContext(block)">
                      <thinking-block
                        v-if="block.type === 'thinking'"
                        :content="block.content"
                        :duration="block.duration"
                        :tool-calls="block.toolCalls" />

                      <div
                        v-else-if="block.type === 'text' && isSelf"
                        v-text="block.content"
                        class="text-[13px] leading-relaxed break-words whitespace-pre-wrap"></div>

                      <markdown-block
                        v-else-if="block.type === 'text' && !isSelf"
                        :content="block.content"
                        :is-self="isSelf" />

                      <image-block v-else-if="block.type === 'image'" :url="block.url" />
                      <video-block v-else-if="block.type === 'video'" :url="block.url" :cover-img="block.coverImg" />
                      <audio-block v-else-if="block.type === 'audio'" :url="block.url" />
                      <file-block
                        v-else-if="block.type === 'file'"
                        :url="block.url"
                        :name="block.name"
                        :is-self="isSelf" />

                      <div
                        v-if="!isSelf && pendingTool"
                        class="pointer-events-auto mt-2 flex flex-col gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                        <div class="flex-y-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                          <i-mdi-shield-alert-outline class="h-4 w-4" />
                          {{ t("components.messageItem.systemPermissionRequest") }}
                        </div>
                        <div class="text-xs text-[--text-color] opacity-90">
                          {{ t("components.messageItem.executeLocalTool") }}
                          <strong>{{ pendingTool.name }}</strong>
                          {{ t("components.messageItem.executeLocalToolDesc") }}
                        </div>
                        <div class="mt-1 flex-end-center gap-2">
                          <div
                            class="cursor-pointer rounded-md bg-[--input-area-bg] px-3 py-1 text-xs text-[--user-text-color] transition-colors hover:bg-[--line-color]"
                            @click="$emit('deny-tool', pendingTool)">
                            {{ t("components.messageItem.denyExecuteLocalTool") }}
                          </div>
                          <div
                            class="cursor-pointer rounded-md bg-orange-500 px-3 py-1 text-xs text-white shadow-sm transition-colors hover:bg-orange-600"
                            @click="$emit('allow-tool', pendingTool)">
                            {{ t("components.messageItem.allowExecuteLocalTool") }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <citation-block
                    v-if="!isSelf && message.citations && message.citations.length > 0"
                    :citations="message.citations" />
                </div>

                <div
                  v-if="isSelf && isCollapsed && showCollapseToggle"
                  style="background: linear-gradient(to top, var(--message-render-color) 0%, transparent 100%)"
                  class="pointer-events-none absolute right-0 bottom-0 left-0 h-10 rounded-b-lg"></div>
              </div>
            </template>
          </div>
        </context-menu>

        <div
          v-show="!selectionMode"
          class="mt-1 flex w-full items-center justify-between px-1"
          :class="isSelf ? 'flex-row-reverse' : ''">
          <div class="scrollbar-none flex-y-center gap-3 overflow-x-auto">
            <div v-if="!isSelf && message.versionCount && message.versionCount > 1" class="flex-y-center gap-1">
              <i-material-symbols-keyboard-arrow-left
                class="action-icon"
                :class="{ 'pointer-events-none opacity-30': message.currentVersion === 1 }"
                @click="handlePrevVersion" />
              <span class="font-mono text-xs text-[--user-text-color]">
                {{ message.currentVersion }}/{{ message.versionCount }}
              </span>
              <i-material-symbols-keyboard-arrow-right
                class="action-icon"
                :class="{ 'pointer-events-none opacity-30': message.currentVersion === message.versionCount }"
                @click="handleNextVersion" />
            </div>

            <div class="flex-y-center gap-2">
              <div class="relative flex-center">
                <i-material-symbols-check v-if="isCopied" class="text-sm text-green-500" />
                <i-material-symbols-content-copy v-else class="action-icon text-sm" @click="handleCopyMessage" />
              </div>
              <i-material-symbols-edit-outline
                v-if="isSelf && !isEditing"
                class="action-icon text-sm"
                :title="t('components.messageItem.editAndResend')"
                @click="startEdit" />
              <template v-if="!isSelf">
                <i-material-symbols-refresh class="action-icon text-sm" @click="$emit('refresh-message', message.id)" />
                <i-material-symbols-thumb-up class="action-icon text-sm" @click="$emit('like-message', message.id)" />
                <i-material-symbols-thumb-down
                  class="action-icon text-sm"
                  @click="$emit('dislike-message', message.id)" />
                <i-material-symbols-share class="action-icon text-sm" @click="$emit('share-message', message.id)" />
              </template>
            </div>
          </div>
          <div class="flex-shrink-0 text-[10px] text-[--user-text-color] opacity-80" :class="isSelf ? 'mr-4' : 'ml-4'">
            {{ message.time }}
          </div>
        </div>
      </div>

      <div v-if="isSelf" class="avatar-col ml-3 flex-shrink-0" :class="{ 'pointer-events-none': selectionMode }">
        <div class="h-9 w-9 overflow-hidden rounded-full bg-[--line-color]">
          <img class="h-full w-full object-cover" :src="message.avatar" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Image } from "@tauri-apps/api/image";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { writeText, writeImage } from "@tauri-apps/plugin-clipboard-manager";

import type { MessageData } from "@/types/chat";
import { normalizeMessage } from "@/utils/MessageAdapter";

defineOptions({
  name: "MessageItem"
});

const { t } = useI18n();

const props = defineProps<{
  message: MessageData;
  selectionMode?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits([
  "copy-message",
  "refresh-message",
  "like-message",
  "dislike-message",
  "share-message",
  "prev-message",
  "next-message",
  "resend-message",
  "enter-multi-select",
  "toggle-select",
  "allow-tool",
  "deny-tool"
]);

const activeBlock = ref<any>(null);
const isEditing = ref(false);
const editText = ref("");
const isCollapsed = ref(true); // 默认折叠
const showCollapseToggle = ref(false); // 是否需要显示右上角按钮
const contentRef = ref<HTMLElement | null>(null);

const isSelf = computed(() => props.message.role === "user");
const blocks = computed(() => normalizeMessage(props.message));
const bubbleClasses = computed(() => {
  return isSelf.value
    ? "bg-[--message-render-color] text-white border-transparent self-message-bubble"
    : "bg-[--input-area-bg] text-[--text-color] border-[--line-color]";
});
// 基于上下文动态生成右键菜单
const contextMenuOptions = computed(() => {
  const options = [];

  if (isSelf.value) {
    options.push({ label: t("components.messageItem.label.edit"), key: "edit" });
  }

  const target = activeBlock.value;

  if (target) {
    // 鼠标明确点在了某个组件上
    if (["text", "thinking"].includes(target.type)) {
      options.push({ label: t("components.messageItem.label.copy"), key: "copy" });
      options.push({ label: t("components.messageItem.label.read"), key: "read" });
      options.push({ label: t("components.messageItem.label.favorite"), key: "favorite" });
    } else if (target.type === "image") {
      options.push({ label: t("components.messageItem.label.copyMedia"), key: "copy_media" });
      options.push({ label: t("components.messageItem.label.saveMedia"), key: "save_media" });
    } else if (["video", "audio", "file"].includes(target.type)) {
      options.push({ label: t("components.messageItem.label.saveMedia"), key: "save_media" });
    }
  } else {
    // 鼠标点在了气泡空白处：提供一个保底的全局复制功能
    const hasText = blocks.value.some((b: any) => ["text", "thinking"].includes(b.type));
    if (hasText) {
      options.push({ label: t("components.messageItem.label.copyAllText"), key: "copy" });
    }
  }
  // 删除功能永远可用，因为它是针对整条消息的
  options.push({ label: t("components.messageItem.label.delete"), key: "delete" });
  return options;
});
const pendingTool = computed(() => {
  if (props.message.toolCalls && props.message.toolCalls.length > 0) {
    return props.message.toolCalls.find((t) => t.status === "pending");
  }
  return null;
});

/**
 * 鼠标悬浮并右键点击到具体的积木时，记录该块
 * @param block 具体的积木块
 */
const handleBlockContext = (block: any) => {
  activeBlock.value = block;
};

/**
 * 如果右键点在了气泡的空隙(padding)处，清空当前积木，使用全局默认菜单
 * @param e 鼠标事件
 */
const handleBubbleContext = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    activeBlock.value = null;
  }
};

/**
 * 处理右键菜单点击事件
 * @param item 点击的菜单项
 */
const handleContextMenuSelect = (item: any) => {
  const key = item.key || item;
  switch (key) {
    case "edit":
      startEdit();
      break;
    case "copy":
      handleCopyMessage();
      break;
    case "copy_media":
      handleCopyMedia();
      break;
    case "save_media":
      handleSaveMedia();
      break;
    case "delete":
      emit("enter-multi-select", props.message.id);
      break;
    case "read":
      console.log("触发朗读功能");
      break;
    case "favorite":
      console.log("触发收藏功能");
      break;
  }
};

/** 保存逻辑 */
const handleSaveMedia = async () => {
  // 只保存当前用户右键的那一个具体文件
  const block = activeBlock.value;
  if (!block || !["image", "video", "audio", "file"].includes(block.type)) return;

  try {
    const url = block.url;
    // 1. 尝试从原名或 URL 中提取文件名
    let defaultName = block.name || url.split(/[#?]/)[0].split("/").pop() || `download_${Date.now()}`;

    // 2. 检查是否缺少后缀名 (找不到 '.'，或者 '.' 在第一位)
    if (defaultName.lastIndexOf(".") <= 0) {
      // 建立类型到后缀的映射字典
      const extMap: Record<string, string> = {
        image: ".png", // 图片默认存为 png
        video: ".mp4", // 视频默认存为 mp4
        audio: ".mp3", // 音频默认存为 mp3
        file: ".bin" // 未知文件兜底存为 bin 数据包
      };
      // 追加默认后缀
      defaultName += extMap[block.type] || "";
    }

    // 3. 呼出系统保存对话框
    const savePath = await save({ defaultPath: defaultName, title: "保存文件" });
    if (!savePath) return;

    // 4. 下载并写入磁盘
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    await writeFile(savePath, new Uint8Array(arrayBuffer));
    window.$message?.success(t("components.messageItem.msg.saveSuccess", { path: savePath }));
  } catch (error) {
    console.error("Tauri 保存失败:", error);
    window.$message?.error(t("components.messageItem.msg.saveFailed"));
  }
};

/** 复制图片逻辑 */
const handleCopyMedia = async () => {
  const block = activeBlock.value;
  if (!block || block.type !== "image") return;

  try {
    const url = block.url;

    // 1. 借助浏览器的能力，将任意格式图片 (JPG/WEBP/GIF) 加载到内存中
    const img = new window.Image(); // 注意这里是浏览器的 Image，不是 Tauri 的 Image
    img.crossOrigin = "anonymous";
    img.src = url;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // 2. 利用 Canvas 将其绘制并强制转换为标准的 PNG 格式
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Canvas 转换失败");

    // 3. 将纯正的 PNG Blob 转为字节流
    const arrayBuffer = await blob.arrayBuffer();

    // 4. 交给 Tauri 的 Image 对象解析
    const tauriImage = await Image.fromBytes(new Uint8Array(arrayBuffer));

    // 5. 写入系统原生剪贴板
    await writeImage(tauriImage);

    window.$message?.success(t("components.messageItem.msg.copySuccess"));
  } catch (error) {
    console.error("图片复制失败:", error);
    window.$message?.error(t("components.messageItem.msg.copyFailed"));
  }
};

/** 文本复制逻辑 */
const isCopied = ref(false);
const handleCopyMessage = async () => {
  if (isCopied.value) return;
  try {
    let textToCopy = "";
    const target = activeBlock.value;
    if (target && (target.type === "text" || target.type === "thinking")) {
      // 1. 如果用户明确右键了某段文字/思考，只复制那一段
      textToCopy = target.content;
    } else {
      // 2. 如果用户点的是气泡空白处，或点击面板下方的全局复制按钮，则提取所有文字
      for (const block of blocks.value) {
        if (block.type === "text" || block.type === "thinking") {
          textToCopy += block.content + "\n\n";
        }
      }
    }

    textToCopy = textToCopy.trim();
    if (!textToCopy) {
      textToCopy =
        typeof props.message.content === "string" ? props.message.content : JSON.stringify(props.message.content);
    }

    await writeText(textToCopy);
    isCopied.value = true;
    setTimeout(() => (isCopied.value = false), 2000);
  } catch (error) {
    console.error("复制失败:", error);
  }
};

/** 编辑文本 */
const startEdit = () => {
  let currentText = "";
  for (const block of blocks.value) {
    if (block.type === "text") currentText += block.content;
  }
  editText.value = currentText || (typeof props.message.content === "string" ? props.message.content : "");
  isEditing.value = true;
};

/** 取消编辑 */
const cancelEdit = () => {
  isEditing.value = false;
  editText.value = "";
};
const submitEdit = () => {
  if (!editText.value.trim()) return;
  emit("resend-message", { id: props.message.id, content: editText.value });
  isEditing.value = false;
};

/** 版本控制逻辑 */
const handlePrevVersion = () =>
  props.message.currentVersion && props.message.currentVersion > 1 && emit("prev-message", props.message.id);

/** 下一个版本 */
const handleNextVersion = () =>
  props.message.currentVersion &&
  props.message.versionCount &&
  props.message.currentVersion < props.message.versionCount &&
  emit("next-message", props.message.id);

/** 计算内容实际高度，判断是否显示折叠按钮 */
const checkContentHeight = () => {
  if (!isSelf.value || !contentRef.value) return;

  const hasText = blocks.value.some((b: any) => b.type === "text");
  if (!hasText) {
    showCollapseToggle.value = false;
    return;
  }

  // 计算高度
  if (contentRef.value.scrollHeight > 140) {
    showCollapseToggle.value = true;
  } else {
    showCollapseToggle.value = false;
  }
};

// 如果用户编辑了当前消息重新发送，内容变动时重新计算高度
watch(
  () => props.message.content,
  () => {
    nextTick(checkContentHeight);
  },
  { deep: true }
);

onMounted(() => {
  // 组件挂载完毕后，稍微延迟等待内部 Markdown 或代码块渲染完毕，再计算高度
  nextTick(() => setTimeout(checkContentHeight, 50));
});
</script>

<style scoped>
.message-row {
  width: 100%;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.action-icon {
  @apply cursor-pointer text-[--user-text-color] transition-all duration-200 hover:text-[--message-render-color];
}
.action-icon:hover {
  transform: translateY(-1px);
}
.bubble-container {
  position: relative;
  z-index: 1;
}
.bubble-container *::selection {
  background-color: rgba(59, 130, 246, 0.4) !important;
  color: inherit !important;
}
.self-message-bubble *::selection {
  background-color: rgba(255, 255, 255, 0.35) !important;
  color: #fff !important;
}
.edit-textarea :deep(textarea::selection) {
  background-color: rgba(59, 130, 246, 0.4) !important;
  color: var(--text-color) !important;
}
.edit-textarea :deep(textarea) {
  color: var(--text-color) !important;
  line-height: 1.6;
  padding: 4px 0 !important;
}

/* AI 等待回复打字机动画 */
.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--user-text-color);
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

/* 利用动画延迟制造波浪效果 */
.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.4);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 0.8;
  }
}
</style>
