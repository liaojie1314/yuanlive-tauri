<template>
  <div class="flex w-full flex-col gap-3">
    <div class="flex-between-center px-1 select-none">
      <div class="flex-y-center gap-2">
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-500">
          <i-mdi-robot-outline class="h-4 w-4" />
        </div>
        <span class="text-sm font-bold text-[--text-color]">{{ t("components.agentSettings.title") }}</span>
      </div>
    </div>

    <div class="overflow-hidden rounded-xl border border-[--line-color] bg-[--input-area-bg]">
      <n-collapse accordion class="setting-collapse" :default-expanded-names="['mcp']">
        <div class="flex flex-col gap-3 px-3 pb-3 w-full box-border">
          <div class="flex items-center justify-between gap-2">
            <n-select
              size="small"
              class="flex-1 w-0"
              v-model:value="selectedRole"
              :placeholder="t('components.agentSettings.selectRolePlaceholder')"
              :options="agentOptions"
              @update:value="handleRoleChange" />
            <n-button size="small" quaternary type="primary" class="flex-shrink-0 !px-1.5" @click="goToSettings">
              <template #icon><i-mdi-cog-outline class="text-base" /></template>
            </n-button>
          </div>

          <div class="w-90% rounded-md bg-[--tray-hover] p-3">
            <n-scrollbar v-if="systemPrompt" style="max-height: 150px">
              <div class="text-xs text-[--text-color] opacity-80 leading-relaxed whitespace-pre-wrap">
                {{ systemPrompt }}
              </div>
            </n-scrollbar>
            <div v-else class="text-xs text-[--user-text-color] opacity-50 italic text-center py-2">
              {{ t("components.agentSettings.emptyRole") }}
            </div>
          </div>
        </div>

        <n-collapse-item name="mcp">
          <template #header>
            <span class="text-sm font-medium text-[--text-color]">
              {{ t("components.agentSettings.mcp.title") }}
            </span>
          </template>
          <template #header-extra>
            <i-mdi-power-plug-outline class="h-4 w-4 text-[--user-text-color] opacity-80" />
          </template>

          <div class="flex flex-col gap-2 px-1 pb-1">
            <div
              v-for="mcp in mcpList"
              class="flex-between-center rounded-lg border border-[--line-color] bg-[--tray-bg-color] p-2 transition-colors hover:border-blue-500/30"
              :key="mcp.id">
              <div class="flex-y-center gap-2">
                <div
                  class="flex h-6 w-6 items-center justify-center rounded bg-[--input-area-bg] text-[--user-text-color]">
                  <component class="h-4 w-4" :is="mcp.icon" />
                </div>
                <div class="flex flex-col px-1">
                  <span class="text-xs font-medium text-[--text-color]">{{ mcp.name }}</span>
                  <span class="text-[10px] text-[--user-text-color] opacity-80">{{ mcp.desc }}</span>
                </div>
              </div>
              <n-switch size="small" v-model:value="mcp.enabled" />
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconWindows from "~icons/mdi/microsoft-windows";
import IconFolderSync from "~icons/mdi/folder-sync-outline";
import { useI18n } from "vue-i18n";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { StorageKeyEnum } from "@/enums";
import { useAiStore } from "@/stores/ai";
import { useWindow } from "@/hooks/useWindow";
import { isWindows } from "@/utils/PlatformUtils";

const { t } = useI18n();
const aiStore = useAiStore();
const { createWebviewWindow } = useWindow();

// 角色设定逻辑
const selectedRole = ref("");
const systemPrompt = computed(() => aiStore.systemPrompt);
// MCP 插件逻辑
const mcpList = ref([
  {
    id: "windows-mcp",
    name: "Windows MCP",
    desc: t("components.agentSettings.mcp.windows"),
    icon: markRaw(IconWindows),
    enabled: computed({
      get: () => (isWindows() && aiStore.mcpConfig["windows-mcp"]?.enabled) ?? false,
      set: (value: boolean) => {
        if (!isWindows()) return;
        // 如果配置已经存在，直接更新开启/关闭状态
        if (aiStore.mcpConfig["windows-mcp"]) {
          aiStore.mcpConfig["windows-mcp"].enabled = value;
        } else {
          // 兜底逻辑：如果 store 里一开始没写这个 key 的默认值，给它初始化一下
          aiStore.mcpConfig["windows-mcp"] = {
            enabled: value,
            activeTools: []
          };
        }
      }
    })
  },
  {
    id: "fs-mcp",
    name: "File System MCP",
    desc: t("components.agentSettings.mcp.fs"),
    icon: markRaw(IconFolderSync),
    enabled: computed({
      get: () => aiStore.mcpConfig["fs-mcp"]?.enabled ?? false,
      set: (value: boolean) => {
        if (aiStore.mcpConfig["fs-mcp"]) {
          aiStore.mcpConfig["fs-mcp"].enabled = value;
        } else {
          aiStore.mcpConfig["fs-mcp"] = {
            enabled: value,
            activeTools: []
          };
        }
      }
    })
  }
]);
const agentOptions = computed(() => {
  return aiStore.agentList.map((agent) => ({
    label: agent.name,
    value: agent.id,
    prompt: agent.prompt
  }));
});

/**
 * 处理角色选择变化
 * @param value 选中的角色值
 */
const handleRoleChange = (value: string) => {
  const agent = aiStore.agentList.find((a) => a.id === value);
  if (agent) {
    aiStore.systemPrompt = agent.prompt;
  } else {
    aiStore.systemPrompt = "";
  }
};

/** 跳转到设置页面 */
const goToSettings = async () => {
  const settingWin = await WebviewWindow.getByLabel("setting");

  if (settingWin) {
    await settingWin.show();
    await settingWin.setFocus();
    await settingWin.emit("change-setting-route", "/aiSetting");
  } else {
    localStorage.setItem(StorageKeyEnum.TARGET_SETTING_ROUTE, "/aiSetting");
    await createWebviewWindow("设置", "setting", 840, 840, "", true, 840, 600);
  }
};

watch(
  () => aiStore.systemPrompt,
  (newVal) => {
    const match = aiStore.agentList.find((a) => a.prompt === newVal);
    selectedRole.value = match ? match.id : "";
  }
);

onMounted(() => {
  const match = aiStore.agentList.find((a) => a.prompt === aiStore.systemPrompt);
  if (match) {
    selectedRole.value = match.id;
  }
});
</script>

<style scoped>
.setting-collapse :deep(.n-collapse-item) {
  margin: 0 !important;
}
.setting-collapse :deep(.n-collapse-item__header) {
  padding: 12px 16px !important;
  background-color: transparent;
}
.setting-collapse :deep(.n-collapse-item__content-inner) {
  padding: 0 4px 4px 4px !important;
}
</style>
