<template>
  <n-flex data-tauri-drag-region vertical class="login-box size-full !gap-0 select-none">
    <div data-tauri-drag-region>
      <n-progress
        data-tauri-drag-region
        size="12"
        :border-radius="0"
        :color="changeColor('#13987f', { alpha: 0.6 })"
        :rail-color="changeColor('#13987f', { alpha: 0.2 })"
        :percentage="percentage"
        :show-indicator="false" />

      <n-carousel
        autoplay
        direction="vertical"
        class="line-height-30px h-[30px] w-[90%] cursor-default overflow-hidden px-2 text-sm"
        :interval="3000"
        :show-dots="false">
        <n-carouselItem
          data-tauri-drag-region
          v-for="(text, i) in list"
          class="text-(12px ellipsis) color-#909090 box-border max-w-full align-middle whitespace-nowrap"
          :key="i"
          :title="text">
          {{ text }}
        </n-carouselItem>
      </n-carousel>

      <p data-tauri-drag-region class="color-#13987f mt-4 cursor-default text-center text-sm">
        {{ t("update.updating") }} {{ percentage }}%
      </p>
    </div>
  </n-flex>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { changeColor } from "seemly";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const { t } = useI18n();

// 'github' | 'gitee'
const PLATFORM: "github" | "gitee" = "github";
const REPO_OWNER = "liaojie1314";
const REPO_NAME = "yuanlive-tauri";

const list = ref<string[]>([]);
const updating = ref(false);
const percentage = ref(0);
const total = ref(0);
const downloaded = ref(0);

/**
 * 智能解析 Release Body
 * @param body 原始 Markdown 文本
 * @returns 解析后的日志数组
 */
const parseReleaseBody = (body: string): string[] => {
  if (!body) return [];
  const logs: string[] = [];
  const regex = /^\s*\*\s+(.*)$/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    let rawLine = match[1];
    rawLine = rawLine.replace(/\s*\(\[.*?\]\(.*?\)\)(, closes \[.*?\]\(.*?\))?/g, "");
    rawLine = rawLine.replace(/\*\*(.*?)\*\*:\s*/g, "");
    rawLine = rawLine.replace(/^([a-z]+)(\(.*\))?:\s*/i, "");
    rawLine = rawLine.replace(/^:\w+:\s*/, "");
    rawLine = rawLine.replace(/\[(.*?)\]\(.*?\)/g, "$1");
    const finalMessage = rawLine.trim();
    if (finalMessage) {
      logs.push(finalMessage);
    }
  }
  return logs;
};

/**
 * 获取 Release 数据
 * @param version 版本号 (如 "1.0.0")
 * @returns Release 数据
 */
const fetchReleaseData = async (version: string) => {
  const safeVersion = version.replace(/^v/, "");
  let url = "";
  const headers: HeadersInit = {};
  if (PLATFORM === "github") {
    url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/v${safeVersion}`;
    headers["Accept"] = "application/vnd.github+json";
    headers["X-GitHub-Api-Version"] = "2022-11-28";
    if (import.meta.env.VITE_GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`;
    }
  } else {
    const baseUrl = `https://gitee.com/api/v5/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/v${safeVersion}`;
    const urlObj = new URL(baseUrl);
    if (import.meta.env.VITE_GITEE_TOKEN) {
      urlObj.searchParams.append("access_token", import.meta.env.VITE_GITEE_TOKEN);
    }
    url = urlObj.toString();
  }
  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return await response.json();
};

/**
 * 设置提交日志列表
 * @param version 版本号 (如 "1.0.0")
 */
const setupCommitList = async (version: string) => {
  try {
    const releaseData = await fetchReleaseData(version);
    // 使用新的解析器清洗数据
    list.value = parseReleaseBody(releaseData.body || "");
    // 如果解析为空，显示默认信息
    if (list.value.length === 0) {
      list.value = [t("update.noDescription")];
    }
  } catch (err) {
    console.error(`${t("update.fetchCommitFailed", { version })}:`, err);
    list.value =
      err instanceof Error
        ? [t("update.fetchReleaseErrorWithReason", { reason: err.message })]
        : [t("update.fetchReleaseError")];
  }
};

/** 执行更新操作 */
const doUpdate = async () => {
  updating.value = true;
  try {
    const e = await check({
      headers: {
        "X-AccessKey": "igci4UjiRztozSmQ7fdhMQ"
      }
    });
    if (!e?.available) return;
    // 先获取日志显示在轮播图中
    await setupCommitList(e.version);
    // 开始下载和安装
    await e.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          total.value = event.data.contentLength || 0;
          break;
        case "Progress":
          downloaded.value += event.data.chunkLength;
          if (total.value > 0) {
            // 保留1位小数
            percentage.value = Number(((downloaded.value / total.value) * 100).toFixed(1));
          }
          break;
        case "Finished":
          percentage.value = 100;
          break;
      }
    });

    // 重启应用
    await relaunch();
  } catch (error) {
    console.error("Update failed:", error);
    window.$message.error(t("update.updateError"));
  } finally {
    updating.value = false;
  }
};

onMounted(async () => {
  await doUpdate();
});
</script>

<style scoped lang="scss">
@use "@/styles/global/login-bg";
</style>
