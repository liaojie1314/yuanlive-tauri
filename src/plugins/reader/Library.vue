<template>
  <div
    class="h-screen w-screen flex flex-col bg-[var(--right-bg-color)] text-[var(--text-color)] overflow-hidden transition-colors duration-300">
    <action-bar />

    <n-scrollbar class="flex-1">
      <div class="p-6 flex flex-col min-h-full">
        <div class="flex justify-between items-center mb-6 shrink-0">
          <h1 class="text-2xl font-bold">{{ t("plugins.reader.library") }}</h1>

          <div class="flex items-center gap-4">
            <n-dropdown trigger="click" :options="addMenuOptions" @select="handleAddSelect">
              <n-button type="primary" :loading="loading">
                <template #icon>
                  <i-carbon-add class="text-[var(--bg-popover)]" />
                </template>
                <div class="flex items-center gap-1">
                  {{ t("plugins.reader.add") }}
                  <i-carbon-chevron-down class="text-[var(--bg-popover)]" />
                </div>
              </n-button>
            </n-dropdown>
          </div>
        </div>

        <n-tabs type="line" animated v-model:value="activeTab" @update:value="handleTabChange">
          <n-tab-pane name="local" :tab="t('plugins.reader.localComic')">
            <div
              v-if="comicList.length > 0"
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <div
                v-for="(comic, index) in comicList"
                class="group relative flex flex-col cursor-pointer transition-transform hover:-translate-y-1"
                :key="comic.path"
                @click="openReader(comic)">
                <div
                  class="w-full aspect-[3/4] rounded-lg overflow-hidden shadow-md bg-[var(--bg-setting-item)] border border-[var(--line-color)] relative">
                  <n-image
                    v-if="comic.cover"
                    preview-disabled
                    lazy
                    object-fit="cover"
                    class="w-full h-full"
                    :src="(comic.source || 'local') === 'local' ? convertFileSrc(comic.cover) : comic.cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-[var(--disabled-color)]">
                    {{ t("plugins.reader.noCover") }}
                  </div>

                  <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <n-button circle size="small" type="error" @click.stop="removeComic(index)">
                      <template #icon><i-carbon-trash-can class="text-[var(--bg-popover)]" /></template>
                    </n-button>
                  </div>

                  <div
                    v-if="(comic.source || 'local') !== 'local'"
                    class="absolute bottom-0 left-0 bg-blue-500/80 text-white text-[10px] px-1.5 py-0.5 rounded-tr-md">
                    {{ getParserName(comic.source) }}
                  </div>
                </div>

                <div class="mt-2 text-sm font-medium text-center truncate px-1" :title="comic.title">
                  {{ comic.title }}
                </div>
              </div>
            </div>

            <div v-else class="flex-1 flex-center py-20 text-[var(--user-text-color)]">
              <n-empty :description="t('plugins.reader.empty')" />
            </div>
          </n-tab-pane>

          <n-tab-pane name="baozi" tab="包子漫画">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-sm text-[var(--user-text-color)]">{{ t("plugins.reader.selectLine") }}</span>
              <n-select
                size="small"
                class="w-64"
                v-model:value="currentBaoziUrl"
                :options="baoziUrls"
                @update:value="fetchOnlineList" />
              <n-spin v-if="parsing" size="small" />
            </div>
            <div
              v-if="onlineList.length > 0"
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pt-4">
              <div
                v-for="(comic, index) in onlineList"
                class="group relative flex flex-col cursor-pointer transition-transform hover:-translate-y-1"
                :key="index"
                @click="openOnlineReader(comic)">
                <div
                  class="w-full aspect-[3/4] rounded-lg overflow-hidden shadow-md bg-[var(--bg-setting-item)] border border-[var(--line-color)] relative">
                  <n-image
                    v-if="comic.cover"
                    preview-disabled
                    lazy
                    object-fit="cover"
                    class="w-full h-full"
                    :src="comic.cover" />

                  <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <n-button circle size="small" type="primary" @click.stop="addToLibrary(comic)">
                      <template #icon><i-carbon-bookmark class="text-white" /></template>
                    </n-button>
                  </div>
                </div>

                <div class="mt-2 text-sm font-medium text-center truncate px-1" :title="comic.title">
                  {{ comic.title }}
                </div>
              </div>
            </div>
            <div v-else class="flex items-center justify-center py-20 text-[var(--user-text-color)]">
              <n-empty :description="t('plugins.reader.noData')" />
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { TauriCommandEnum } from "@/enums";
import { useWindow } from "@/hooks/useWindow";
import { parseBaoziList, type ComicItem } from "@/utils/ComicParser";

const { t } = useI18n();
const { createWebviewWindow } = useWindow();

interface ComicMeta {
  title: string;
  path: string;
  cover: string;
  source?: string; // 'local' | 'baozi' 等
}

const CACHE_KEY = "comic-library";
const parserOptions = [{ label: "包子漫画", value: "baozi" }];
const baoziUrls = [
  { label: "包子漫画 - 线路1", value: "https://www.baozimh.com/classify?type=all&region=all&state=all&filter=*" },
  { label: "包子漫画 - 线路2", value: "https://www.bzmgcn.com/classify?type=all&region=all&state=all&filter=*" }
];

const currentBaoziUrl = ref(baoziUrls[0].value);
const activeTab = ref("local");
const onlineList = ref<ComicItem[]>([]);
const parsing = ref(false);
const comicList = ref<ComicMeta[]>([]);
const loading = ref(false);
const addMenuOptions = computed(() => [
  { label: t("plugins.reader.importBatch"), key: "batch" },
  { label: t("plugins.reader.addSingle"), key: "single" }
]);

/** 保存到本地存储 */
const saveLibrary = () => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(comicList.value));
};

/**
 * 获取漫画来源的显示名称
 * @param source 源类型
 * @returns 显示名称
 */
const getParserName = (source?: string) => {
  return parserOptions.find((p) => p.value === source)?.label || "在线漫画";
};

/**
 * 处理切换 Tab 时的操作
 * @param tab 切换到的 Tab 名称
 */
const handleTabChange = (tab: string) => {
  // 当用户点击到 "baozi" 这个 tab，且列表是空的，就自动触发解析
  if (tab === "baozi" && onlineList.value.length === 0) {
    fetchOnlineList();
  }
};

/** 抓取在线漫画列表 */
const fetchOnlineList = async () => {
  parsing.value = true;
  onlineList.value = []; // 切换线路时先清空旧数据

  try {
    // 传入当前选中的下拉框 URL 进行解析
    const listData = await parseBaoziList(currentBaoziUrl.value);

    if (listData.length > 0) {
      onlineList.value = listData;
    } else {
      window.$message?.warning(t("plugins.reader.msg.noDataError"));
    }
  } catch (error) {
    console.error("在线列表解析失败:", error);
    window.$message?.error(t("plugins.reader.msg.networkRequestError"));
  } finally {
    parsing.value = false;
  }
};

/**
 * 将在线漫画添加到本地书架收藏
 * @param comic 在线漫画对象
 */
const addToLibrary = (comic: ComicItem) => {
  const exists = comicList.value.find((c) => c.path === comic.url);
  if (!exists) {
    comicList.value.push({
      title: comic.title,
      path: comic.url, // 在线漫画的 path 就是它的 url
      cover: comic.cover,
      source: "baozi" // 标记来源
    });
    saveLibrary();
    window.$message?.success(t("plugins.reader.msg.collectSuccess"));
  } else {
    window.$message?.warning(t("plugins.reader.msg.collectExist"));
  }
};

/**
 * 在新窗口中打开阅读器
 * @param comic 要阅读的漫画元数据
 */
const openReader = async (comic: ComicMeta) => {
  const uniqueId = `${comic.title.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`;
  const safeLabel = `reader--${uniqueId}`;
  const source = comic.source || "local";

  await createWebviewWindow(
    `${t("plugins.reader.reading")} ${comic.title}`,
    safeLabel,
    1200,
    800,
    undefined,
    true,
    800,
    600,
    undefined,
    undefined,
    false,
    true,
    {
      path: comic.path,
      title: comic.title,
      source: source
    }
  );
};

/**
 * 从书架移除漫画
 * @param index 要移除的漫画在列表中的索引
 */
const removeComic = (index: number) => {
  comicList.value.splice(index, 1);
  saveLibrary();
};

/**
 * 处理添加漫画的下拉菜单选择
 * @param key 选择的添加模式
 */
const handleAddSelect = async (key: string) => {
  if (key === "single") {
    await handleAddSingleComic();
  } else if (key === "batch") {
    await handleAddBatchComics();
  }
};

/** 添加单本漫画 */
const handleAddSingleComic = async () => {
  try {
    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: t("plugins.reader.selectComicFolder")
    });

    if (!selectedPath) return;

    loading.value = true;
    const comicData: any = await invoke(TauriCommandEnum.PARSE_COMIC_DIRECTORY, {
      rootPath: selectedPath
    });

    const pathParts = (selectedPath as string).split(/[\\/]/);
    const title = pathParts[pathParts.length - 1] || t("plugins.reader.unnamedComic");

    const exists = comicList.value.find((c) => c.path === selectedPath);
    if (!exists) {
      comicList.value.push({ title, path: selectedPath as string, cover: comicData.cover, source: "local" });
      saveLibrary();
      window.$message?.success(t("plugins.reader.msg.addSuccess"));
    } else {
      window.$message?.warning(t("plugins.reader.msg.addExist"));
    }
  } catch (error) {
    console.error("添加失败:", error);
    window.$message?.error(t("plugins.reader.msg.addError"));
  } finally {
    loading.value = false;
  }
};

/** 批量导入漫画库文件夹 */
const handleAddBatchComics = async () => {
  try {
    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: t("plugins.reader.selectBatchFolder")
    });

    if (!selectedPath) return;
    loading.value = true;

    // 调用新的轻量级扫描命令
    const newComics: ComicMeta[] = await invoke(TauriCommandEnum.SCAN_COMIC_LIBRARY, {
      rootPath: selectedPath
    });

    if (newComics.length === 0) {
      window.$message?.warning(t("plugins.reader.msg.noComicFolder"));
      return;
    }

    let addedCount = 0;
    // 遍历导入并去重
    newComics.forEach((newComic) => {
      const exists = comicList.value.find((c) => c.path === newComic.path);
      if (!exists) {
        comicList.value.push({ ...newComic, source: "local" });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      saveLibrary();
      window.$message?.success(t("plugins.reader.msg.importSuccess", { count: addedCount }));
    } else {
      window.$message?.info(t("plugins.reader.msg.importExist"));
    }
  } catch (error) {
    console.error("批量导入失败:", error);
    window.$message?.error(t("plugins.reader.msg.importError"));
  } finally {
    loading.value = false;
  }
};

/**
 * 打开在线漫画阅读器
 * @param comic 列表中点击的在线漫画
 */
const openOnlineReader = async (comic: ComicItem) => {
  const uniqueId = `${comic.title.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`;
  const safeLabel = `reader--${uniqueId}`;

  await createWebviewWindow(
    `${t("plugins.reader.reading")} ${comic.title}`,
    safeLabel,
    1200,
    800,
    undefined,
    true,
    800,
    600,
    undefined,
    undefined,
    false,
    true,
    {
      path: comic.url,
      title: comic.title,
      source: "baozi"
    }
  );
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) {
    comicList.value = JSON.parse(saved);
  }
});
</script>
