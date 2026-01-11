<template>
  <div class="message-item mb-4 flex" :class="{ 'justify-end': message.isSelf }">
    <!-- 对方消息 -->
    <div v-if="!message.isSelf" class="flex gap-2 max-w-[80%]">
      <div class="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-300">
        <img :src="message.avatar" :alt="message.sender" class="w-full h-full object-cover" />
      </div>
      <div class="flex-grow min-w-0">
        <div class="text-sm font-medium text-gray-600 mb-1">{{ message.sender }}</div>
        <!-- 合并思考内容和回复内容的统一容器 -->
        <div ref="thinkingContainerRef" class="bg-white rounded-lg shadow-sm overflow-hidden">
          <!-- 思考内容区域 -->
          <div v-if="message.thinking || message.isThinkingTyping" class="thinking-container">
            <!-- 思考内容标题栏 -->
            <div
              class="thinking-header flex items-center justify-between cursor-pointer p-3"
              @click="toggleThinkingExpanded">
              <div class="flex items-center">
                <span class="text-blue-500 mr-2">🔍</span>
                <span class="text-gray-600 font-medium text-sm">已思考（用时{{ message.thinkingTime }}秒）</span>
              </div>
              <!-- 使用iconify图标替换字符箭头 -->
              <i-material-symbols-keyboard-arrow-down
                class="text-gray-500 transition-transform duration-300 text-sm"
                :class="{ 'rotate-180': isThinkingExpanded }" />
            </div>
            <!-- 思考内容 -->
            <div v-if="isThinkingExpanded" class="thinking-content">
              <div class="p-3 pl-4 ml-6" style="border-left: 1px solid #ddd">
                <div
                  v-html="renderedThinkingContent"
                  class="prose prose-xs max-w-none text-gray-500"
                  style="word-break: break-word; overflow-wrap: break-word; word-wrap: break-word"></div>
              </div>
            </div>
          </div>

          <!-- 回复内容区域 -->
          <div class="p-3">
            <!-- 文本消息 -->
            <div v-if="message.type === 'text'" class="text-message">
              <div
                v-html="renderedContent"
                class="prose prose-sm max-w-none"
                style="word-break: break-word; overflow-wrap: break-word; word-wrap: break-word"></div>
              <!-- 打字机效果光标 -->
              <span v-if="message.isTyping" class="cursor"></span>
            </div>
            <!-- 图片消息 -->
            <div v-else-if="message.type === 'image'" class="image-message">
              <image-message
                v-if="typeof message.content === 'string'"
                :image-url="message.content"
                @image-click="$emit('image-click', message.content)" />
              <div
                class="image-gallery grid gap-2"
                :class="{
                  'grid-cols-1': (message.content as string[]).length === 1,
                  'grid-cols-2': (message.content as string[]).length > 1
                }">
                <image-message
                  v-for="(img, imgIndex) in message.content as string[]"
                  :key="imgIndex"
                  :image-url="img"
                  :max-width="'small'"
                  @image-click="$emit('image-click', img)" />
              </div>
            </div>
            <!-- 混合消息（图片+文字） -->
            <div v-else-if="message.type === 'mixed'" class="mixed-message">
              <!-- 图片部分 -->
              <div v-if="(message.content as MixedContent).images.length > 0" class="mb-3">
                <div
                  class="image-gallery grid gap-2"
                  :class="{
                    'grid-cols-1': (message.content as MixedContent).images.length === 1,
                    'grid-cols-2': (message.content as MixedContent).images.length > 1
                  }">
                  <image-message
                    v-for="(img, imgIndex) in (message.content as MixedContent).images"
                    :key="imgIndex"
                    :image-url="img"
                    :max-width="'small'"
                    @image-click="$emit('image-click', img)" />
                </div>
              </div>
              <!-- 文字部分 -->
              <div v-if="(message.content as MixedContent).text" class="text-message">
                <div
                  v-html="renderedContent"
                  class="prose prose-sm max-w-none"
                  style="word-break: break-word; overflow-wrap: break-word; word-wrap: break-word"></div>
              </div>
            </div>
          </div>
        </div>
        <!-- 新增：底部按钮和时间区域 -->
        <div class="flex items-center justify-between mt-1">
          <!-- 左侧按钮组 -->
          <div class="flex items-center gap-2">
            <!-- 分页按钮 -->
            <div class="flex items-center gap-1">
              <i-material-symbols-keyboard-arrow-left
                class="text-gray-400 cursor-pointer text-sm"
                @click="$emit('prev-message', message.id)" />
              <span class="text-xs text-gray-400">2/2</span>
              <i-material-symbols-keyboard-arrow-right
                class="text-gray-400 cursor-pointer text-sm"
                @click="$emit('next-message', message.id)" />
            </div>
            <!-- 功能按钮组 -->
            <div class="flex items-center gap-2">
              <i-material-symbols-content-copy
                class="text-gray-400 cursor-pointer text-sm"
                @click="$emit('copy-message', message.id)" />
              <i-material-symbols-refresh
                class="text-gray-400 cursor-pointer text-sm"
                @click="$emit('refresh-message', message.id)" />
              <i-material-symbols-thumb-up
                class="text-gray-400 cursor-pointer text-sm"
                @click="$emit('like-message', message.id)" />
              <i-material-symbols-thumb-down
                class="text-gray-400 cursor-pointer text-sm"
                @click="$emit('dislike-message', message.id)" />
              <i-material-symbols-share
                class="text-gray-400 cursor-pointer text-sm"
                @click="$emit('share-message', message.id)" />
            </div>
          </div>
          <!-- 右侧时间 -->
          <div class="text-xs text-gray-400">{{ message.time }}</div>
        </div>
      </div>
    </div>

    <!-- 自己消息 -->
    <div v-else class="flex gap-2 max-w-[80%] ml-auto">
      <div class="flex-grow min-w-0">
        <div class="bg-blue-500 text-white rounded-lg p-3 shadow-sm">
          <!-- 文本消息 -->
          <div v-if="message.type === 'text'" class="text-message">
            <div
              v-html="renderedContent"
              class="prose prose-sm max-w-none text-white"
              style="word-break: break-word; overflow-wrap: break-word; word-wrap: break-word"></div>
          </div>
          <!-- 图片消息 -->
          <div v-else-if="message.type === 'image'">
            <image-message
              v-if="typeof message.content === 'string'"
              :image-url="message.content"
              @image-click="$emit('image-click', message.content as string)" />
            <div
              class="image-gallery grid gap-2"
              :class="{
                'grid-cols-1': (message.content as string[]).length === 1,
                'grid-cols-2': (message.content as string[]).length > 1
              }">
              <image-message
                v-for="(img, imgIndex) in message.content as string[]"
                :key="imgIndex"
                :image-url="img"
                :max-width="'small'"
                @image-click="$emit('image-click', img)" />
            </div>
          </div>
          <!-- 混合消息（图片+文字） -->
          <div v-else-if="message.type === 'mixed'" class="mixed-message">
            <!-- 图片部分 -->
            <div v-if="(message.content as MixedContent).images.length > 0" class="mb-3">
              <div
                class="image-gallery grid gap-2"
                :class="{
                  'grid-cols-1': (message.content as MixedContent).images.length === 1,
                  'grid-cols-2': (message.content as MixedContent).images.length > 1
                }">
                <image-message
                  v-for="(img, imgIndex) in (message.content as MixedContent).images"
                  :key="imgIndex"
                  :image-url="img"
                  :max-width="'small'"
                  @image-click="$emit('image-click', img)" />
              </div>
            </div>
            <!-- 文字部分 -->
            <div v-if="(message.content as MixedContent).text" class="text-message">
              <div
                v-html="renderedContent"
                class="prose prose-sm max-w-none text-white"
                style="word-break: break-word; overflow-wrap: break-word; word-wrap: break-word"></div>
            </div>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-1 text-right">{{ message.time }}</div>
      </div>
      <div class="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-300">
        <img :src="message.avatar" :alt="message.sender" class="w-full h-full object-cover" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

// 语言映射表，用于将常见的语言别名映射到正确的语言
const languageMap: Record<string, string> = {
  // JavaScript相关别名
  js: "javascript",
  vue: "javascript",
  javascript: "javascript",
  node: "javascript",
  nodejs: "javascript",
  // Java相关别名
  java: "java",
  // 其他常见语言别名
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

// 获取有效的语言标识符
const getValidLanguage = (lang: string): string => {
  // 转换为小写
  const lowerLang = lang.toLowerCase();

  // 如果语言直接存在，返回该语言
  if (hljs.getLanguage(lowerLang)) {
    return lowerLang;
  }

  // 检查语言映射表
  if (languageMap[lowerLang]) {
    return languageMap[lowerLang];
  }

  // 尝试匹配语言映射表的键（处理部分匹配，如"javascrip" -> "javascript"）
  for (const [alias, language] of Object.entries(languageMap)) {
    if (alias.startsWith(lowerLang) && hljs.getLanguage(language)) {
      return language;
    }
  }

  // 默认返回plaintext
  return "plaintext";
};

// 混合类型消息的内容结构
interface MixedContent {
  text: string;
  images: string[];
}

// 消息类型定义
interface Message {
  id: number;
  sender: string;
  content: string | string[] | MixedContent;
  type: "text" | "image" | "mixed";
  time: string;
  isSelf: boolean;
  avatar: string;
  isTyping?: boolean;
  rawContent?: string;
  thinking?: string;
  thinkingTime?: number;
  isThinkingExpanded?: boolean;
  // 思考内容打字机相关字段
  thinkingContent?: string;
  isThinkingTyping?: boolean;
  thinkingRawContent?: string;
}

// 定义props
const props = defineProps<{
  message: Message;
}>();

// 定义emit事件
defineEmits<{
  "image-click": [imageUrl: string];
  "copy-message": [messageId: number];
  "refresh-message": [messageId: number];
  "like-message": [messageId: number];
  "dislike-message": [messageId: number];
  "share-message": [messageId: number];
  "prev-message": [messageId: number];
  "next-message": [messageId: number];
}>();

// 思考内容展开状态
const isThinkingExpanded = ref(props.message.isThinkingExpanded ?? true);

// 记录容器最大宽度
const containerMaxWidth = ref<string>("");

// 思考内容容器引用
const thinkingContainerRef = ref<HTMLElement | null>(null);

// 切换思考内容展开状态
const toggleThinkingExpanded = () => {
  // 在折叠前记录当前宽度
  if (isThinkingExpanded.value && thinkingContainerRef.value) {
    const currentWidth = thinkingContainerRef.value.offsetWidth;
    if (!containerMaxWidth.value || currentWidth > parseInt(containerMaxWidth.value, 10)) {
      containerMaxWidth.value = `${currentWidth}px`;
    }
  }
  isThinkingExpanded.value = !isThinkingExpanded.value;
};

// 监听思考内容展开状态变化，更新宽度
watch(isThinkingExpanded, (newVal) => {
  if (!newVal && thinkingContainerRef.value) {
    // 折叠时应用最大宽度
    thinkingContainerRef.value.style.minWidth = containerMaxWidth.value;
  }
});

// 渲染思考内容的markdown
const renderedThinkingContent = computed(() => {
  const thinkingText = props.message.thinkingContent || props.message.thinking || "";
  if (!thinkingText) {
    return "";
  }

  const html = marked.parse(thinkingText, {
    breaks: true,
    gfm: true
  }) as string;

  // 处理思考内容的DOM，确保列表正确渲染
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // 确保有序列表和无序列表正确渲染
  const lists = tempDiv.querySelectorAll("ol, ul");
  lists.forEach((list) => {
    // 为列表添加明确的样式类
    list.classList.add("thinking-list");

    // 确保列表项有正确的样式
    const listItems = list.querySelectorAll("li");
    listItems.forEach((item) => {
      item.classList.add("thinking-list-item");
    });
  });

  return tempDiv.innerHTML;
});

// 渲染markdown内容，集成highlight.js用于代码高亮
const renderedContent = computed(() => {
  if (props.message.type !== "text" && props.message.type !== "mixed") {
    return "";
  }

  // 处理文本或混合类型消息的文本内容
  let textContent = "";
  if (props.message.type === "text") {
    textContent = props.message.content as string;
  } else if (props.message.type === "mixed") {
    textContent = (props.message.content as MixedContent).text;
  }

  // 使用marked.parse，通过pedantic选项控制解析行为
  const html = marked.parse(textContent, {
    breaks: true,
    gfm: true
  }) as string;

  // 手动对代码块进行高亮处理
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const codeBlocks = tempDiv.querySelectorAll("pre code");
  codeBlocks.forEach((block) => {
    const codeElement = block as HTMLElement;
    // 获取语言类名，如"language-javascript"
    const langClass = Array.from(codeElement.classList).find((cls) => cls.startsWith("language-"));
    let lang = "plaintext";

    if (langClass) {
      // 提取语言标识符，如"javascript"
      const langId = langClass.replace("language-", "");
      // 获取有效的语言标识符
      lang = getValidLanguage(langId);
    }

    try {
      // 使用highlight函数进行高亮，避免无效语言警告
      const highlighted = hljs.highlight(codeElement.textContent || "", { language: lang });
      codeElement.innerHTML = highlighted.value;
      codeElement.className = `language-${lang}`;

      // 为代码块添加带有吸顶功能的header
      const preElement = codeElement.parentElement as HTMLElement;
      if (preElement) {
        // 创建代码块容器
        const codeContainer = document.createElement("div");
        codeContainer.className = "code-block-container";

        // 创建吸顶header
        const header = document.createElement("div");
        header.className = "code-header";

        // 添加语言类型
        const langSpan = document.createElement("span");
        langSpan.className = "code-lang";
        langSpan.textContent = lang;

        // 创建操作按钮容器
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "code-actions";

        // 添加复制按钮
        const copyBtn = document.createElement("button");
        copyBtn.className = "code-action-btn";
        copyBtn.innerHTML = "📋 复制";
        copyBtn.setAttribute("data-clipboard-text", codeElement.textContent || "");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard
            .writeText(codeElement.textContent || "")
            .then(() => {
              // 可以添加复制成功的提示
              console.log("代码已复制到剪贴板");
            })
            .catch((err) => {
              console.error("复制失败:", err);
            });
        });

        // 添加下载按钮
        const downloadBtn = document.createElement("button");
        downloadBtn.className = "code-action-btn";
        downloadBtn.innerHTML = "💾 下载";
        downloadBtn.addEventListener("click", () => {
          const blob = new Blob([codeElement.textContent || ""], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `code.${lang}`;
          a.click();
          URL.revokeObjectURL(url);
        });

        // 组装header
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(downloadBtn);
        header.appendChild(langSpan);
        header.appendChild(actionsDiv);

        // 将pre元素移动到新容器中
        preElement.parentNode?.insertBefore(codeContainer, preElement);
        codeContainer.appendChild(header);
        codeContainer.appendChild(preElement);
      }
    } catch (error) {
      console.error("代码高亮失败:", error);
      // 高亮失败时，使用默认样式
      codeElement.className = "language-plaintext";
    }
  });

  return tempDiv.innerHTML;
});
</script>

<style scoped>
/* 确保只有消息内容可以选择，其他区域不可选择 */
.message-item {
  user-select: none;
}

/* 思考内容容器 */
.thinking-container {
  position: relative;
}

/* 思考内容吸顶效果 */
.thinking-header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(4px);
}

/* 思考内容折叠/展开动画 */
.thinking-content {
  transition: all 0.3s ease;
}

/* 思考内容的列表样式 - 覆盖全局样式干扰 */
:deep(.thinking-content) {
  /* 减小思考内容的字体大小 */
  font-size: 0.8rem;

  /* 有序列表样式 */
  & ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  /* 无序列表样式 */
  & ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  /* 列表项样式 */
  & li {
    margin: 0.25rem 0;
    line-height: 1.4;
    color: #6b7280;
  }

  /* 嵌套列表样式 */
  & ol ol,
  & ol ul,
  & ul ol,
  & ul ul {
    margin: 0.25rem 0;
    padding-left: 1rem;
  }

  /* 确保列表样式不受全局样式影响 */
  & .thinking-list {
    list-style-type: revert;
    padding-left: 1.5rem;
  }

  & .thinking-list-item {
    list-style-type: revert;
    margin: 0.25rem 0;
  }
}

/* 消息内容的列表样式 - 确保消息中的列表正确显示 */
:deep(.text-message) {
  /* 有序列表样式 */
  & ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  /* 无序列表样式 */
  & ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }

  /* 列表项样式 */
  & li {
    margin: 0.25rem 0;
    line-height: 1.5;
  }

  /* 嵌套列表样式 */
  & ol ol,
  & ol ul,
  & ul ol,
  & ul ul {
    margin: 0.25rem 0;
    padding-left: 1rem;
  }
}

/* 思考内容中的代码样式 */
:deep(.thinking-content code) {
  padding: 0.15em 0.3em;
  background-color: rgba(175, 243, 255, 0.2);
  border-radius: 3px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.8em;
  color: #0ea5e9;
}

/* 思考内容中的代码块样式 */
:deep(.thinking-content pre) {
  margin: 0.5em 0;
  padding: 0.75em;
  background-color: rgba(175, 243, 255, 0.1);
  border-radius: 4px;
  overflow: auto;
  font-size: 0.8em;
  line-height: 1.4;
  border: 1px solid rgba(147, 197, 253, 0.3);
}

:deep(.thinking-content pre code) {
  background-color: transparent;
  padding: 0;
  border: none;
  color: #6b7280;
}

/* 思考内容中的标题样式 */
:deep(.thinking-content h1),
:deep(.thinking-content h2),
:deep(.thinking-content h3),
:deep(.thinking-content h4),
:deep(.thinking-content h5),
:deep(.thinking-content h6) {
  margin: 0.75em 0 0.5em;
  color: #6b7280;
  font-size: 0.9em;
  font-weight: 600;
}

/* iconify图标样式 */
:deep(.thinking-header .iconify-icon) {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 允许消息内容区域选择文本 */
.message-item .text-message,
.message-item :deep(.prose),
.message-item :deep(.prose) *,
.message-item :deep(code),
.message-item :deep(pre) {
  user-select: text;
}

/* 全局换行样式，确保长字符串不挤压头像 */
:deep(.prose) {
  word-break: break-word;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

/* 确保pre标签内容不会溢出 */
:deep(.prose pre) {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 确保code标签内容不会溢出 */
:deep(.prose code) {
  word-break: break-word;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

/* 确保普通文本内容不会溢出 */
.text-message {
  word-break: break-word;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

/* 光标闪烁动画 */
@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* 光标样式 */
.cursor {
  display: inline-block;
  width: 8px;
  height: 1em;
  background-color: #6b7280;
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: baseline;
}

/* 消息操作按钮样式 */
:deep(.material-symbols-outlined) {
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s ease;
}

:deep(.material-symbols-outlined:hover) {
  color: #3b82f6;
}

/* 分页按钮样式 */
.pagination-btn {
  cursor: pointer;
  transition: color 0.2s ease;
}

.pagination-btn:hover {
  color: #3b82f6;
}

/* 消息操作按钮容器 */
.message-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 文本消息容器，用于定位光标 */
.text-message {
  position: relative;
  display: inline-block;
  width: 100%;
}

/* Markdown 渲染样式 - 通用 */
:deep(.prose) {
  margin: 0;
  padding: 0;
}

:deep(.prose p) {
  line-height: 1.5;
}

:deep(.prose strong) {
  font-weight: 600;
}

/* Markdown 渲染样式 - 列表 */
:deep(.prose ul),
:deep(.prose ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

:deep(.prose li) {
  margin: 0.25em 0;
  line-height: 1.5;
}

/* Markdown 渲染样式 - 代码块 */
:deep(.prose pre) {
  margin: 0.75em 0;
  padding: 0;
  background-color: #f6f8fa;
  border-radius: 6px;
  overflow: auto;
  font-size: 0.875em;
  line-height: 1.5;
  border: 1px solid #e1e4e8;
  position: relative;
}

:deep(.prose pre code) {
  padding: 1em;
  background-color: transparent;
  border: none;
  border-radius: 0;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  display: block;
  white-space: pre;
  overflow-x: auto;
}

:deep(.prose code) {
  padding: 0.2em 0.4em;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 0.875em;
  word-break: break-word;
}

/* 自己消息的 Markdown 样式 */
:deep(.bg-blue-500 .prose) {
  color: white;
}

:deep(.bg-blue-500 .prose code) {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
}

:deep(.bg-blue-500 .prose pre) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

:deep(.bg-blue-500 .prose pre code) {
  background-color: transparent;
  color: white;
}

:deep(.bg-blue-500 .prose a) {
  color: #93c5fd;
  text-decoration: underline;
}

/* 对方消息的 Markdown 样式 */
:deep(.bg-white .prose a) {
  color: #2563eb;
  text-decoration: underline;
}

/* 代码块容器样式 */
:deep(.code-block-container) {
  position: relative;
  margin: 0.75em 0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 代码块吸顶header样式 */
:deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  background-color: #f1f3f4;
  border-bottom: 1px solid #e1e4e8;
  font-size: 0.875em;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 代码语言类型样式 */
:deep(.code-lang) {
  color: #656d76;
  text-transform: capitalize;
  margin-right: 1em;
}

/* 代码操作按钮容器样式 */
:deep(.code-actions) {
  display: flex;
  gap: 0.5em;
  margin-left: auto;
}

/* 代码操作按钮样式 */
:deep(.code-action-btn) {
  background: none;
  border: none;
  padding: 0.25em 0.5em;
  border-radius: 3px;
  cursor: pointer;
  color: #656d76;
  font-size: 0.875em;
  display: flex;
  align-items: center;
  gap: 0.25em;
  transition: all 0.2s ease;
}

/* 代码操作按钮悬停样式 */
:deep(.code-action-btn:hover) {
  background-color: rgba(0, 0, 0, 0.05);
  color: #24292f;
}

/* 确保代码块内容样式正确 */
:deep(.code-block-container pre) {
  margin: 0 !important;
  border-radius: 0 0 6px 6px;
  border: none;
}

/* 调整深色模式下的样式 */
:deep(.bg-blue-500 .code-header) {
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.bg-blue-500 .code-lang) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.bg-blue-500 .code-action-btn) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.bg-blue-500 .code-action-btn:hover) {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
}

:deep(.bg-blue-500 .code-block-container pre) {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
