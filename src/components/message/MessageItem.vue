<template>
  <div
    class="message-row flex mb-6 w-full box-border transition-all duration-200"
    :class="[selectionMode ? 'cursor-pointer hover:bg-[--tray-hover] p-2 rounded-lg' : '']"
    @click="selectionMode ? $emit('toggle-select', message.id) : null">
    <div v-if="selectionMode" class="flex items-center justify-center w-8 mr-2 mt-1 flex-shrink-0">
      <n-checkbox :checked="selected" size="large" />
    </div>

    <div class="flex flex-grow min-w-0" :class="isSelf ? 'justify-end' : 'justify-start'">
      <div v-if="!isSelf" class="avatar-col mr-3 flex-shrink-0" :class="{ 'pointer-events-none': selectionMode }">
        <div class="w-9 h-9 rounded-full bg-[--line-color] overflow-hidden">
          <img :src="message.avatar" class="w-full h-full object-cover" />
        </div>
      </div>

      <div class="content-col flex flex-col max-w-[85%] min-w-0" :class="isSelf ? 'items-end' : 'items-start'">
        <div v-if="!isSelf" class="text-xs text-[--user-text-color] mb-1 ml-1">
          {{ message.sender || t("components.messageItem.ai") }}
        </div>

        <context-menu :menu="selectionMode ? [] : contextMenuOptions" @select="handleContextMenuSelect">
          <div
            class="bubble-container select-text flex flex-col gap-1 rounded-xl shadow-sm border min-w-0 overflow-hidden w-fit box-border transition-all duration-300"
            :class="[
              bubbleClasses,
              isEditing
                ? 'min-w-[300px] w-[95%] sm:w-[400px] !bg-[--tray-bg-color] !border-[--line-color] shadow-md p-1'
                : 'p-3',
              selectionMode ? 'pointer-events-none' : ''
            ]"
            style="max-width: 100%"
            @contextmenu="handleBubbleContext">
            <div v-if="isEditing" class="flex flex-col w-full p-1.5 pointer-events-auto">
              <div class="px-2">
                <n-input
                  v-model:value="editText"
                  type="textarea"
                  autosize
                  :bordered="false"
                  class="edit-textarea w-full !bg-transparent"
                  :placeholder="t('components.messageItem.placeholder')"
                  autofocus />
              </div>
              <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-[--line-color] px-1">
                <div
                  class="px-3 py-1 text-xs rounded-md text-[--user-text-color] bg-[--input-area-bg] hover:bg-[--line-color] transition-colors border border-[--line-color] cursor-pointer"
                  @click="cancelEdit">
                  {{ t("components.common.cancel") }}
                </div>
                <div
                  class="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                  @click="submitEdit">
                  {{ t("components.messageItem.resend") }}
                </div>
              </div>
            </div>

            <template v-else v-for="block in blocks" :key="block.id">
              <div class="w-full" @contextmenu="handleBlockContext(block)">
                <thinking-block
                  v-if="block.type === 'thinking'"
                  :content="block.content"
                  :duration="block.duration"
                  :tool-calls="block.toolCalls" />
                <markdown-block v-else-if="block.type === 'text'" :content="block.content" :is-self="isSelf" />
                <image-block v-else-if="block.type === 'image'" :url="block.url" />
                <video-block v-else-if="block.type === 'video'" :url="block.url" :cover-img="block.coverImg" />
                <audio-block v-else-if="block.type === 'audio'" :url="block.url" />
                <file-block v-else-if="block.type === 'file'" :url="block.url" :name="block.name" :is-self="isSelf" />
                <div
                  v-if="!isSelf && pendingTool"
                  class="mt-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex flex-col gap-2 pointer-events-auto">
                  <div class="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                    <i-mdi-shield-alert-outline class="w-4 h-4" />
                    {{ t("components.messageItem.systemPermissionRequest") }}
                  </div>
                  <div class="text-xs text-[--text-color] opacity-90">
                    {{ t("components.messageItem.executeLocalTool") }}
                    <strong>{{ pendingTool.name }}</strong>
                    {{ t("components.messageItem.executeLocalToolDesc") }}
                  </div>
                  <div class="flex items-center justify-end gap-2 mt-1">
                    <div
                      class="px-3 py-1 text-xs rounded-md text-[--user-text-color] bg-[--input-area-bg] hover:bg-[--line-color] cursor-pointer transition-colors"
                      @click="$emit('deny-tool', pendingTool)">
                      {{ t("components.messageItem.denyExecuteLocalTool") }}
                    </div>
                    <div
                      class="px-3 py-1 text-xs rounded-md bg-orange-500 text-white hover:bg-orange-600 shadow-sm cursor-pointer transition-colors"
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
        </context-menu>

        <div
          v-show="!selectionMode"
          class="flex items-center justify-between mt-1 w-full px-1"
          :class="isSelf ? 'flex-row-reverse' : ''">
          <div class="flex items-center gap-3 overflow-x-auto scrollbar-none">
            <div v-if="!isSelf && message.versionCount && message.versionCount > 1" class="flex items-center gap-1">
              <i-material-symbols-keyboard-arrow-left
                class="action-icon"
                :class="{ 'opacity-30 pointer-events-none': message.currentVersion === 1 }"
                @click="handlePrevVersion" />
              <span class="text-xs text-[--user-text-color] font-mono">
                {{ message.currentVersion }}/{{ message.versionCount }}
              </span>
              <i-material-symbols-keyboard-arrow-right
                class="action-icon"
                :class="{ 'opacity-30 pointer-events-none': message.currentVersion === message.versionCount }"
                @click="handleNextVersion" />
            </div>

            <div class="flex items-center gap-2">
              <div class="flex items-center justify-center relative">
                <i-material-symbols-check v-if="isCopied" class="text-green-500 text-sm" />
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
          <div class="text-[10px] text-[--user-text-color] opacity-80 flex-shrink-0" :class="isSelf ? 'mr-4' : 'ml-4'">
            {{ message.time }}
          </div>
        </div>
      </div>

      <div v-if="isSelf" class="avatar-col ml-3 flex-shrink-0" :class="{ 'pointer-events-none': selectionMode }">
        <div class="w-9 h-9 rounded-full bg-[--line-color] overflow-hidden">
          <img :src="message.avatar" class="w-full h-full object-cover" />
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
  @apply text-[--user-text-color] hover:text-[--message-render-color] cursor-pointer transition-all duration-200;
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
</style>
