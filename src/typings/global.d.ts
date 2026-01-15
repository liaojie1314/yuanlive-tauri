declare global {
  /**
   * 全局自定义环境变量的类型声明
   */
  interface ViteEnv {
    VITE_CDN: boolean;
    VITE_COMPRESSION: ViteCompression;
    VITE_CRYPTO_SECRET_KEY: string;
    VITE_CRYPTO_SECRET_IV: string;
  }
  /**
   * 打包压缩格式的类型声明
   */
  type ViteCompression = "none" | "gzip" | "brotli" | "both" | "gzip-clear" | "brotli-clear" | "both-clear";
}

export {};
