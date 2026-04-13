<template>
  <div
    class="h-screen w-screen flex flex-col bg-[var(--right-bg-color)] text-[var(--text-color)] overflow-hidden select-none transition-colors duration-300">
    <action-bar iconColor="var(--action-bar-icon-color)" />

    <div class="flex-1 flex overflow-hidden">
      <div
        class="w-64 bg-[var(--bg-left-menu)] border-r border-[var(--line-color)] flex flex-col transition-colors duration-300">
        <div class="p-3 border-b border-[var(--line-color)] text-sm font-bold text-[var(--user-text-color)]">
          {{ t("plugins.reader.directory", { count: comicData?.chapters.length || 0 }) }}
        </div>
        <n-scrollbar class="flex-1">
          <div class="p-3 space-y-1.5">
            <button
              v-for="(chapter, idx) in comicData?.chapters"
              class="relative w-full text-left px-3 py-3 rounded-xl transition-all duration-200 flex justify-between items-center group border-none outline-none cursor-pointer"
              :key="idx"
              :class="
                idx === currentChapterIndex
                  ? 'bg-[var(--bg-left-active)] text-[var(--left-active-text-color)] font-semibold shadow-sm'
                  : 'bg-transparent hover:bg-[var(--bg-left-menu-hover)] text-[var(--left-text-color)] hover:text-[var(--text-color)] font-medium'
              "
              @click="selectChapter(idx)">
              <div class="flex items-center gap-2.5 overflow-hidden">
                <div
                  class="w-1 h-4 rounded-full transition-colors duration-200 shrink-0"
                  :class="
                    idx === currentChapterIndex
                      ? 'bg-[var(--message-render-color)]'
                      : 'bg-transparent group-hover:bg-[var(--disabled-color)]/30'
                  "></div>
                <span class="truncate">{{ chapter.name }}</span>
              </div>

              <span
                class="text-[11px] px-2.5 py-0.5 rounded-full transition-colors shrink-0 tracking-wider"
                :class="
                  idx === currentChapterIndex
                    ? 'bg-[var(--right-bg-color)] text-[var(--message-render-color)]'
                    : 'bg-[var(--button-bg-color)] text-[var(--user-text-color)] group-hover:bg-[var(--bg-setting-item)]'
                ">
                {{ chapter.pages.length }} P
              </span>
            </button>
          </div>
        </n-scrollbar>
      </div>

      <div
        ref="scrollContainer"
        class="flex-1 overflow-y-auto overflow-x-hidden px-4 flex flex-col items-center bg-[var(--bg-popover)] relative transition-colors duration-300"
        @scroll="handleScroll">
        <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center z-10">
          <n-spin size="large" />
          <div class="mt-4 text-[var(--user-text-color)]">{{ t("plugins.reader.loading") }}</div>
        </div>

        <template v-else>
          <div
            v-for="(url, idx) in currentPages"
            class="max-w-[800px] w-full max-w-full bg-[var(--tray-bg-color)]"
            :key="idx">
            <n-image
              lazy
              fallback-src=""
              style="display: block"
              class="w-full max-w-full"
              :img-props="{ style: 'width: 100%; max-width: 100%; height: auto; display: block;' }"
              :src="url"
              :intersection-observer-options="{ rootMargin: '1200px' }" />
          </div>

          <div v-if="currentPages.length > 0" class="w-full max-w-[800px] flex justify-between items-center py-12 px-4">
            <n-button
              ghost
              class="color-[var(--text-color)]"
              :disabled="currentChapterIndex === 0"
              @click="selectChapter(currentChapterIndex - 1)">
              <template #icon><i-carbon-chevron-left /></template>
              {{ t("plugins.reader.prevChapter") }}
            </n-button>
            <span class="text-[var(--user-text-color)] text-sm">{{ t("plugins.reader.bottom") }}</span>
            <n-button
              ghost
              class="color-[var(--text-color)]"
              :disabled="currentChapterIndex === (comicData?.chapters.length || 1) - 1"
              @click="selectChapter(currentChapterIndex + 1)">
              {{ t("plugins.reader.nextChapter") }}
              <template #icon><i-carbon-chevron-right /></template>
            </n-button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { TauriCommandEnum } from "@/enums";
import { parseBaoziComic, parseBaoziChapterImages } from "@/utils/ComicParser";

const { t } = useI18n();
const route = useRoute();

interface Chapter {
  name: string;
  url?: string; // 在线特有：章节的网页链接
  pages: string[];
}
interface ComicBook {
  cover: string;
  chapters: Chapter[];
}
interface ReadingProgress {
  chapterIndex: number;
  scrollTop: number;
}

const comicPath = route.query.path as string;
const comicSource = (route.query.source as string) || "local";
const PROGRESS_KEY = "comic-reading-progress";
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

const loading = ref(true);
const scrollContainer = ref<HTMLElement | null>(null);
const comicData = ref<ComicBook | null>(null);
const currentChapterIndex = ref(0);

// 统一页面地址获取
const currentPages = computed(() => {
  if (!comicData.value || comicData.value.chapters.length === 0) return [];
  const chapter = comicData.value.chapters[currentChapterIndex.value];
  // 如果是在线漫画，图片URL不需要 convertFileSrc
  if (comicSource !== "local") {
    return chapter.pages || [];
  }
  // 如果是本地，才转换
  return chapter.pages.map((path) => convertFileSrc(path));
});

/** 保存当前阅读进度 */
const saveProgress = () => {
  if (!scrollContainer.value || !comicPath) return;
  try {
    // 读取旧账本
    const cache = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    // 更新当前这本漫画的进度
    cache[comicPath] = {
      chapterIndex: currentChapterIndex.value,
      scrollTop: scrollContainer.value.scrollTop
    };
    // 写回本地
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("保存进度失败", e);
  }
};

/** 处理滚动事件 */
const handleScroll = () => {
  if (scrollTimeout) clearTimeout(scrollTimeout);
  // 用户停止滚动 500ms 后才执行保存，极其丝滑
  scrollTimeout = setTimeout(() => {
    saveProgress();
  }, 500);
};

/**
 * 静默预加载图片列表
 * @param urls 图片链接数组
 * @param concurrency 并发数量（默认3张，避免瞬间占用过多带宽导致当前正在看的图片卡顿）
 */
const preloadImages = (urls: string[], concurrency: number = 3) => {
  if (!urls || urls.length === 0) return;
  let currentIndex = 0;
  // 执行单张图片的加载
  const loadNext = () => {
    if (currentIndex >= urls.length) return; // 全部加载完毕
    const url = urls[currentIndex++];
    const img = new Image();
    // 加载成功或失败后，继续加载下一张，形成队列
    img.onload = loadNext;
    img.onerror = loadNext;
    // 赋值 src 触发浏览器后台静默下载
    img.src = url;
  };
  // 启动指定数量的并发加载线
  for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
    loadNext();
  }
};

/**
 * 加载章节内的具体图片
 * @param index 章节索引
 */
const loadChapterContent = async (index: number) => {
  if (!comicData.value) return;
  const chapter = comicData.value.chapters[index];

  // 如果是在线包子漫画，并且该章节还没抓取过图片，则动态抓取
  if (comicSource === "baozi" && (!chapter.pages || chapter.pages.length === 0) && chapter.url) {
    loading.value = true;
    try {
      chapter.pages = await parseBaoziChapterImages(chapter.url);
    } catch (e) {
      window.$message?.error(t("plugins.reader.msg.getChapterError"));
    } finally {
      loading.value = false;
    }
  }
  let urlsToPreload: string[] = [];
  if (comicSource === "local") {
    // 本地漫画需要转换路径
    urlsToPreload = chapter.pages.map((path) => convertFileSrc(path));
  } else {
    // 在线漫画直接是 URL
    urlsToPreload = chapter.pages || [];
  }
  // 延迟 500ms 执行，优先保证前台的第一、第二张图片能够第一时间被 n-image 渲染和加载
  setTimeout(() => {
    preloadImages(urlsToPreload, 3); // 开启 3 个并发线程悄悄下载
  }, 500);

  setTimeout(() => {
    preloadImages(urlsToPreload, 3);

    // 预读下一章 (仅限本地漫画或已经抓过在线目录的)
    const nextIndex = index + 1;
    if (comicData.value && nextIndex < comicData.value.chapters.length) {
      const nextChapter = comicData.value.chapters[nextIndex];
      // 如果本地漫画有下一章的路径，就提前预读下一章的前 2 张图
      if (comicSource === "local" && nextChapter.pages) {
        const nextUrls = nextChapter.pages.slice(0, 2).map((p) => convertFileSrc(p));
        preloadImages(nextUrls, 1); // 用 1 个极低优先级的线程慢慢下
      }
    }
  }, 500);
};

/**
 * 切换章节
 * @param index 章节索引
 * @param resetScroll 是否需要回到顶部 (默认 true，读取进度时传 false)
 */
const selectChapter = async (index: number, resetScroll: boolean = true) => {
  await loadChapterContent(index);
  currentChapterIndex.value = index;

  await nextTick();
  if (scrollContainer.value) {
    if (resetScroll) {
      scrollContainer.value.scrollTop = 0;
    }
  }
  // 手动切章后，立刻保存一次进度
  saveProgress();
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();

  if (!comicPath) {
    loading.value = false;
    window.$message?.error(t("plugins.reader.msg.noPathError"));
    return;
  }

  try {
    // 获取目录数据
    if (comicSource === "local") {
      const res: ComicBook = await invoke(TauriCommandEnum.PARSE_COMIC_DIRECTORY, {
        rootPath: comicPath
      });
      comicData.value = res;
    } else if (comicSource === "baozi") {
      const res: ComicBook = await parseBaoziComic(comicPath);
      comicData.value = res;
    }
    // 读取进度并跳转
    if (comicData.value && comicData.value.chapters.length > 0) {
      // 查账本
      const cache = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      const progress: ReadingProgress | undefined = cache[comicPath];
      if (progress && progress.chapterIndex < comicData.value.chapters.length) {
        // 发现历史进度！加载那个章节，并且不重置滚动条
        await selectChapter(progress.chapterIndex, false);
        // 延迟一点点时间，等图片 DOM 撑开高度后，再恢复滚动条位置
        setTimeout(() => {
          if (scrollContainer.value) {
            scrollContainer.value.scrollTop = progress.scrollTop || 0;
          }
        }, 150);
        window.$message?.success(t("plugins.reader.msg.restoreSuccess", { index: progress.chapterIndex + 1 }));
      } else {
        // 没看过这本，默认加载第 0 章
        await selectChapter(0);
      }
    }
  } catch (err) {
    console.error("加载漫画数据失败:", err);
    window.$message?.error(t("plugins.reader.msg.loadError"));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* 使用主题变量控制滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: var(--bg-popover);
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--line-color);
  border-radius: 4px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--float-block-hover-color);
}
</style>
