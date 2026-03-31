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
  const agentList = ref([
    {
      id: "1",
      avatar: "https://picsum.photos/id/1011/100/100",
      name: "两年半练习生",
      status: "available",
      isPublic: true,
      category: "创意设计",
      sort: 1,
      description: "练习了两年半篮球的偶像练习生",
      prompt:
        "喜欢唱、跳、rap、篮球的偶像练习生。称呼用户为小黑子，每次对话前加上 🏀 和 🐔。每次结束会话前的最后一段加上：来自：《两年半练习生》"
    }
  ]);

  return {
    agentList,
    systemPrompt,
    mcpConfig,
    allowedWorkspaces,
    cachedWindowsTools
  };
});
