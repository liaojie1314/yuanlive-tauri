<template>
  <div class="size-full bg-[--bg-popover] select-none cursor-default">
    <!--顶部操作栏-->
    <action-bar :is-drag="false" :max-w="false" :min-w="false" />

    <n-flex v-if="loading" vertical justify="center" class="mt-6px box-border px-12px">
      <n-skeleton text :repeat="1" class="rounded-8px h-30px w-120px" />
      <n-skeleton text :repeat="1" class="rounded-8px h-300px" />
      <n-skeleton text :repeat="1" class="rounded-8px w-80px h-30px m-[0_0_0_auto]" />
    </n-flex>
    <n-flex v-else vertical justify="center" class="p-14px box-border select-none">
      <n-flex justify="space-between" align="center">
        <n-flex align="center">
          <n-flex align="center">
            <p class="text-[--text-color]">{{ t("update.checkUpdate.currentVersion") }}:</p>
            <p class="text-(20px #909090) font-500">{{ currentVersion }}</p>
          </n-flex>

          <n-flex v-if="newVersion" align="center" class="relative">
            <i-material-symbols-keyboard-arrow-right class="w-24px h-24px select-none color-#ccc" />

            <p class="relative text-(20px #13987f) font-500">{{ newVersion }}</p>

            <span class="absolute top--10px right--44px p-[4px_8px] bg-#f6dfe3ff rounded-6px text-(12px #ce304f)">
              {{ t("update.checkUpdate.newTag") }}
            </span>
          </n-flex>
        </n-flex>
        <n-flex align="center" size="medium">
          <div v-if="newVersionTime">
            <span class="text-(12px #909090)">{{ t("update.checkUpdate.newReleaseDate") }}</span>
            <span class="text-(12px #13987f)">{{ handRelativeTime(newVersionTime) }}</span>
          </div>

          <div v-else>
            <span class="text-(12px #909090)">{{ t("update.checkUpdate.releaseDate") }}</span>
            <span class="text-(12px #13987f)">{{ handRelativeTime(versionTime) }}</span>
          </div>
        </n-flex>
      </n-flex>
      <n-flex justify="space-between" align="center" class="mb-2px">
        <p class="text-(14px #909090)">{{ t("update.checkUpdate.logTitle") }}</p>
        <n-button text @click="toggleLogVisible">
          <n-flex align="center">
            <span class="text-(12px #13987f)">
              {{ logVisible ? t("update.checkUpdate.collapse") : t("update.checkUpdate.expand") }}
            </span>
            <i-material-symbols-keyboard-arrow-down
              class="w-16px h-16px select-none color-#13987f ml-2px transition-transform duration-300"
              :class="{ 'rotate-180': !logVisible }"></i-material-symbols-keyboard-arrow-down>
          </n-flex>
        </n-button>
      </n-flex>
      <div
        v-show="logVisible"
        class="overflow-hidden transition-all duration-300"
        :class="logVisible ? 'h-460px' : 'h-0'">
        <n-scrollbar class="p-[0_10px] box-border">
          <div v-if="newCommitLog.length > 0">
            <div class="p-[4px_8px] mt-4px w-fit bg-#f6dfe3ff rounded-6px text-(12px #ce304f)">
              {{ newVersion }}
            </div>

            <n-timeline class="p-16px box-border">
              <n-timeline-item v-for="(log, index) in newCommitLog" :key="index" :content="log.message">
                <template #icon>
                  <n-icon :size="32">
                    <img class="size-32px" :src="`/emoji/${log.icon}.webp`" alt="" />
                  </n-icon>
                </template>
              </n-timeline-item>
            </n-timeline>

            <n-flex>
              <n-flex vertical :size="20">
                <i-material-symbols-keyboard-arrow-right
                  class="m-[4px_40px] w-24px h-24px select-none rotate-270 color-#ccc" />

                <span class="p-[4px_8px] w-fit bg-#f1f1f1 rounded-6px text-(12px #999)">{{ currentVersion }}</span>
              </n-flex>
            </n-flex>
          </div>

          <n-timeline class="p-16px box-border">
            <n-timeline-item v-for="(log, index) in commitLog" :key="index" :content="log.message">
              <template #icon>
                <n-icon :size="32">
                  <img class="size-32px" :src="`/emoji/${log.icon}.webp`" alt="" />
                </n-icon>
              </template>
            </n-timeline-item>
          </n-timeline>
        </n-scrollbar>
      </div>
      <n-flex justify="end" class="mt-10px">
        <n-button :onclick="dismissUpdate" secondary>{{ t("update.checkUpdate.ignore") }}</n-button>
        <n-button :onclick="doUpdate" secondary type="primary">{{ t("update.checkUpdate.updateNow") }}</n-button>
      </n-flex>
    </n-flex>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { confirm } from "@tauri-apps/plugin-dialog";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentMonitor, PhysicalPosition } from "@tauri-apps/api/window";

import { useWindow } from "@/hooks/useWindow.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { handRelativeTime } from "@/utils/TimeUtils";

const settingStore = useSettingStore();
const { t } = useI18n();
const { createWebviewWindow, resizeWindow, setResizable } = useWindow();

const PLATFORM: "github" | "gitee" = "github";
const REPO_OWNER = "liaojie1314";
const REPO_NAME = "yuanlive-tauri";
const commitTypeMap: { [key: string]: string } = {
  feat: "comet",
  fix: "bug",
  docs: "memo",
  style: "lipstick",
  refactor: "recycling-symbol",
  perf: "rocket",
  test: "test-tube",
  build: "package",
  ci: "gear",
  revert: "right-arrow-curving-left",
  chore: "hammer-and-wrench"
};

const commitLog = ref<{ message: string; icon: string }[]>([]);
const newCommitLog = ref<{ message: string; icon: string }[]>([]);
const text = ref(t("update.checkUpdate.updateNow"));
const currentVersion = ref("");
const newVersion = ref("");
const loading = ref(false);
const logVisible = ref(false);
const versionTime = ref("");
const newVersionTime = ref("");

/**
 * 根据 commit message 获取图标类型
 * @param commitMessage 原始 commit message
 * @returns 图标类型
 */
const mapCommitType = (commitMessage: string) => {
  for (const type in commitTypeMap) {
    if (new RegExp(`^${type}`, "i").test(commitMessage)) {
      return commitTypeMap[type];
    }
  }
  return null;
};

/**
 * 核心解析逻辑：清洗 Gitee/GitHub 的日志差异
 * @param body 原始发布体内容
 * @returns 清洗后的日志数组
 */
const parseReleaseBody = (body: string) => {
  if (!body) return [];
  const logs: { message: string; icon: string }[] = [];
  // 匹配所有以 * 开头的行
  const regex = /^\s*\*\s+(.*)$/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    let rawLine = match[1];
    // 1. 尝试从原始字符串获取类型用于显示图标
    let icon = mapCommitType(rawLine) || "alien-monster";
    // 2. [GitHub特有] 清洗 Markdown 链接 ([hash](url)) 和 closes 信息
    // 例如: ([0698866](...)) 或 , closes [#386](...)
    rawLine = rawLine.replace(/\s*\(\[.*?\]\(.*?\)\)(, closes \[.*?\]\(.*?\))?/g, "");
    // 3. [GitHub特有] 清洗自动生成的粗体 Scope (**scope:**)
    rawLine = rawLine.replace(/\*\*(.*?)\*\*:\s*/g, "");
    // 4. 清洗标准 Commit 前缀 (feat(scope): 或 feat:) 以避免重复显示
    const typeMatch = rawLine.match(/^([a-z]+)(\(.*\))?:\s*/i);
    if (typeMatch) {
      if (icon === "alien-monster") {
        icon = mapCommitType(typeMatch[1]) || "alien-monster";
      }
      // 移除前缀，让显示更简洁
      rawLine = rawLine.replace(/^([a-z]+)(\(.*\))?:\s*/i, "");
    }
    // 5. 清洗 Emoji 代码 (如 :sparkles:)
    rawLine = rawLine.replace(/^:\w+:\s*/, "");
    // 6. 清洗残留的 Markdown 链接 [text](url) -> text
    rawLine = rawLine.replace(/\[(.*?)\]\(.*?\)/g, "$1");
    const finalMessage = rawLine.trim();
    if (finalMessage) {
      logs.push({ message: finalMessage, icon });
    }
  }
  return logs;
};

/**
 * 获取更新日志 (兼容 GitHub 和 Gitee)
 * @param version 版本号 (不带v)
 * @param isNew 是否是新版本
 */
const getCommitLog = async (version: string, isNew = false) => {
  const safeVersion = version.replace(/^v/, "");
  let url = "";
  const headers: HeadersInit = {};

  if (PLATFORM === "github") {
    // GitHub 配置
    url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/v${safeVersion}`;
    headers["Accept"] = "application/vnd.github+json";
    headers["X-GitHub-Api-Version"] = "2022-11-28";
    // 如果配置了 Token (私有仓库必选，公开仓库可选防限流)
    if (import.meta.env.VITE_GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`;
    }
  } else {
    // Gitee 配置
    const baseUrl = `https://gitee.com/api/v5/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/v${safeVersion}`;
    // Gitee Token 必须在 URL 里
    const urlObj = new URL(baseUrl);
    if (import.meta.env.VITE_GITEE_TOKEN) {
      urlObj.searchParams.append("access_token", import.meta.env.VITE_GITEE_TOKEN);
    }
    url = urlObj.toString();
  }

  try {
    const res = await fetch(url, { method: "GET", headers });

    if (!res.ok) {
      const errorMsg = t("update.checkUpdate.fetchLogFailed");
      const errorLog = [{ message: errorMsg, icon: "cloudError" }];
      isNew ? (newCommitLog.value = errorLog) : (commitLog.value = errorLog);
      loading.value = false;
      return;
    }

    const data = await res.json();
    isNew ? (newVersionTime.value = data.created_at) : (versionTime.value = data.created_at);

    await nextTick(() => {
      // 使用通用解析器
      const processedLogs = parseReleaseBody(data.body || "");
      isNew ? (newCommitLog.value = processedLogs) : (commitLog.value = processedLogs);
      loading.value = false;
    });
  } catch (error) {
    console.error("Fetch log error:", error);
    loading.value = false;
    commitLog.value = [{ message: "Network Error", icon: "cloudError" }];
  }
};

/** 执行更新 */
const doUpdate = async () => {
  if (!(await confirm(t("update.checkUpdate.confirmUpdate")))) {
    return;
  }
  await createWebviewWindow("更新", "update", 490, 335, "", false, 490, 335, 490, 335, false, true);
  const windows = await WebviewWindow.getAll();
  windows.forEach((window) => {
    if (window.label === "login" || window.label === "home" || window.label === "checkUpdate") {
      window.close();
    }
  });
};

/** 忽略更新 */
const dismissUpdate = async () => {
  if (!(await confirm(t("update.checkUpdate.confirmIgnore")))) {
    return;
  }
  settingStore.update.dismiss = newVersion.value;
  const checkUpdateWindow = await WebviewWindow.getByLabel("checkUpdate");
  checkUpdateWindow?.close();
};

/** 检查更新 */
const checkUpdate = async () => {
  await check()
    .then(async (e) => {
      if (!e?.available) {
        return;
      }
      newVersion.value = e.version;
      await getCommitLog(newVersion.value, true);
      text.value = t("update.checkUpdate.updateNow");
    })
    .catch(() => {
      window.$message.error(t("update.checkUpdate.updateError"));
    });
};

/** 移动窗口到底部右侧 */
const moveWindowToBottomRight = async () => {
  try {
    const checkUpdateWindow = await WebviewWindow.getByLabel("checkUpdate");
    if (!checkUpdateWindow) return;

    const monitor = await currentMonitor();
    if (!monitor) return;

    const size = await checkUpdateWindow.outerSize();
    const x = Math.floor(monitor.size.width - size.width);
    const y = Math.floor(monitor.size.height - size.height - 50);
    await checkUpdateWindow.setPosition(new PhysicalPosition(x, y));
  } catch (error) {
    console.error("移动窗口失败:", error);
  }
};

/** 切换日志可见性 */
const toggleLogVisible = async () => {
  logVisible.value = !logVisible.value;

  const checkUpdateWindow = await WebviewWindow.getByLabel("checkUpdate");
  if (!checkUpdateWindow) return;

  await setResizable("checkUpdate", true);

  if (logVisible.value) {
    await resizeWindow("checkUpdate", 500, 620);
  } else {
    await resizeWindow("checkUpdate", 500, 150);
  }
  await setResizable("checkUpdate", false);
  await moveWindowToBottomRight();
};

/** 初始化检查更新窗口 */
const init = async () => {
  await moveWindowToBottomRight();
  loading.value = true;
  currentVersion.value = await getVersion();
};

onMounted(async () => {
  await init();

  if (import.meta.env.DEV) {
    loading.value = false;
    return;
  }
  await getCommitLog(currentVersion.value, false);
  await checkUpdate();
});
</script>
