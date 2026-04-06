<template>
  <div
    class="h-screen w-screen flex flex-col bg-[var(--right-bg-color)] text-[var(--text-color)] overflow-hidden transition-colors duration-300">
    <action-bar />

    <div class="flex-1 p-6 overflow-y-auto flex flex-col">
      <div class="flex justify-between items-center mb-6 shrink-0">
        <h1 class="text-2xl font-bold">{{ t("plugins.reader.library") }}</h1>

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
              :src="convertFileSrc(comic.cover)" />
            <div v-else class="w-full h-full flex items-center justify-center text-[var(--disabled-color)]">无封面</div>

            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <n-button circle size="small" type="error" @click.stop="removeComic(index)">
                <template #icon><i-carbon-trash-can class="text-[var(--bg-popover)]" /></template>
              </n-button>
            </div>
          </div>

          <div class="mt-2 text-sm font-medium text-center truncate px-1" :title="comic.title">
            {{ comic.title }}
          </div>
        </div>
      </div>

      <div v-else class="flex-1 flex items-center justify-center text-[var(--user-text-color)]">
        <n-empty :description="t('plugins.reader.empty')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import { useI18n } from "vue-i18n";

import { TauriCommandEnum } from "@/enums";
import { useWindow } from "@/hooks/useWindow";

const { t } = useI18n();
const { createWebviewWindow } = useWindow();

interface ComicMeta {
  title: string;
  path: string;
  cover: string;
}

const CACHE_KEY = "comic-library";

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
 * 在新窗口中打开阅读器
 * @param comic 要阅读的漫画元数据
 */
const openReader = async (comic: ComicMeta) => {
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
      path: comic.path,
      title: comic.title
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
      comicList.value.push({ title, path: selectedPath as string, cover: comicData.cover });
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
        comicList.value.push(newComic);
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

onMounted(async () => {
  await getCurrentWebviewWindow().show();
  const saved = localStorage.getItem(CACHE_KEY);
  if (saved) {
    comicList.value = JSON.parse(saved);
  }
});
</script>
