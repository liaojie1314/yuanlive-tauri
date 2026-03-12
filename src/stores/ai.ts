import { StoresEnum } from "@/enums";

export const useAiStore = defineStore(StoresEnum.AI, () => {
  // 角色与系统提示词
  const systemPrompt = ref("");
  // 激活的 MCP 插件 ID 列表
  const activeMcps = ref<string[]>([]);

  return {
    systemPrompt,
    activeMcps
  };
});
