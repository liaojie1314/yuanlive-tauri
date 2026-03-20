<template>
  <n-config-provider abstract :theme="naiveTheme">
    <div
      class="flex h-full flex-col overflow-hidden bg-[var(--tray-bg-color)] text-[var(--text-color)] dark:bg-[var(--right-bg-color)]">
      <action-bar />
      <div
        data-tauri-drag-region
        class="flex h-10 shrink-0 items-center justify-between border-b border-[var(--line-color)] bg-[var(--right-bg-color)] px-4 dark:bg-[var(--bg-setting-item)]">
        <div class="flex-y-center gap-3">
          <span class="text-sm font-bold text-[var(--text-color)] dark:text-[var(--left-text-color)]">
            {{ t("preview.code.title") }}
          </span>

          <n-select
            size="small"
            class="w-24"
            v-model:value="language"
            :options="languageOptions"
            :consistent-menu-width="false"
            @update:value="runPreview" />

          <span class="text-xs text-[var(--left-text-color)]">{{ t("preview.code.save") }}</span>
        </div>

        <div class="flex gap-2">
          <div
            class="flex cursor-pointer items-center gap-1 rounded bg-[#13987f] px-3 py-1 text-xs text-white transition hover:bg-[#52aea3]"
            @click="runPreview">
            <span class="flex-center text-white">
              <i-material-symbols-play-arrow-rounded class="h-5 w-5" />
            </span>
            {{ t("preview.code.run") }}
          </div>
        </div>
      </div>

      <div v-resize="onContainerResize" ref="containerRef" class="relative flex h-full w-full flex-1 overflow-hidden">
        <div
          class="flex h-full flex-col border-r border-[var(--line-color)]"
          :style="{ width: leftWidth + 'px', maxWidth: 'calc(100% - 200px)' }">
          <VueMonacoEditor
            class="h-full w-full"
            v-model:value="code"
            :theme="monacoTheme"
            :language="monacoLang"
            :options="editorOptions"
            @mount="handleEditorMount" />
        </div>

        <div
          class="z-20 h-full w-[4px] flex-shrink-0 cursor-col-resize bg-[var(--right-bg-color)] transition-colors hover:bg-blue-600 active:bg-blue-600 dark:bg-[var(--bg-setting-item)]"
          @mousedown.prevent="startDrag"></div>

        <div class="relative h-full min-w-0 flex-1 bg-[var(--right-bg-color)]">
          <div v-if="isDragging" class="absolute inset-0 z-50 bg-transparent"></div>

          <iframe
            v-if="previewUrl"
            sandbox="allow-scripts allow-forms allow-modals allow-downloads"
            referrerpolicy="no-referrer"
            class="block h-full w-full border-none bg-white"
            :src="previewUrl"></iframe>

          <div
            v-if="!previewUrl"
            class="absolute inset-0 flex-center bg-[var(--right-bg-color)] text-sm text-[var(--left-text-color)]">
            {{ t("preview.code.hint") }}
          </div>
        </div>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { ThemeEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting";
import { useWindow } from "@/hooks/useWindow";
import { generatePreviewHtml } from "@/utils/PreviewFactory";

type LangType = "html" | "vue" | "react";

const { t } = useI18n();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);
const { getWindowPayload } = useWindow();

const MIN_WIDTH = 350; // 最小宽度限制
const languageOptions = [
  { label: "HTML", value: "html" },
  { label: "Vue 3", value: "vue" },
  { label: "React", value: "react" }
];
const editorOptions = {
  automaticLayout: true,
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2
};

const code = ref("");
const previewUrl = ref("");
const language = ref<LangType>("html"); // 当前选中的语言
const containerRef = ref<HTMLElement | null>(null);
const leftWidth = ref(500); // 默认宽度
const isDragging = ref(false);
const editorRef = shallowRef();

const monacoTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? "vs-dark" : "vs"));
const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));

// 根据选中的语言，决定 Monaco 编辑器的高亮模式
const monacoLang = computed(() => {
  if (language.value === "react") return "javascript";
  return "html"; // Vue 和 HTML 都使用 HTML 模式高亮即可
});

/** 运行预览：将编辑器代码生成 HTML Blob 并加载到 iframe 中 */
const runPreview = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);

  // 传入当前选择的 language 类型
  const finalHtml = generatePreviewHtml(code.value, language.value);

  const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" });
  previewUrl.value = URL.createObjectURL(blob);
};

/** 编辑器挂载完成回调：绑定快捷键 */
const handleEditorMount = (editor: any) => {
  editorRef.value = editor;
  editor.addCommand(2048 | 49, () => {
    runPreview();
  });
};

/** 根据代码内容猜测语言类型 */
const detectLanguage = (content: string) => {
  if (content.includes("export default function") || content.includes("import React")) {
    language.value = "react";
  } else if (content.includes("<template>") || content.includes("export default {")) {
    language.value = "vue";
  } else {
    language.value = "html";
  }
};

/** 开始拖拽：调整左侧宽度 */
const startDrag = () => {
  isDragging.value = true;
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
  document.body.style.cursor = "col-resize"; // 强制光标样式
};

/** 拖拽中：实时更新左侧宽度 */
const onDrag = (e: MouseEvent) => {
  if (!containerRef.value) return;
  const containerRect = containerRef.value.getBoundingClientRect();
  // 计算新宽度：鼠标位置 - 容器左边缘
  let newWidth = e.clientX - containerRect.left;
  // 限制左侧最小宽度
  if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
  // 限制右侧最小宽度 (总宽 - 新宽 < 最小宽)
  if (containerRect.width - newWidth < MIN_WIDTH) {
    newWidth = containerRect.width - MIN_WIDTH;
  }
  leftWidth.value = newWidth;
};

/** 拖拽结束：停止监听事件 */
const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
  document.body.style.cursor = "";

  // 拖拽结束强制刷新编辑器布局，防止文字模糊
  if (editorRef.value) editorRef.value.layout();
};

/**
 * 容器宽度变化时：自动调整左侧宽度
 * @param param0 容器宽度变化事件参数
 */
const onContainerResize = ({ width }: { width: number }) => {
  // 如果正在拖拽中，暂时不自动调整，避免冲突
  if (isDragging.value) return;
  const containerWidth = width;
  // 计算右侧剩余空间
  const remainingForRight = containerWidth - leftWidth.value;
  // 如果右侧空间不足 MIN_WIDTH (说明窗口变窄了)
  if (remainingForRight < MIN_WIDTH) {
    // 强制把左侧变小，给右侧留出 200px
    const newLeftWidth = containerWidth - MIN_WIDTH;
    // 同时保证左侧也不小于 MIN_WIDTH (避免左侧完全消失)
    leftWidth.value = Math.max(MIN_WIDTH, newLeftWidth);
  }
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  interface PreviewPayload {
    content?: string;
    lang?: LangType; // 'html' | 'vue' | 'react'
  }
  // 获取 payload，包含 content 和 lang
  const payload = await getWindowPayload<PreviewPayload>("previewCode");
  const payloadContent = payload?.content || "";
  const payloadLang = payload?.lang;
  console.log("payload", payload);
  // 处理代码内容（去除 markdown 代码块标记）
  code.value = payloadContent.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");

  // 设置语言：如果有明确传入的 lang 则使用，否则根据内容自动检测
  if (payloadLang && ["html", "vue", "react"].includes(payloadLang)) {
    language.value = payloadLang;
  } else if (code.value) {
    detectLanguage(code.value);
  }
  runPreview();
  // 初始化宽度为容器的一半
  if (containerRef.value) {
    leftWidth.value = containerRef.value.clientWidth / 2;
  }
});

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
});
</script>
