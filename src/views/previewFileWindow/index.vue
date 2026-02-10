<template>
  <div class="h-screen flex flex-col bg-[--right-bg-color] overflow-hidden">
    <action-bar class="flex-none" />

    <div class="flex-1 w-full relative overflow-hidden bg-[#f0f0f0]">
      <div v-if="renderError" class="size-full flex flex-col items-center justify-center text-gray-500 gap-3">
        <i-mdi-alert-circle class="w-12 h-12 text-red-400" />
        <div class="text-sm">文件渲染失败</div>
        <div class="text-xs opacity-70">可能是文件损坏或加密</div>
      </div>

      <VueOfficeDocx
        v-else-if="isShowWord"
        :src="resourceSrc"
        class="size-full"
        @rendered="onRendered"
        @error="handleRenderError" />
      <VueOfficePdf
        v-else-if="isShowPdf"
        :src="resourceSrc"
        class="size-full"
        @rendered="onRendered"
        @error="handleRenderError" />
      <VueOfficeExcel
        v-else-if="isShowExcel"
        :src="resourceSrc"
        class="size-full"
        @rendered="onRendered"
        @error="handleRenderError" />
      <VueOfficePptx
        v-else-if="isShowPpt"
        :src="resourceSrc"
        class="size-full"
        @rendered="onRendered"
        @error="handleRenderError" />

      <n-scrollbar v-else-if="isShowMd" class="h-full w-full bg-white">
        <div class="markdown-body" v-html="mdHtml"></div>
      </n-scrollbar>

      <n-scrollbar v-else-if="isShowText" class="h-full w-full bg-white">
        <div class="p-6">
          <pre class="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">{{ txtContent }}</pre>
        </div>
      </n-scrollbar>

      <n-scrollbar v-else-if="isShowCode" class="h-full w-full bg-[#282c34]">
        <div class="p-4">
          <pre><code class="hljs !bg-transparent !p-0 font-mono text-sm leading-relaxed" v-html="highlightedCode"></code></pre>
        </div>
      </n-scrollbar>

      <div v-else class="size-full flex flex-col items-center justify-center text-gray-500 gap-3">
        <i-mdi-file-document-alert class="w-12 h-12 text-gray-400" />
        <div class="text-sm">
          {{ getErrorMessage() }}
        </div>
        <div class="text-xs opacity-70">{{ uiData.payload.resourceFile.fileName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "@vue-office/docx/lib/v3/index.css";
import "@vue-office/excel/lib/v3/index.css";
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/atom-one-dark.css";

import { reactive, computed, onMounted, ref } from "vue";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { readFile } from "@tauri-apps/plugin-fs";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

import VueOfficeDocx from "@vue-office/docx/lib/v3/vue-office-docx.mjs";
import VueOfficeExcel from "@vue-office/excel/lib/v3/vue-office-excel.mjs";
import VueOfficePdf from "@vue-office/pdf/lib/v3/vue-office-pdf.mjs";
import VueOfficePptx from "@vue-office/pptx/lib/v3/vue-office-pptx.mjs";

import { useWindow } from "@/hooks/useWindow";
import { useTauriListener } from "@/hooks/useTauriListener";

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return "";
  }
});

// 定义纯文本后缀
const TEXT_EXTS = ["txt", "log", "csv", "env", "ini", "conf"];

// 定义代码后缀 (移除了上面的纯文本后缀)
const CODE_EXTS = [
  "json",
  "xml",
  "yaml",
  "yml",
  "js",
  "jsx",
  "ts",
  "tsx",
  "vue",
  "html",
  "css",
  "scss",
  "less",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "cs",
  "go",
  "rs",
  "php",
  "rb",
  "sql",
  "sh",
  "bat"
];

type PayloadData = {
  uid: string;
  conversationId: string;
  resourceFile: {
    fileName: string;
    absolutePath: string | undefined;
    nativePath: string | undefined;
    url: string;
    type: { ext: string; mime?: string } | undefined;
    localExists: boolean;
  };
};

const uiData = reactive({
  payload: {
    uid: "",
    conversationId: "",
    resourceFile: {
      fileName: "",
      absolutePath: "",
      nativePath: "",
      url: "",
      localExists: false,
      type: { ext: "", mime: "" }
    }
  } as PayloadData,
  fileBuffer: null as ArrayBuffer | null,
  fileLoading: false
});

const txtContent = ref(""); // 纯文本内容
const highlightedCode = ref(""); // 高亮代码 HTML
const mdHtml = ref(""); // Markdown HTML
const renderError = ref(false);

const resourceSrc = computed(() => {
  const { resourceFile } = uiData.payload;
  if (resourceFile.localExists && uiData.fileBuffer) {
    return uiData.fileBuffer;
  }
  return resourceFile.url;
});

const fileExt = computed(() => {
  const nameExt = uiData.payload.resourceFile.fileName.split(".").pop()?.toLowerCase();
  if (nameExt) return nameExt;
  return uiData.payload.resourceFile.type?.ext?.toLowerCase() || "";
});

const isShowWord = computed(() => ["docx"].includes(fileExt.value));
const isShowPdf = computed(() => fileExt.value === "pdf");
const isShowExcel = computed(() => ["xlsx", "xls"].includes(fileExt.value));
const isShowPpt = computed(() => ["pptx"].includes(fileExt.value));
const isShowMd = computed(() => ["md", "markdown"].includes(fileExt.value));
const isShowCode = computed(() => CODE_EXTS.includes(fileExt.value));
const isShowText = computed(() => TEXT_EXTS.includes(fileExt.value)); // ✅ 新增判断

const getErrorMessage = () => {
  if (fileExt.value === "doc") return "暂不支持 .doc 格式，请转换为 .docx";
  if (fileExt.value === "ppt") return "暂不支持 .ppt 格式，请转换为 .pptx";
  return "暂不支持预览该文件格式";
};

const updateFile = async (absolutePath: string, exists: boolean) => {
  uiData.fileLoading = true;
  uiData.fileBuffer = null;
  highlightedCode.value = "";
  mdHtml.value = "";
  txtContent.value = ""; // 重置
  renderError.value = false;

  try {
    let rawText = "";

    if (exists && absolutePath) {
      const uint8Array = await readFile(absolutePath);

      //如果是代码、Markdown 或 纯文本，则解码为字符串
      if (isShowCode.value || isShowMd.value || isShowText.value) {
        const decoder = new TextDecoder("utf-8");
        rawText = decoder.decode(uint8Array);
      } else {
        uiData.fileBuffer = uint8Array.buffer;
      }
    } else {
      if ((isShowCode.value || isShowMd.value || isShowText.value) && uiData.payload.resourceFile.url) {
        const res = await fetch(uiData.payload.resourceFile.url);
        if (!res.ok) throw new Error("网络请求失败");
        rawText = await res.text();
      }
    }

    // 根据类型分发处理
    if (isShowMd.value && rawText) {
      mdHtml.value = mdParser.render(rawText);
    } else if (isShowCode.value && rawText) {
      try {
        const result = hljs.highlightAuto(rawText);
        highlightedCode.value = result.value;
      } catch (e) {
        highlightedCode.value = rawText.replace(
          /[&<>"']/g,
          (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m]!
        );
      }
    }
    // 纯文本直接赋值，不进行 highlight 处理
    else if (isShowText.value && rawText) {
      txtContent.value = rawText;
    }

    console.log("文件加载成功");
  } catch (error) {
    console.error("读取文件出错：", error);
    renderError.value = true;
  } finally {
    uiData.fileLoading = false;
  }
};

const onRendered = () => console.log("渲染完成");
const handleRenderError = (e: any) => {
  console.error("组件渲染失败", e);
  renderError.value = true;
};

const { getWindowPayload } = useWindow();
const { addListener } = useTauriListener();

onMounted(async () => {
  const webviewWindow = getCurrentWebviewWindow();
  const label = webviewWindow.label;

  await addListener(
    listen(`${label}:update`, (event: any) => {
      console.log("预览窗口收到更新:", event);
      const payload: PayloadData = event.payload.payload;
      Object.assign(uiData.payload, payload);
      updateFile(payload.resourceFile.absolutePath || "", payload.resourceFile.localExists);
    }),
    "preview-file-update"
  );

  try {
    const payload = await getWindowPayload<PayloadData>(label);
    if (payload) {
      console.log("预览窗口初始载荷:", payload);
      Object.assign(uiData.payload, payload);
      updateFile(payload.resourceFile.absolutePath || "", payload.resourceFile.localExists);
    }
  } catch (error) {
    console.error("获取 Payload 失败:", error);
  }

  await webviewWindow.show();
});
</script>

<style scoped>
:deep(.vue-office-docx-main),
:deep(.vue-office-excel-main),
:deep(.vue-office-pdf-main),
:deep(.vue-office-pptx-main) {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px;
  background-color: white;
}

@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}

:deep(.hljs) {
  background: transparent;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
}
</style>

<style>
/* 消除 body 默认边距，防止双重滚动条 */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
