declare global {
  /**
   * 全局自定义环境变量的类型声明
   */
  interface ViteEnv {
    VITE_CDN: boolean;
    VITE_COMPRESSION: ViteCompression;
    VITE_CRYPTO_SECRET_KEY: string;
    VITE_CRYPTO_SECRET_IV: string;
    VITE_UPGRADE_LINK_ACCESS_KEY: string;
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
}

export {};
