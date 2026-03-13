<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex items-center justify-between px-1 select-none">
      <div class="flex items-center gap-2">
        <div
          class="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
          <i-mdi-robot-outline class="w-4 h-4" />
        </div>
        <span class="text-sm font-bold text-[--text-color]">{{ t("components.agentSettings.title") }}</span>
      </div>
    </div>

    <div class="border border-[--line-color] rounded-xl bg-[--input-area-bg] overflow-hidden">
      <n-collapse accordion :default-expanded-names="['mcp']" class="setting-collapse">
        <n-collapse-item name="role" class="!border-[--line-color]">
          <template #header>
            <span class="text-sm font-medium text-[--text-color]">
              {{ t("components.agentSettings.role") }} (Prompt)
            </span>
          </template>
          <template #header-extra>
            <i-mdi-account-tie-outline class="w-4 h-4 text-[--user-text-color] opacity-80" />
          </template>

          <div class="flex flex-col gap-3 px-1 pb-2">
            <n-select
              v-model:value="selectedRole"
              :options="roleOptions"
              size="small"
              :placeholder="t('components.agentSettings.selectRolePlaceholder')"
              @update:value="handleRoleChange" />
            <n-input
              v-model:value="systemPrompt"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              :placeholder="t('components.agentSettings.customPromptPlaceholder')"
              class="w-full text-xs" />
          </div>
        </n-collapse-item>

        <n-collapse-item name="mcp">
          <template #header>
            <span class="text-sm font-medium text-[--text-color]">
              {{ t("components.agentSettings.mcp.title") }}
            </span>
          </template>
          <template #header-extra>
            <i-mdi-power-plug-outline class="w-4 h-4 text-[--user-text-color] opacity-80" />
          </template>

          <div class="flex flex-col gap-2 px-1 pb-1">
            <div
              v-for="mcp in mcpList"
              :key="mcp.id"
              class="flex items-center justify-between p-2 rounded-lg border border-[--line-color] bg-[--tray-bg-color] hover:border-blue-500/30 transition-colors">
              <div class="flex items-center gap-2">
                <div
                  class="w-6 h-6 flex items-center justify-center rounded bg-[--input-area-bg] text-[--user-text-color]">
                  <component :is="mcp.icon" class="w-4 h-4" />
                </div>
                <div class="flex flex-col px-1">
                  <span class="text-xs text-[--text-color] font-medium">{{ mcp.name }}</span>
                  <span class="text-[10px] text-[--user-text-color] opacity-80">{{ mcp.desc }}</span>
                </div>
              </div>
              <n-switch v-model:value="mcp.enabled" size="small" />
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import IconWindows from "~icons/mdi/microsoft-windows";
import IconFolderSync from "~icons/mdi/folder-sync-outline";

import { useAiStore } from "@/stores/ai";

const { t } = useI18n();
const aiStore = useAiStore();

const roleOptions = [
  {
    label: "前端架构师",
    value: "frontend_architect",
    prompt: "你是一个资深的前端架构师，精通 Vue 3、Tauri 2 和现代工程化。请在回答时注重代码规范、性能优化以及可维护性。"
  },
  {
    label: "Java 后端专家",
    value: "java_backend",
    prompt:
      "你是一个拥有 10 年经验的 Java 后端专家，精通 Spring Cloud 和高并发架构。请尽量提供健壮、安全的工程化解决方案。"
  },
  {
    label: "代码审查员 (Reviewer)",
    value: "code_reviewer",
    prompt: "你是一个严格的代码审查员。请找出我代码中的潜在 Bug、性能问题，并给出重构建议。"
  },
  { label: "自定义", value: "custom", prompt: "" }
];
// 角色设定逻辑
const selectedRole = ref("");
const systemPrompt = computed({
  get: () => aiStore.systemPrompt,
  set: (value) => (aiStore.systemPrompt = value)
});
// MCP 插件逻辑
const mcpList = ref([
  {
    id: "windows-mcp",
    name: "Windows MCP",
    desc: t("components.agentSettings.mcp.windows"),
    icon: markRaw(IconWindows),
    enabled: computed({
      get: () => {
        return aiStore.mcpConfig["windows-mcp"]?.enabled ?? false;
      },
      set: (value: boolean) => {
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
        if (value) {
          if (!aiStore.mcpConfig["fs-mcp"]) {
            aiStore.mcpConfig["fs-mcp"] = {
              enabled: value,
              activeTools: []
            };
          }
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

/**
 * 处理角色选择变化
 * @param value 选中的角色值
 */
const handleRoleChange = (value: string) => {
  const role = roleOptions.find((r) => r.value === value);
  if (role) {
    systemPrompt.value = role.prompt;
  }
};
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
