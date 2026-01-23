import { join } from "node:path";
import { readFileSync } from "node:fs";
import postcsspxtorem from "postcss-pxtorem";
import { ConfigEnv, defineConfig, loadEnv } from "vite";
import { root, getSrcPath, createManualChunks, wrapperEnv } from "./build/utils";
import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";

// 读取 package.json 依赖
const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
const dependencies = Object.keys(packageJson.dependencies || {});

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  const { VITE_CDN, VITE_COMPRESSION } = wrapperEnv(loadEnv(mode, root));
  return {
    resolve: {
      alias: {
        // 配置主路径别名@
        "@": getSrcPath(),
        // 配置路径别名~(根路径)
        "~": root
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler", // 相比legacy-compiler 速度快，但兼容性较差
          additionalData: "@use '@/styles/global/variable.scss' as *;" // 加载全局样式，使用scss特性
        }
      },
      postcss: {
        plugins: [
          postcsspxtorem({
            rootValue: 16, // 1rem = 16px，可根据设计稿调整
            propList: ["*"], // 所有属性都转换
            unitPrecision: 5, // 保留小数位数
            selectorBlackList: [], // 不转换的类名（可选）
            replace: true, // 替换原来的 px
            mediaQuery: false, // 是否在媒体查询中转换
            minPixelValue: 0 // 最小转换单位
          })
        ]
      }
    },
    plugins: getPluginsList(VITE_CDN, VITE_COMPRESSION),
    worker: {
      format: "es" as const
    },
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      // 设置兼容低版本浏览器的目标
      target: ["chrome87", "edge88", "firefox78", "safari14"],
      cssCodeSplit: true, // 启用 CSS 代码拆分
      minify: "esbuild" as const, // 指定使用哪种混淆器
      // chunk 大小警告的限制(kb)
      chunkSizeWarningLimit: 1200,
      // esbuild配置，解决低版本浏览器兼容性问题
      esbuild: {
        supported: {
          "top-level-await": false
        },
        // 生产环境移除 console.log、debugger(默认移除注释)
        drop: mode === "production" ? ["console", "debugger"] : []
      },
      sourcemap: false, // 关闭源码映射
      // 分包配置
      rollupOptions: {
        output: {
          chunkFileNames: "static/js/[name]-[hash].js", // 引入文件名的名称
          entryFileNames: "static/js/[name]-[hash].js", // 包的入口文件名称
          assetFileNames: "static/[ext]/[name]-[hash].[ext]", // 资源文件像 字体，图片等
          manualChunks: createManualChunks(dependencies)
        }
      }
    },
    clearScreen: false,
    server: {
      cors: true, // 配置CORS
      host: "0.0.0.0",
      port: 1420,
      strictPort: true,
      watch: {
        ignored: ["**/src-tauri/**"]
      },
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    }
  };
});
