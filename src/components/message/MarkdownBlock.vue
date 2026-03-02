<template>
  <div class="markdown-block text-message">
    <div
      v-html="renderedHtml"
      class="prose prose-sm max-w-none break-words"
      :class="isSelf ? 'text-white' : 'text-[--text-color]'"></div>
  </div>
</template>

<script setup lang="ts">
import hljs from "highlight.js";
import { marked } from "marked";
import "highlight.js/styles/github.css";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { useWindow } from "@/hooks/useWindow";

defineOptions({
  name: "MarkdownBlock"
});

const { createWebviewWindow, sendWindowPayload } = useWindow();

const props = defineProps<{
  content: string;
  isSelf: boolean;
}>();

const languageMap: Record<string, string> = {
  js: "javascript",
  vue: "xml", // Vue 模板最好用 xml/html 解析高亮
  react: "javascript", // React 通常用 jsx/javascript 解析
  javascript: "javascript",
  node: "javascript",
  nodejs: "javascript",
  java: "java",
  py: "python",
  python: "python",
  rb: "ruby",
  ruby: "ruby",
  php: "php",
  go: "go",
  golang: "go",
  rust: "rust",
  rs: "rust",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  cs: "csharp",
  csharp: "csharp",
  "c#": "csharp",
  swift: "swift",
  kotlin: "kotlin",
  kt: "kotlin",
  scala: "scala",
  html: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  sql: "sql",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  powershell: "powershell",
  ps: "powershell",
  dockerfile: "dockerfile",
  docker: "dockerfile",
  md: "markdown",
  markdown: "markdown"
};

// Markdown 解析逻辑
const renderedHtml = computed(() => {
  if (!props.content) return "";
  return marked.parse(props.content, { breaks: true, gfm: true }) as string;
});

/**
 * 获取有效的 Highlight.js 语言标识符
 * @param lang 原始语言标识符
 * @returns 有效的 Highlight.js 语言标识符
 */
const getValidLanguage = (lang: string): string => {
  const lowerLang = lang.toLowerCase();
  if (hljs.getLanguage(lowerLang)) return lowerLang;
  if (languageMap[lowerLang]) return languageMap[lowerLang];
  for (const [alias, language] of Object.entries(languageMap)) {
    if (alias.startsWith(lowerLang) && hljs.getLanguage(language)) return language;
  }
  return "plaintext";
};

/** 代码块增强逻辑 (DOM 操作) */
const enhanceCodeBlocks = () => {
  document.querySelectorAll(".markdown-block pre code:not(.processed)").forEach((el) => {
    const codeEl = el as HTMLElement;
    codeEl.classList.add("processed"); // 标记已处理

    // 1. 获取语言
    const langClass = Array.from(codeEl.classList).find((c) => c.startsWith("language-"));
    // 原始语言 (比如 vue, react, html)
    const originalLang = langClass ? langClass.replace("language-", "") : "plaintext";
    // HLJS 识别语言
    const hljsLang = getValidLanguage(originalLang);

    // 2. 代码高亮
    try {
      codeEl.innerHTML = hljs.highlight(codeEl.textContent || "", { language: hljsLang, ignoreIllegals: true }).value;
      codeEl.className = `language-${hljsLang}`;
    } catch (e) {
      console.error("代码高亮失败:", e);
    }

    // 3. 构建容器和 Header
    const pre = codeEl.parentElement;
    if (pre && !pre.parentElement?.classList.contains("code-block-container")) {
      pre.classList.add("hljs-scroll");

      const container = document.createElement("div");
      container.className = "code-block-container";

      const header = document.createElement("div");
      header.className = "code-header";

      // 判断是否显示运行按钮 (html, vue, react)
      const runnableLangs = ["html", "vue", "react"];
      const canRun = runnableLangs.includes(originalLang.toLowerCase());

      header.innerHTML = `
        <span class="code-lang" data-lang="${originalLang}">${originalLang}</span>
        <div class="code-actions">
          <button class="code-btn" data-act="copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            复制
          </button>
          <button class="code-btn" data-act="download">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            下载
          </button>
          ${
            canRun
              ? `
          <button class="code-btn" data-act="run">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            运行
          </button>`
              : ""
          }
        </div>
      `;

      pre.parentNode?.insertBefore(container, pre);
      container.appendChild(header);
      container.appendChild(pre);
    }
  });
};

/**
 * 全局点击事件 (事件委托)
 * @param e 点击事件对象
 */
const handleClick = async (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const btn = target.closest(".code-btn") as HTMLElement;
  if (!btn) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  const action = btn.getAttribute("data-act");
  const container = btn.closest(".code-block-container");
  if (!container) return;

  const codeEl = container.querySelector("code");
  if (!codeEl) return;
  const content = codeEl.textContent || "";

  // 提取原始语言 (用于运行和下载扩展名)
  const langSpan = container.querySelector(".code-lang");
  const lang = langSpan?.getAttribute("data-lang") || langSpan?.textContent?.trim().toLowerCase() || "txt";

  if (action === "copy") {
    try {
      await writeText(content);
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> 已复制`;
      setTimeout(() => (btn.innerHTML = originalHtml), 2000);
    } catch (err) {
      console.error("复制失败:", err);
      btn.innerText = "❌ 失败";
    }
  } else if (action === "download") {
    try {
      const extMap: Record<string, string> = {
        javascript: ".js",
        java: ".java",
        python: ".py",
        ruby: ".rb",
        php: ".php",
        go: ".go",
        rust: ".rs",
        cpp: ".cpp",
        c: ".c",
        csharp: ".cs",
        swift: ".swift",
        kotlin: ".kt",
        scala: ".scala",
        html: ".html",
        css: ".css",
        scss: ".scss",
        less: ".less",
        json: ".json",
        yaml: ".yaml",
        xml: ".xml",
        sql: ".sql",
        bash: ".sh",
        powershell: ".ps1",
        markdown: ".md",
        typescript: ".ts",
        vue: ".vue",
        react: ".jsx",
        plaintext: ".txt"
      };

      let ext = extMap[lang] || `.${lang}`;
      if (lang === "dockerfile") ext = ""; // Dockerfile 通常没后缀

      const filePath = await save({
        defaultPath: `code_snippet${ext}`,
        filters: [{ name: "Code Snippet", extensions: [ext.replace(".", ""), "txt", "*"] }]
      });

      if (filePath) {
        await writeTextFile(filePath, content);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> 已下载`;
        setTimeout(() => (btn.innerHTML = originalHtml), 2000);
      }
    } catch (err) {
      console.error("下载失败:", err);
      const originalHtml = btn.innerHTML;
      btn.innerHTML = "❌ 失败";
      setTimeout(() => (btn.innerHTML = originalHtml), 2000);
    }
  } else if (action === "run") {
    const label = "previewCode";
    await createWebviewWindow("预览代码", label, 1200, 720, "", true, 800, 500);
    // 补齐 lang 参数
    await sendWindowPayload(label, { content, lang });
  }
};

// 监听 content 变化重新增强 DOM
watchEffect(() => {
  if (props.content) {
    nextTick(() => enhanceCodeBlocks());
  }
});

onMounted(() => document.addEventListener("click", handleClick));
onUnmounted(() => document.removeEventListener("click", handleClick));
</script>

<style>
:root {
  --code-bg: #f6f8fa;
  --code-header-bg: #eaocf0;
  --code-border: #d0d7de;
  --code-text: #24292f;
  --sb-thumb: rgba(0, 0, 0, 0.15);
  --hl-keyword: #cf222e;
  --hl-function: #8250df;
  --hl-string: #0a3069;
  --hl-comment: #6e7781;
  --hl-number: #0550ae;
  --hl-tag: #116329;
}

html[data-theme="dark"] {
  --code-bg: #282c34;
  --code-header-bg: #21252b;
  --code-border: rgba(255, 255, 255, 0.1);
  --code-text: #abb2bf;
  --sb-thumb: rgba(255, 255, 255, 0.2);
  --hl-keyword: #c678dd;
  --hl-function: #61afef;
  --hl-string: #98c379;
  --hl-comment: #5c6370;
  --hl-number: #d19a66;
  --hl-tag: #e06c75;
}

.self-message-bubble {
  --code-bg: #282c34 !important;
  --code-header-bg: #21252b !important;
  --code-text: #abb2bf !important;
  --code-border: rgba(255, 255, 255, 0.1) !important;
  --hl-keyword: #c678dd !important;
  --hl-function: #61afef !important;
  --hl-string: #98c379 !important;
  --hl-comment: #5c6370 !important;
}

.code-block-container code,
.markdown-block pre code {
  overflow-x: visible !important;
  display: block;
}
.code-block-container pre,
.markdown-block pre {
  overflow-x: auto !important;
}

.code-block-container {
  margin: 0.8em 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--code-bg);
  border: 1px solid var(--code-border);
  font-family: "Fira Code", Consolas, monospace;

  display: grid;
  grid-template-rows: auto 1fr;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--code-header-bg);
  border-bottom: 1px solid var(--code-border);
  font-size: 12px;
  color: var(--code-text);
  opacity: 0.8;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.code-lang {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
}

.code-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.code-btn {
  cursor: pointer;
  background: none;
  border: none;
  color: inherit;
  transition: all 0.2s;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
}

.code-btn:hover {
  opacity: 1;
  font-weight: 600;
}

.markdown-block pre {
  margin: 0 !important;
  padding: 16px !important;
  background: transparent !important;
  border: none !important;
  width: 100%;
  overflow-x: auto !important;
  white-space: pre;
  box-sizing: border-box;
  color: var(--code-text);
  font-size: 13px;
  line-height: 1.6;
}

.code-block-container ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.code-block-container ::-webkit-scrollbar-track {
  background: transparent;
}
.code-block-container ::-webkit-scrollbar-thumb {
  background: var(--sb-thumb) !important;
  border-radius: 4px;
}

.hljs-keyword,
.hljs-operator {
  color: var(--hl-keyword);
}
.hljs-function,
.hljs-title,
.hljs-section {
  color: var(--hl-function);
}
.hljs-string,
.hljs-link {
  color: var(--hl-string);
}
.hljs-comment,
.hljs-quote,
.hljs-meta {
  color: var(--hl-comment);
  font-style: italic;
}
.hljs-number,
.hljs-literal,
.hljs-type,
.hljs-built_in {
  color: var(--hl-number);
}
.hljs-tag,
.hljs-name,
.hljs-attribute {
  color: var(--hl-tag);
}
.hljs-variable,
.hljs-params {
  color: var(--code-text);
}

.markdown-block .prose {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  line-height: 1.7;
}
.markdown-block .prose p {
  margin-bottom: 0.8em;
}
.markdown-block .prose a {
  text-decoration: underline;
  color: inherit;
}
.markdown-block .prose img {
  max-width: 100%;
  border-radius: 6px;
}
.markdown-block .prose table {
  display: block;
  width: 100%;
  overflow-x: auto;
}

.markdown-block .prose > :last-child {
  margin-bottom: 0 !important;
}

/* 强制消除顶部可能的多余空隙 */
.markdown-block .prose > :first-child {
  margin-top: 0 !important;
}

/* 如果最后一个元素是代码块容器，也干掉它的 margin */
.code-block-container:last-child {
  margin-bottom: 0 !important;
}
.code-block-container:first-child {
  margin-top: 0 !important;
}
</style>
