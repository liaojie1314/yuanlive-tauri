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
        <div v-if="loading" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
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

const { t } = useI18n();
const route = useRoute();

interface Chapter {
  name: string;
  pages: string[];
}
interface ComicBook {
  cover: string;
  chapters: Chapter[];
}

const comicPath = route.query.path as string;

const loading = ref(true);
const scrollContainer = ref<HTMLElement | null>(null);
const comicData = ref<ComicBook | null>(null);
const currentChapterIndex = ref(0);

// 将后端返回的本地绝对路径转为前端可用的 tauri URL
const currentPages = computed(() => {
  if (!comicData.value || comicData.value.chapters.length === 0) return [];
  const chapter = comicData.value.chapters[currentChapterIndex.value];
  return chapter.pages.map((path) => convertFileSrc(path));
});

/**
 * 切换章节
 * @param index 章节索引
 */
const selectChapter = async (index: number) => {
  currentChapterIndex.value = index;
  // 切换章节后滚动条回到顶部
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  if (!comicPath) return;
  try {
    // 重新调用后端解析目录获取全部章节数据
    const res: ComicBook = await invoke(TauriCommandEnum.PARSE_COMIC_DIRECTORY, {
      rootPath: comicPath
    });
    comicData.value = res;
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
