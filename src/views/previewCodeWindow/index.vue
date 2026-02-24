<template>
  <n-config-provider :theme="naiveTheme" abstract>
    <div
      class="h-full flex flex-col bg-[var(--tray-bg-color)] dark:bg-[var(--right-bg-color)] overflow-hidden text-[var(--text-color)]">
      <action-bar />
      <div
        data-tauri-drag-region
        class="h-10 flex shrink-0 items-center justify-between px-4 bg-[var(--right-bg-color)] dark:bg-[var(--bg-setting-item)] border-b border-[var(--line-color)]">
        <div class="flex items-center gap-3">
          <span class="font-bold text-sm text-[var(--text-color)] dark:text-[var(--left-text-color)]">
            {{ t("preview.code.title") }}
          </span>

          <n-select
            v-model:value="language"
            :options="languageOptions"
            @update:value="runPreview"
            size="small"
            :consistent-menu-width="false"
            class="w-24" />

          <span class="text-xs text-[var(--left-text-color)]">{{ t("preview.code.save") }}</span>
        </div>

        <div class="flex gap-2">
          <div
            class="cursor-pointer text-xs bg-[#13987f] hover:bg-[#52aea3] text-white px-3 py-1 rounded transition flex items-center gap-1"
            @click="runPreview">
            <span class="text-white flex-center">
              <i-material-symbols-play-arrow-rounded class="w-5 h-5" />
            </span>
            {{ t("preview.code.run") }}
          </div>
        </div>
      </div>

      <div v-resize="onContainerResize" ref="containerRef" class="flex-1 flex w-full h-full overflow-hidden relative">
        <div
          class="h-full flex flex-col border-r border-[var(--line-color)]"
          :style="{ width: leftWidth + 'px', maxWidth: 'calc(100% - 200px)' }">
          <VueMonacoEditor
            v-model:value="code"
            :theme="monacoTheme"
            :language="monacoLang"
            :options="editorOptions"
            class="h-full w-full"
            @mount="handleEditorMount" />
        </div>

        <div
          class="w-[4px] h-full cursor-col-resize bg-[var(--right-bg-color)] dark:bg-[var(--bg-setting-item)] hover:bg-blue-600 active:bg-blue-600 transition-colors z-20 flex-shrink-0"
          @mousedown.prevent="startDrag"></div>

        <div class="flex-1 h-full bg-[var(--right-bg-color)] relative min-w-0">
          <div v-if="isDragging" class="absolute inset-0 z-50 bg-transparent"></div>

          <iframe
            v-if="previewUrl"
            :src="previewUrl"
            class="w-full h-full border-none block bg-white"
            sandbox="allow-scripts allow-forms allow-modals allow-downloads"
            referrerpolicy="no-referrer"></iframe>

          <div
            v-if="!previewUrl"
            class="absolute inset-0 flex items-center justify-center bg-[var(--right-bg-color)] text-[var(--left-text-color)] text-sm">
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
