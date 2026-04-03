<template>
  <div class="markdown-block text-message">
    <div
      v-html="renderedHtml"
      class="prose prose-sm max-w-none break-words"
      :class="isSelf ? 'text-white' : 'text-[--text-color]'"></div>
  </div>
</template>

<script setup lang="ts">
import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";

import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import mdAbbr from "markdown-it-abbr";
import mdAnchor from "markdown-it-anchor";
import mdDeflist from "markdown-it-deflist";
import { full as mdEmoji } from "markdown-it-emoji";
import mdFootnote from "markdown-it-footnote";
import mdIns from "markdown-it-ins";
import mdMark from "markdown-it-mark";
import mdSub from "markdown-it-sub";
import mdSup from "markdown-it-sup";
import mdTaskLists from "markdown-it-task-lists";
import mdToc from "markdown-it-toc-done-right";
import { katex } from "@mdit/plugin-katex";
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

let renderTimer: any = null;

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

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
})
  .use(mdAbbr)
  .use(mdAnchor)
  .use(mdDeflist)
  .use(mdEmoji)
  .use(mdFootnote)
  .use(mdIns)
  .use(mdMark)
  .use(mdSub)
  .use(mdSup)
  .use(mdTaskLists)
  .use(mdToc)
  .use(katex, { throwOnError: false, errorColor: " #cc0000" });

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token.info ? String(token.info).trim() : "";
  const langName = info.split(/\s+/g)[0];
  const originalLang = langName || "plaintext";
  const validLang = getValidLanguage(originalLang);
  let highlightedCode = "";

  try {
    // 高亮核心代码文本
    highlightedCode = hljs.highlight(token.content, { language: validLang, ignoreIllegals: true }).value;
  } catch (e) {
    highlightedCode = md.utils.escapeHtml(token.content);
  }

  const canRun = ["html", "vue", "react"].includes(originalLang.toLowerCase());

  // 返回完整的 HTML 结构（最外层不再会被强行套上 <pre><code>）
  return `
    <div class="code-block-container">
      <div class="code-header">
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
      </div>
      <pre class="hljs-scroll"><code class="language-${validLang}">${highlightedCode}</code></pre>
    </div>
  `;
};

// Markdown 解析逻辑
const renderedHtml = computed(() => {
  if (!props.content) return "";
  let safeContent = props.content;
  const codeBlockMatches = safeContent.match(/```/g);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    safeContent += "\n```"; // 强制追加闭合符，防止排版错乱
  }
  const rawHtml = md.render(safeContent);
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: [
      // MathML 标签
      "math",
      "semantics",
      "mrow",
      "mi",
      "mo",
      "mn",
      "ms",
      "mspace",
      "msqrt",
      "mroot",
      "mfrac",
      "msup",
      "msub",
      "msubsup",
      "mmultiscripts",
      "munderover",
      "mover",
      "munder",
      "mtable",
      "mtr",
      "mtd",
      "maligngroup",
      "malignmark",
      "annotation",
      "annotation-xml",
      // 基础排版
      "mark",
      "ins",
      "sup",
      "sub",
      "del",
      "strike",
      "svg",
      "path",
      "line",
      "rect",
      "circle",
      "ellipse",
      "polygon",
      "polyline"
    ],
    ADD_ATTR: [
      "xmlns",
      "display",
      "mathvariant",
      "encoding",
      "class",
      "style",
      "id",
      "d",
      "x",
      "y",
      "x1",
      "y1",
      "x2",
      "y2",
      "width",
      "height",
      "viewBox",
      "preserveAspectRatio"
    ]
  });
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
  const lang = langSpan?.getAttribute("data-lang") || "txt";

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
watch(
  () => props.content,
  () => {
    // 只要有新字吐出来，就打断之前的渲染倒计时
    if (renderTimer) clearTimeout(renderTimer);
    // 延迟 500ms 执行 DOM 增强和代码高亮
    // 效果：大模型在快速吐字时，只输出原色文本，绝不执行耗时的高亮操作；
    // 只有当模型输出彻底结束，或者网络卡顿停顿超过 0.5 秒时，才会进行一次完美的高亮渲染。
    renderTimer = setTimeout(() => {
      nextTick(() => enhanceCodeBlocks());
    }, 500);
  },
  { immediate: true }
);

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

.markdown-block .prose b,
.markdown-block .prose strong {
  font-weight: 700;
}

.markdown-block .prose i,
.markdown-block .prose em {
  font-style: italic;
}

.markdown-block .prose s,
.markdown-block .prose del,
.markdown-block .prose strike {
  text-decoration: line-through;
}

.markdown-block .prose mark {
  background-color: #ffe066;
  color: #24292f;
  padding: 0.1em 0.2em;
  border-radius: 4px;
  font-weight: 600;
}

/* 恢复表格样式 */
.markdown-block .prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-block .prose th,
.markdown-block .prose td {
  border: 1px solid var(--code-border);
  padding: 8px 12px;
}

.markdown-block .prose th {
  background-color: rgba(128, 128, 128, 0.1);
  font-weight: 600;
}

/* 恢复引用块样式 */
.markdown-block .prose blockquote {
  border-left: 4px solid var(--hl-function);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--hl-comment);
  background-color: rgba(128, 128, 128, 0.05);
  padding-top: 0.5em;
  padding-bottom: 0.5em;
  border-radius: 0 4px 4px 0;
}

/* 无序/有序列表 */
.markdown-block .prose ul {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.8em 0;
}
.markdown-block .prose ol {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.8em 0;
}
.markdown-block .prose li > p {
  margin: 0.2em 0;
}

/* 任务列表 (Task List) */
.markdown-block .prose ul.contains-task-list {
  list-style-type: none;
  padding-left: 0.5em;
}
.markdown-block .prose .task-list-item {
  display: flex;
  align-items: flex-start; /* 顶部对齐，防止多行文本时复选框居中 */
  gap: 0.5em;
  margin-bottom: 0.4em;
}
.markdown-block .prose .task-list-item input[type="checkbox"] {
  margin-top: 0.3em; /* 微调复选框位置，使其与第一行文字对齐 */
  cursor: pointer;
  accent-color: var(--hl-function);
}

/* 定义列表 (Deflist) */
.markdown-block .prose dl {
  margin: 1em 0;
}
.markdown-block .prose dt {
  font-weight: 700;
  margin-top: 0.8em;
  color: var(--code-text);
}
.markdown-block .prose dd {
  margin-left: 1.5em;
  margin-bottom: 0.5em;
  color: var(--hl-comment);
}
.markdown-block .prose dd > p {
  margin: 0.2em 0;
}

/* 脚注 (Footnotes) */
.markdown-block .prose hr + .footnotes-sep {
  display: none;
}
.markdown-block .prose .footnotes-sep {
  margin-top: 2em;
  margin-bottom: 1em;
  border: 0;
  border-top: 1px dashed var(--code-border); /* 用虚线作为脚注分割线，更具学术高级感 */
}
.markdown-block .prose .footnotes {
  font-size: 0.85em;
  opacity: 0.85;
}
.markdown-block .prose .footnotes-list {
  padding-left: 1.5em;
}
.markdown-block .prose .footnote-item p {
  margin: 0.2em 0; /* 让脚注文字排版更紧凑 */
}
.markdown-block .prose .footnote-backref {
  text-decoration: none;
  margin-left: 0.5em;
  font-family: monospace;
}

.markdown-block .prose sub {
  font-size: 0.75em;
  line-height: 0;
  vertical-align: sub;
}

.markdown-block .prose sup {
  font-size: 0.75em;
  line-height: 0;
  vertical-align: super;
}

.markdown-block .prose .katex * {
  box-sizing: content-box !important;
  line-height: normal !important;
  border-color: currentColor !important;
}

/* 确保 SVG 符号（如根号、帽子）的颜色与正文完全一致 */
.markdown-block .prose .katex svg {
  fill: currentColor !important;
  stroke: currentColor !important;
}

/* 强制使用数学专用字体 */
.markdown-block .prose .katex {
  font-family: KaTeX_Main, "Times New Roman", serif !important;
  font-size: 1.1em;
}

/* 块级公式居中与外边距 */
.markdown-block .prose .katex-display {
  margin: 1.2em 0;
  padding: 0.5em 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-block .prose .katex-display > .katex {
  display: inline-block;
  text-align: center;
}
</style>
