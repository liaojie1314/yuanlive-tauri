declare global {
  /**
   * 全局自定义环境变量的类型声明
   */
  interface ViteEnv {
    VITE_APP_NAME: string;
    VITE_PC_URL: string;
    VITE_SERVICE_URL: string;
    VITE_ADMIN_URL: string;
    VITE_CDN: boolean;
    VITE_COMPRESSION: ViteCompression;
    VITE_UPGRADE_LINK_ACCESS_KEY: string;
    VITE_GITHUB_TOKEN: string;
    VITE_GITEE_TOKEN: string;
  }
  /**
   * 打包压缩格式的类型声明
   */
  type ViteCompression = "none" | "gzip" | "brotli" | "both" | "gzip-clear" | "brotli-clear" | "both-clear";

  /**
   * 文件元数据的类型声明
   */
  export type FilesMeta = {
    name: string;
    path: string;
    file_type: string;
    mime_type: string;
    exists: boolean;
  }[];

  export type McpTool = {
    name: string;
    description: string;
    inputSchema: {
      type: string;
      properties: Recordable;
      required: string[];
    };
  };

  export interface McpToolsResponse {
    tools: McpTool[];
  }
}

export {};
