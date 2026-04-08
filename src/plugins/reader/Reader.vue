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
        class="flex-1 overflow-y-auto overflow-x-hidden px-4 flex flex-col items-center bg-[var(--bg-popover)] relative transition-colors duration-300">
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

const comicPath = route.query.path as string;
const comicSource = (route.query.source as string) || "local";

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
};

/**
 * 切换章节
 * @param index 章节索引
 */
const selectChapter = async (index: number) => {
  await loadChapterContent(index);
  currentChapterIndex.value = index;
  // 切换章节后滚动条回到顶部
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();

  if (!comicPath) {
    loading.value = false;
    window.$message?.error(t("plugins.reader.msg.noPathError"));
    return;
  }

  try {
    if (comicSource === "local") {
      const res: ComicBook = await invoke(TauriCommandEnum.PARSE_COMIC_DIRECTORY, {
        rootPath: comicPath
      });
      comicData.value = res;
    } else if (comicSource === "baozi") {
      const res: ComicBook = await parseBaoziComic(comicPath);
      comicData.value = res;
      if (comicData.value.chapters.length > 0) {
        await loadChapterContent(0);
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
