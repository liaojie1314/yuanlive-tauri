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
        <n-collapse-item name="role" class="!border-[--line-color]">
          <template #header>
            <span class="text-sm font-medium text-[--text-color]">
              {{ t("components.agentSettings.role") }}
            </span>
          </template>
          <template #header-extra>
            <i-mdi-account-tie-outline class="h-4 w-4 text-[--user-text-color] opacity-80" />
          </template>

          <div class="flex flex-col gap-3 px-1 pb-2">
            <n-select
              size="small"
              v-model:value="selectedRole"
              :options="roleOptions"
              :placeholder="t('components.agentSettings.selectRolePlaceholder')"
              @update:value="handleRoleChange" />
            <n-input
              type="textarea"
              class="w-full text-xs"
              v-model:value="systemPrompt"
              :autosize="{ minRows: 3, maxRows: 6 }"
              :placeholder="t('components.agentSettings.customPromptPlaceholder')"
              @keydown.enter.exact.prevent="handlePromptEnter" />
          </div>
        </n-collapse-item>

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
    <n-modal
      preset="card"
      size="small"
      class="w-[300px]"
      v-model:show="showSaveRoleModal"
      :title="t('components.agentSettings.dialog.title')"
      :bordered="false">
      <n-input
        autofocus
        v-model:value="newRoleName"
        :placeholder="t('components.agentSettings.dialog.roleNamePlaceholder')"
        @keydown.enter.prevent="confirmSaveRole" />
      <template #footer>
        <div class="flex justify-end gap-2 mt-2">
          <n-button size="small" @click="showSaveRoleModal = false">
            {{ t("components.agentSettings.dialog.cancel") }}
          </n-button>
          <n-button size="small" type="primary" :disabled="!newRoleName.trim()" @click="confirmSaveRole">
            {{ t("components.agentSettings.dialog.save") }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import IconWindows from "~icons/mdi/microsoft-windows";
import IconFolderSync from "~icons/mdi/folder-sync-outline";

import { useAiStore } from "@/stores/ai";
import { isWindows } from "@/utils/PlatformUtils";

const { t } = useI18n();
const aiStore = useAiStore();

// 角色设定逻辑
const selectedRole = ref("");
const showSaveRoleModal = ref(false);
const newRoleName = ref("");
const roleOptions = ref([
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
]);
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
const systemPrompt = computed({
  get: () => aiStore.systemPrompt,
  set: (value) => (aiStore.systemPrompt = value)
});

/** 监听文本框的回车事件 */
const handlePromptEnter = () => {
  const currentText = systemPrompt.value.trim();
  if (!currentText) return; // 如果没有内容则不作处理
  if (selectedRole.value === "custom" || !selectedRole.value) {
    // 1. 如果当前选中的是“自定义”（或者没选），触发【新建并保存】逻辑
    newRoleName.value = ""; // 清空上次的输入
    showSaveRoleModal.value = true;
  } else {
    // 2. 如果当前选中的是已有角色，触发【修改并覆盖】逻辑
    const targetRole = roleOptions.value.find((r) => r.value === selectedRole.value);
    if (targetRole) {
      targetRole.prompt = currentText; // 更新该角色的预设 prompt
      window.$message?.success(t("components.agentSettings.msg.updateSuccess", { label: targetRole.label }));
    }
  }
};

/** 确认保存角色并添加到下拉列表 */
const confirmSaveRole = () => {
  const name = newRoleName.value.trim();
  if (!name) return;

  const newValue = `custom_${Date.now()}`;
  const newRole = {
    label: name,
    value: newValue,
    prompt: systemPrompt.value
  };

  // 将新角色插入到数组的倒数第一个位置（也就是插在"自定义"选项的前面），保持"自定义"永远在最底部
  roleOptions.value.splice(roleOptions.value.length - 1, 0, newRole);

  // 自动将下拉框切换到刚创建的角色
  selectedRole.value = newValue;
  showSaveRoleModal.value = false;
  newRoleName.value = ""; // 清空上次的输入
  window.$message?.success(t("components.agentSettings.msg.saveSuccess"));
};

/**
 * 处理角色选择变化
 * @param value 选中的角色值
 */
const handleRoleChange = (value: string) => {
  const role = roleOptions.value.find((r) => r.value === value);
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
