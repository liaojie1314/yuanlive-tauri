<template>
  <div class="h-full flex flex-col bg-[#1e1e1e] overflow-hidden text-white">
    <action-bar />

    <div
      data-tauri-drag-region
      class="h-10 flex shrink-0 items-center justify-between px-4 bg-[#252526] border-b border-[#111]">
      <div class="flex items-center gap-3">
        <span class="font-bold text-sm text-gray-300">Code Preview</span>

        <select
          v-model="language"
          @change="runPreview"
          class="bg-[#333] text-xs text-white border border-[#444] rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer">
          <option value="html">HTML</option>
          <option value="vue">Vue 3</option>
          <option value="react">React</option>
        </select>

        <span class="text-xs text-gray-500">(Ctrl + S 保存)</span>
      </div>

      <div class="flex gap-2">
        <button
          class="text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white px-3 py-1 rounded transition flex items-center gap-1"
          @click="runPreview">
          <span class="text-white">▶</span>
          运行
        </button>
      </div>
    </div>

    <div class="flex-1 flex w-full h-full overflow-hidden">
      <div class="w-1/2 h-full border-r border-[#333] flex flex-col">
        <VueMonacoEditor
          v-model:value="code"
          theme="vs-dark"
          :language="monacoLang"
          :options="editorOptions"
          class="h-full w-full"
          @mount="handleEditorMount" />
      </div>

      <div class="w-1/2 h-full bg-white relative">
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          class="w-full h-full border-none block bg-white"
          sandbox="allow-scripts allow-forms allow-modals"
          referrerpolicy="no-referrer"></iframe>

        <div
          v-if="!previewUrl"
          class="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          点击运行查看效果
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { generatePreviewHtml } from "@/utils/PreviewFactory";

type LangType = "html" | "vue" | "react";

const code = ref("");
const previewUrl = ref("");
const language = ref<LangType>("html"); // 当前选中的语言
const editorRef = shallowRef();

// --- 计算属性：根据选中的语言，决定 Monaco 编辑器的高亮模式 ---
const monacoLang = computed(() => {
  if (language.value === "react") return "javascript";
  return "html"; // Vue 和 HTML 都使用 HTML 模式高亮即可
});

const editorOptions = {
  automaticLayout: true,
  fontSize: 14,
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  tabSize: 2,
  theme: "vs-dark"
};

// 2. 运行预览：将编辑器代码生成 HTML Blob
const runPreview = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);

  // 传入当前选择的 language 类型
  const finalHtml = generatePreviewHtml(code.value, language.value);

  const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" });
  previewUrl.value = URL.createObjectURL(blob);
};

// 3. 编辑器挂载完成回调：绑定快捷键
const handleEditorMount = (editor: any) => {
  editorRef.value = editor;
  editor.addCommand(2048 | 49, () => {
    runPreview();
  });
};

// 辅助函数：根据代码内容猜测语言
const detectLanguage = (content: string) => {
  if (content.includes("export default function") || content.includes("import React")) {
    language.value = "react";
  } else if (content.includes("<template>") || content.includes("export default {")) {
    language.value = "vue";
  } else {
    language.value = "html";
  }
};

// 4. 监听外部变化
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === "preview_code_storage" && e.newValue) {
    const newCode = e.newValue.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");

    if (newCode !== code.value) {
      code.value = newCode;
      // 自动检测并切换语言
      detectLanguage(newCode);
      runPreview();
    }
  }
};

// 1. 初始化
onMounted(async () => {
  await getCurrentWebviewWindow().show();
  // TODO: 从窗口payload中获取初始代码
  const storedCode = localStorage.getItem("preview_code_storage") || "";
  code.value = storedCode.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");

  // 初始自动检测语言
  if (code.value) {
    detectLanguage(code.value);
  }

  runPreview();

  window.addEventListener("storage", handleStorageChange);
});

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  window.removeEventListener("storage", handleStorageChange);
});
</script>
