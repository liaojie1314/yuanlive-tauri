<template>
  <n-flex vertical :size="40">
    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <n-flex align="center" justify="space-between" class="pl-10px pr-10px">
        <span>{{ t("setting.ai.modelManagement") }}</span>
        <n-button size="small" type="primary" secondary @click="showAddModelModal = true">
          <template #icon>
            <i-mdi-plus />
          </template>
          {{ t("setting.ai.addModel") }}
        </n-button>
      </n-flex>

      <div class="item !p-0 overflow-hidden">
        <n-empty v-if="modelManageList.length === 0" class="py-40px" :description="t('setting.ai.noModelData')" />
        <n-scrollbar v-else style="max-height: 320px">
          <n-flex vertical class="p-16px" :size="16">
            <div
              v-for="model in modelManageList"
              class="rounded-8px border border-[--line-color] bg-[var(--bg-setting-item)] p-16px transition-all hover:border-blue-500/50"
              :key="model.id">
              <n-flex align="center" class="mb-6px" :size="8">
                <span class="text-15px font-bold text-[--text-color]">{{ model.displayName }}</span>
                <n-tag size="small" type="success" class="!text-11px !h-20px" :bordered="false">
                  {{ t("setting.ai.available") }}
                </n-tag>
                <n-tag size="small" type="info" class="!text-11px !h-20px" :bordered="false">
                  {{ model.isPublic ? t("setting.ai.public") : t("setting.ai.private") }}
                </n-tag>
                <n-tag size="small" type="default" class="!text-11px !h-20px" :bordered="false">{{ model.type }}</n-tag>
              </n-flex>

              <div class="mb-12px text-(12px #909090)">
                {{ t("setting.ai.platform") }}:
                <span class="mr-4">{{ model.platform }}</span>
                {{ t("setting.ai.model") }}:
                <span>{{ model.modelName }}</span>
              </div>

              <div class="rounded-6px border border-[--line-color] overflow-hidden bg-[var(--bg-left-menu)]">
                <div class="flex bg-[--tray-hover] p-8px text-(12px #909090) border-b border-[--line-color]">
                  <div class="flex-1 px-8px border-r border-[--line-color]">{{ t("setting.ai.temperature") }}</div>
                  <div class="flex-1 px-8px border-r border-[--line-color]">{{ t("setting.ai.maxTokens") }}</div>
                  <div class="flex-1 px-8px">{{ t("setting.ai.maxContext") }}</div>
                </div>
                <div class="flex p-8px text-13px text-[--text-color]">
                  <div class="flex-1 px-8px border-r border-[--line-color]">{{ model.temperature }}</div>
                  <div class="flex-1 px-8px border-r border-[--line-color]">{{ model.maxToken }}</div>
                  <div class="flex-1 px-8px">{{ model.maxContext }}</div>
                </div>
              </div>
            </div>
          </n-flex>
        </n-scrollbar>
      </div>
    </n-flex>
    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <n-flex align="center" justify="space-between" class="pl-10px pr-10px">
        <span>{{ t("setting.ai.agentManagement") }}</span>
        <n-button size="small" type="primary" secondary @click="openAddAgentModal">
          <template #icon>
            <i-mdi-plus />
          </template>
          {{ t("setting.ai.addAgent") }}
        </n-button>
      </n-flex>

      <div class="item !p-0 overflow-hidden">
        <n-empty v-if="aiStore.agentList.length === 0" class="py-40px" :description="t('setting.ai.noAgentData')" />
        <n-scrollbar v-else style="max-height: 280px">
          <n-flex vertical class="p-16px" :size="16">
            <div
              v-for="agent in aiStore.agentList"
              class="rounded-8px border border-[--line-color] bg-[var(--bg-setting-item)] p-16px transition-all hover:border-blue-500/50"
              :key="agent.id">
              <div class="flex justify-between items-start mb-12px">
                <n-flex align="center" :size="12">
                  <n-avatar round fallback-src="https://picsum.photos/id/1010/100/100" :size="44" :src="agent.avatar" />
                  <div class="flex flex-col justify-center">
                    <n-flex align="center" class="mb-4px" :size="8">
                      <span class="text-16px font-bold text-[--text-color]">{{ agent.name }}</span>
                      <n-tag size="small" type="success" class="!text-11px !h-20px" :bordered="false">
                        {{ statusOptions.find((item) => item.value === agent.status)?.label || agent.status }}
                      </n-tag>
                      <n-tag size="small" type="info" class="!text-11px !h-20px" :bordered="false">
                        {{ agent.isPublic ? t("setting.ai.public") : t("setting.ai.private") }}
                      </n-tag>
                    </n-flex>
                    <div class="text-(12px #909090)">
                      {{ t("setting.ai.category") }}:
                      <span class="mr-4">{{ agent.category }}</span>
                      {{ t("setting.ai.sort") }}:
                      <span>{{ agent.sort }}</span>
                    </div>
                  </div>
                </n-flex>

                <n-flex :size="8">
                  <n-button size="small" secondary @click="openEditAgentModal(agent)">
                    <template #icon><i-mdi-pencil /></template>
                    {{ t("setting.ai.edit") }}
                  </n-button>
                  <n-popconfirm
                    placement="bottom-end"
                    :positive-text="t('components.common.confirm')"
                    :negative-text="t('components.common.cancel')"
                    @positive-click="handleDeleteAgent(agent.id)">
                    <template #trigger>
                      <n-button size="small" type="error" secondary>
                        <template #icon><i-mdi-delete /></template>
                      </n-button>
                    </template>
                    {{ t("setting.ai.deleteAgentConfirm") }}
                  </n-popconfirm>
                </n-flex>
              </div>

              <div class="rounded-6px border border-[--line-color] overflow-hidden bg-[var(--bg-left-menu)]">
                <div class="bg-[--tray-hover] p-8px text-(12px #909090) border-b border-[--line-color]">
                  {{ t("setting.ai.agentDesc") }}
                </div>
                <div class="p-12px text-13px text-[--text-color] border-b border-[--line-color]">
                  {{ agent.description }}
                </div>

                <div class="bg-[--tray-hover] p-8px text-(12px #909090) border-b border-[--line-color]">
                  {{ t("setting.ai.agentSetting") }} (System Prompt)
                </div>
                <div class="p-12px">
                  <div
                    class="text-13px text-[--text-color] leading-relaxed line-clamp-2 overflow-hidden break-all"
                    :title="agent.prompt">
                    {{ agent.prompt }}
                  </div>
                </div>
              </div>
            </div>
          </n-flex>
        </n-scrollbar>
      </div>
    </n-flex>
    <n-flex vertical class="text-(14px [--text-color])" :size="16">
      <span class="pl-10px">{{ t("setting.ai.dialogueAdvancedSetting") }}</span>

      <n-flex vertical class="item !p-0" :size="0">
        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.autoGenerateTitle") }}</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.autoGenerateTitleHint") }}</div>
          </div>
          <n-switch v-model:value="advancedSettings.autoGenerateTitle" />
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.randomness") }}(temperature)</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.randomnessHint") }}</div>
          </div>
          <n-flex align="center" class="w-[280px]" :size="16">
            <n-input-number
              size="small"
              class="w-[100px]"
              v-model:value="advancedSettings.temperature"
              :step="0.1"
              :min="0"
              :max="2" />
            <n-slider
              class="flex-1"
              v-model:value="advancedSettings.temperature"
              :step="0.1"
              :min="0"
              :max="2"
              :tooltip="false" />
          </n-flex>
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.sampling") }}(top_p)</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.samplingHint") }}</div>
          </div>
          <n-flex align="center" class="w-[280px]" :size="16">
            <n-input-number
              size="small"
              class="w-[100px]"
              v-model:value="advancedSettings.top_p"
              :step="0.1"
              :min="0"
              :max="1" />
            <n-slider
              class="flex-1"
              v-model:value="advancedSettings.top_p"
              :step="0.1"
              :min="0"
              :max="1"
              :tooltip="false" />
          </n-flex>
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.maxTokensPerResponse") }}(max_tokens)</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.maxTokensPerResponseHint") }}</div>
          </div>
          <div class="w-[120px]">
            <n-input-number size="small" v-model:value="advancedSettings.maxTokens" :step="100" :min="1" />
          </div>
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.topicFreshness") }}(presence_penalty)</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.topicFreshnessHint") }}</div>
          </div>
          <n-flex align="center" class="w-[280px]" :size="16">
            <n-input-number
              size="small"
              class="w-[100px]"
              v-model:value="advancedSettings.presencePenalty"
              :step="0.1"
              :min="-2"
              :max="2" />
            <n-slider
              class="flex-1"
              v-model:value="advancedSettings.presencePenalty"
              :step="0.1"
              :min="-2"
              :max="2"
              :tooltip="false" />
          </n-flex>
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.frequencyPenalty") }}(frequency_penalty)</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.frequencyPenaltyHint") }}</div>
          </div>
          <n-flex align="center" class="w-[280px]" :size="16">
            <n-input-number
              size="small"
              class="w-[100px]"
              v-model:value="advancedSettings.frequencyPenalty"
              :step="0.1"
              :min="-2"
              :max="2" />
            <n-slider
              class="flex-1"
              v-model:value="advancedSettings.frequencyPenalty"
              :step="0.1"
              :min="-2"
              :max="2"
              :tooltip="false" />
          </n-flex>
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.includeHistoryMessages") }}</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.includeHistoryMessagesHint") }}</div>
          </div>
          <n-flex align="center" class="w-[280px]" :size="16">
            <n-input-number
              size="small"
              class="w-[100px]"
              v-model:value="advancedSettings.historyCount"
              :step="1"
              :min="0"
              :max="50" />
            <n-slider
              class="flex-1"
              v-model:value="advancedSettings.historyCount"
              :step="1"
              :min="0"
              :max="50"
              :tooltip="false" />
          </n-flex>
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px border-b border-[--line-color]">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.historyMessageCompressionThreshold") }}</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.historyMessageCompressionThresholdHint") }}</div>
          </div>
          <div class="w-[120px]">
            <n-input-number
              size="small"
              v-model:value="advancedSettings.historyCompressThreshold"
              :step="100"
              :min="0" />
          </div>
        </n-flex>

        <n-flex align="center" justify="space-between" class="p-16px">
          <div>
            <span class="text-14px font-bold">{{ t("setting.ai.historySummary") }}</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.autoSummaryHint") }}</div>
          </div>
          <n-switch v-model:value="advancedSettings.historySummary" />
        </n-flex>
        <n-flex
          align="center"
          justify="space-between"
          class="p-16px rounded-b-[12px] transition-colors hover:bg-red-500/10 cursor-pointer"
          @click="handleResetSettings">
          <div>
            <span class="text-14px font-bold text-red-500">{{ t("setting.ai.resetAllSettings") }}</span>
            <div class="text-(12px #909090) mt-4px">{{ t("setting.ai.resetAllSettingsHint") }}</div>
          </div>
          <n-button size="small" secondary type="error">{{ t("setting.ai.reset") }}</n-button>
        </n-flex>
      </n-flex>
    </n-flex>
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
  <add-model-modal v-model:show="showAddModelModal" @submit="handleModelSubmit" />
  <agent-edit-modal
    v-model:show="showAgentEditModal"
    :mode="agentFormMode"
    :initial-data="currentAgentData"
    @submit="handleAgentSubmit" />
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
const modelManageList = ref([
  {
    id: "1",
    displayName: "Qwen/Qwen3-Omni-30B-A3B-Thinking",
    isPublic: true,
    type: "对话",
    platform: "SiliconFlow",
    modelName: "Qwen/Qwen3-Omni-30B-A3B-Thinking",
    temperature: 0.8,
    maxToken: 4096,
    maxContext: 10
  },
  {
    id: "2",
    displayName: "deepseek-ai/DeepSeek-V3.2-Exp",
    isPublic: true,
    type: "对话",
    platform: "SiliconFlow",
    modelName: "deepseek-ai/DeepSeek-V3.2-Exp",
    temperature: 0.8,
    maxToken: 4096,
    maxContext: 10
  },
  {
    id: "3",
    displayName: "图片",
    isPublic: true,
    type: "图片",
    platform: "SiliconFlow",
    modelName: "Kwai-Kolors/Kolors",
    temperature: 0.8,
    maxToken: 4096,
    maxContext: 10
  },
  {
    id: "4",
    displayName: "tencent/Hunyuan-MT-7B",
    isPublic: true,
    type: "对话",
    platform: "SiliconFlow",
    modelName: "tencent/Hunyuan-MT-7B",
    temperature: 0.8,
    maxToken: 4096,
    maxContext: 10
  },
  {
    id: "5",
    displayName: "deepseek-chat",
    isPublic: true,
    type: "对话",
    platform: "DeepSeek",
    modelName: "deepseek-chat",
    temperature: 0.8,
    maxToken: 4096,
    maxContext: 10
  },
  {
    id: "6",
    displayName: "gpt-4o",
    isPublic: false,
    type: "对话",
    platform: "OpenAI",
    modelName: "gpt-4o",
    temperature: 0.7,
    maxToken: 8192,
    maxContext: 20
  }
]);
const showAgentEditModal = ref(false);
const agentFormMode = ref<"add" | "edit">("add");
const currentAgentData = ref<any>(null);
const showAddModelModal = ref(false);

const advancedSettings = reactive({
  autoGenerateTitle: true, // 自动生成标题
  temperature: 0.8, // 随机性
  top_p: 1.0, // 核采样
  maxTokens: 4000, // 单次回复限制
  presencePenalty: 0, // 话题新鲜度
  frequencyPenalty: 0, // 频率惩罚度
  injectSystemPrompt: false, // 注入系统级提示信息
  userInputProcess: "input", // 用户输入预处理
  historyCount: 5, // 附带历史消息数
  historyCompressThreshold: 1000, // 历史消息压缩阈值
  historySummary: true // 历史摘要
});

const statusOptions = computed(() => [
  { label: t("dialog.addModal.available"), value: "available" },
  { label: t("dialog.addModal.disabled"), value: "disabled" }
]);
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

/** 打开新增 Agent 弹窗 */
const openAddAgentModal = () => {
  agentFormMode.value = "add";
  currentAgentData.value = null;
  showAgentEditModal.value = true;
};

/**
 * 打开编辑 Agent 弹窗
 * @param agent 要编辑的 Agent 数据
 */
const openEditAgentModal = (agent: any) => {
  agentFormMode.value = "edit";
  currentAgentData.value = { ...agent }; // 传入当前对象进行编辑
  showAgentEditModal.value = true;
};

/**
 * 删除 Agent
 * @param id 要删除的 Agent ID
 */
const handleDeleteAgent = (id: string) => {
  aiStore.agentList = aiStore.agentList.filter((a) => a.id !== id);
  window.$message?.success(t("setting.ai.msg.deleteSuccess"));
};

/**
 * 提交 Agent 表单 (新增或修改)
 * @param data 要提交的 Agent 数据
 */
const handleAgentSubmit = (data: any) => {
  if (agentFormMode.value === "add") {
    // 新增逻辑：分配 ID 并插到列表前面
    data.id = Date.now().toString();
    aiStore.agentList.unshift(data);
    window.$message?.success(t("setting.ai.msg.addSuccess"));
  } else {
    // 编辑逻辑：找到对应的项并替换
    const index = aiStore.agentList.findIndex((a) => a.id === data.id);
    if (index !== -1) {
      aiStore.agentList[index] = data;
      window.$message?.success(t("setting.ai.msg.editSuccess"));
    }
  }
  showAgentEditModal.value = false;
};

/** 重置设置逻辑 */
const handleResetSettings = () => {
  window.$dialog?.warning({
    title: t("setting.ai.dialog.resetTitle"),
    content: t("setting.ai.dialog.resetConfirm"),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      Object.assign(advancedSettings, {
        autoGenerateTitle: true,
        temperature: 0.8,
        top_p: 1.0,
        maxTokens: 4000,
        presencePenalty: 0,
        frequencyPenalty: 0,
        historyCount: 5,
        historyCompressThreshold: 1000,
        historySummary: true
      });
      window.$message?.success(t("setting.ai.msg.resetSuccess"));
    }
  });
};

/**
 * 提交新增模型表单
 * @param newModelData 要提交的模型数据
 */
const handleModelSubmit = async (newModelData: any) => {
  try {
    // ⬇️ --- 演示：如果是保存真实的 API 密钥，应该这样加密 --- ⬇️
    /*
    // 1. 向后端请求获取 RSA 公钥
    const pubKeyRes = await apiGetPublicKey();
    const publicKey = pubKeyRes.data.publicKey;

    // 2. 将明文秘钥进行加密 (假设 newModelData.rawApiKey 是用户输入的明文)
    const encryptedKey = RsaUtils.encrypt(newModelData.rawApiKey, publicKey);
    
    // 3. 替换掉明文，准备发送给后端
    newModelData.rawApiKey = encryptedKey;
    */
    // ⬆️ ----------------------------------------------------- ⬆️

    // 4. 发送数据给后端 API 进行持久化保存
    // await apiCreateModel(newModelData);

    // ==========================================
    // 5. 后端保存成功后，将新数据组装并更新到前端视图的 modelManageList 中
    // ==========================================

    // 把表单的字段映射成列表卡片需要的字段格式
    const newModelCard = {
      id: Date.now().toString(), // 真实开发中，这里通常用后端返回的 ID
      displayName: newModelData.name,
      isPublic: newModelData.isPublic,
      // 将表单的 value (如 chat, image) 映射为中文展示
      type:
        newModelData.type === "chat"
          ? t("setting.ai.type.chat")
          : newModelData.type === "image"
            ? t("setting.ai.type.image")
            : newModelData.type === "audio"
              ? t("setting.ai.type.audio")
              : t("setting.ai.type.video"),
      platform: newModelData.platform || t("setting.ai.customPlatform"),
      modelName: newModelData.identifier,
      temperature: newModelData.temperature,
      maxToken: newModelData.maxTokens,
      maxContext: newModelData.maxContext
    };

    // 使用 unshift 插到数组最前面（最新创建的排在最上面），或者用 push 插到最后
    modelManageList.value.unshift(newModelCard);

    console.log("最终追加到列表的数据：", newModelCard);
    window.$message?.success(t("setting.ai.msg.modelCreateSuccess"));
  } catch (error) {
    console.error("提交失败:", error);
    window.$message?.error(t("setting.ai.msg.createModelFailed"));
  }
};

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
