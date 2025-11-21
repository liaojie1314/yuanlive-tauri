import { ConfigEnv, defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite"; // 自动导入
import Components from "unplugin-vue-components/vite"; // 组件注入
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import { getSrcPath, getRootPath } from "./build/config/getPath";
import vueJsx from "@vitejs/plugin-vue-jsx";
import unocss from "@unocss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  const config = loadEnv(mode, "/");
  console.log(config);
  return {
    resolve: {
      alias: {
        "@": getSrcPath(),
        "~": getRootPath()
      }
    },
    plugins: [
      vue({ script: { propsDestructure: true } }),
      vueJsx(), // 开启jsx功能
      unocss(), // 开启unocss
      AutoImport({
        imports: [
          "vue",
          {
            "naive-ui": ["useDialog", "useMessage", "useNotification", "useLoadingBar"]
          }
        ],
        dts: "src/typings/auto-imports.d.ts"
      }),
      Components({
        dirs: ["src/components/**"],
        resolvers: [NaiveUiResolver()],
        dts: "src/typings/components.d.ts"
      })
    ],
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      host: "0.0.0.0",
      watch: {
        ignored: ["**/src-tauri/**"]
      }
    }
  };
});
