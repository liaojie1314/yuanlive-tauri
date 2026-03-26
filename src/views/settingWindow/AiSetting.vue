<template>
  <n-flex vertical :size="40">
    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.ai.mcpPlugins") }}</span>
      <n-flex vertical class="item" :size="12">
        <div v-for="(mcp, index) in mcpList" :key="mcp.id">
          <n-flex align="center" justify="space-between" class="py-4px">
            <div>
              <span class="text-14px font-bold">{{ mcp.name }}</span>
              <div class="text-(12px #909090) mt-4px">{{ mcp.desc }}</div>
            </div>
            <n-flex align="center" :size="16">
              <div
                v-if="mcpConfig[mcp.id]?.enabled"
                class="flex items-center gap-1 text-12px text-[--user-text-color] cursor-pointer hover:text-blue-500 transition-colors select-none"
                @click="toggleMcpExpand(mcp.id)">
                <span>{{ expandedMcp[mcp.id] ? t("setting.ai.collapse") : t("setting.ai.expand") }}</span>
                <i-mdi-chevron-up v-if="expandedMcp[mcp.id]" class="w-4 h-4" />
                <i-mdi-chevron-down v-else class="w-4 h-4" />
              </div>
              <n-switch v-if="mcpConfig[mcp.id]" v-model:value="mcpConfig[mcp.id].enabled" />
            </n-flex>
          </n-flex>
          <n-collapse-transition
            v-if="mcpConfig[mcp.id]"
            :show="mcpConfig[mcp.id].enabled && expandedMcp[mcp.id] === true">
            <div
              class="mt-12px p-12px filter-brightness-95 dark:filter-brightness-110 rounded-8px bg-[var(--bg-setting-item)]">
              <n-checkbox-group v-model:value="mcpConfig[mcp.id].activeTools">
                <n-grid :cols="2" :y-gap="16" :x-gap="16">
                  <n-gi v-for="tool in mcp.tools" :key="tool.name">
                    <n-checkbox style="max-width: 100%" :value="tool.name">
                      <div class="flex flex-col w-full min-w-0">
                        <span class="text-13px">{{ tool.name }}</span>
                        <n-tooltip
                          placement="bottom-start"
                          trigger="hover"
                          :style="{ maxWidth: '300px' }"
                          :disabled="!toolDescTruncationStatus[`${mcp.id}_${tool.name}`]">
                          <template #trigger>
                            <div
                              v-resize="handleResize(`${mcp.id}_${tool.name}`)"
                              class="text-(11px #909090) mt-2px leading-[16px] line-clamp-2 break-all"
                              :class="{ 'cursor-help': toolDescTruncationStatus[`${mcp.id}_${tool.name}`] }">
                              {{ tool.desc }}
                            </div>
                          </template>
                          <span class="text-12px whitespace-pre-wrap leading-relaxed">{{ tool.desc }}</span>
                        </n-tooltip>
                      </div>
                    </n-checkbox>
                  </n-gi>
                </n-grid>
              </n-checkbox-group>
            </div>
          </n-collapse-transition>
          <n-divider v-if="index !== mcpList.length - 1" class="my-16px! bg-[--line-color]" />
        </div>
      </n-flex>
    </n-flex>

    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.ai.fsMcpWhitelist") }}</span>
      <n-flex vertical class="item" :size="12">
        <n-flex align="center" justify="space-between">
          <span class="text-12px color-[#909090]">{{ t("setting.ai.fsMcpWhitelistHint") }}</span>
          <n-button size="small" type="primary" secondary @click="handleAddPath">
            {{ t("setting.ai.addWhitelistDir") }}
          </n-button>
        </n-flex>

        <span class="h-1px w-full bg-[--line-color]"></span>

        <n-empty v-if="allowedWorkspaces.length === 0" class="py-20px" :description="t('setting.ai.noWhitelistDir')" />

        <n-flex v-else vertical class="mt-8px" :size="8">
          <n-flex
            v-for="(path, index) in allowedWorkspaces"
            align="center"
            justify="space-between"
            class="p-10px rounded-6px border-(1px solid transparent) bg-[var(--bg-left-menu)] transition-all hover:border-[var(--border-active-color)]"
            :key="index">
            <span class="text-13px flex-1 font-mono break-all">{{ path }}</span>
            <n-button size="tiny" quaternary type="error" @click="removePath(index)">
              {{ t("setting.ai.deleteWhitelistDir") }}
            </n-button>
          </n-flex>
        </n-flex>
      </n-flex>
    </n-flex>
  </n-flex>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { open } from "@tauri-apps/plugin-dialog";

import { useAiStore } from "@/stores/ai";
import { nativeFsTools } from "@/utils/McpUtils";

const { t } = useI18n();
const aiStore = useAiStore();
const { mcpConfig, allowedWorkspaces } = storeToRefs(aiStore);

const expandedMcp = ref<Record<string, boolean>>({});
const toolDescTruncationStatus = ref<Record<string, boolean>>({});
// 静态配置表：用于渲染界面的文字和结构
const mcpList = computed(() => [
  {
    id: "fs-mcp",
    name: t("setting.ai.fsMcp"),
    desc: t("setting.ai.fsMcpDesc"),
    tools: nativeFsTools.map((tool) => ({ name: tool.name, desc: tool.description }))
  },
  {
    id: "windows-mcp",
    name: t("setting.ai.windowsMcp"),
    desc: t("setting.ai.windowsMcpDesc"),
    tools: aiStore.cachedWindowsTools.map((tool) => ({ name: tool.name, desc: tool.description }))
  }
]);

/**
 * 配合 v-resize 使用的高阶函数
 * @param key 用于唯一标识该元素的键值，用于存储状态
 */
const handleResize = (key: string) => {
  return (_: { width: number; height: number }, el: HTMLElement) => {
    checkTruncation(el, key);
  };
};

/**
 * 检查元素是否被截断
 * @param el 元素引用
 * @param key 用于唯一标识该元素的键值，用于存储状态
 */
const checkTruncation = (el: HTMLElement, key: string) => {
  if (el && el.isConnected) {
    // 核心判断：总高度 > 可见高度 + 1px 容差
    const isTruncated = el.scrollHeight > el.clientHeight + 1;
    // 状态有变化才更新视图，节省性能
    if (toolDescTruncationStatus.value[key] !== isTruncated) {
      toolDescTruncationStatus.value[key] = isTruncated;
    }
  }
};

/** 调起操作系统的文件夹选择器 */
const handleAddPath = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: true,
      title: t("setting.ai.selectWhitelistDir")
    });

    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      paths.forEach((p) => {
        if (!allowedWorkspaces.value.includes(p)) {
          allowedWorkspaces.value.push(p);
        }
      });
    }
  } catch (error) {
    console.error("选择目录失败:", error);
  }
};

/**
 * 切换 MCP 配置项的展开状态
 * @param id MCP 配置项的 ID
 */
const toggleMcpExpand = (id: string) => {
  expandedMcp.value[id] = !expandedMcp.value[id];
};

/**
 * 删除路径
 * @param index 要删除的路径索引
 */
const removePath = (index: number) => {
  allowedWorkspaces.value.splice(index, 1);
};
</script>

<style scoped lang="scss">
.item {
  @apply rounded-12px p-16px border-(solid 1px [--line-color]) custom-shadow box-border size-full bg-[--bg-setting-item];
}

// 覆盖一下 Naive UI 分割线的默认边距
:deep(.n-divider) {
  margin-top: 16px;
  margin-bottom: 16px;
}
</style>
