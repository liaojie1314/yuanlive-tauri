import { StoresEnum } from "@/enums";

export const useAiStore = defineStore(StoresEnum.AI, () => {
  // 角色与系统提示词
  const systemPrompt = ref("");
  // 激活的 MCP 插件 及 tool
  const mcpConfig = ref<Record<string, { enabled: boolean; activeTools: string[] }>>({
    "windows-mcp": {
      enabled: false,
      activeTools: []
    },
    "fs-mcp": {
      enabled: false,
      activeTools: []
    }
  });
  // 允许 AI 访问的本地目录白名单 (工作区沙盒)
  const allowedWorkspaces = ref<string[]>([]);
  const cachedWindowsTools = ref<any[]>([]);

  return {
    systemPrompt,
    mcpConfig,
    allowedWorkspaces,
    cachedWindowsTools
  };
});
