import type { PluginOption } from "vite";
import UnoCSS from "@unocss/vite";
import vue from "@vitejs/plugin-vue";
import VueJsx from "@vitejs/plugin-vue-jsx";
import VueSetupExtend from "vite-plugin-vue-setup-extend";
import AutoImport from "unplugin-auto-import/vite"; // 自动导入
import Components from "unplugin-vue-components/vite"; // 组件注入
import Icons from "unplugin-icons/vite"; // 图标本地化
import IconsResolver from "unplugin-icons/resolver"; // 图标解析器
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";

export function getPluginsList(_VITE_CDN: boolean, _VITE_COMPRESSION: ViteCompression): PluginOption[] {
  const _lifecycle = process.env.npm_lifecycle_event;
  return [
    vue(),
    VueSetupExtend(),
    VueJsx(), // 开启jsx功能
    UnoCSS(), // 开启unocss
    Icons({
      autoInstall: true,
      compiler: "vue3"
    }),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "pinia",
        {
          "naive-ui": ["useDialog", "useMessage", "useNotification", "useLoadingBar", "useModal"]
        }
      ],
      dts: "src/typings/auto-imports.d.ts"
    }),
    Components({
      dirs: ["src/components/**"],
      resolvers: [NaiveUiResolver(), IconsResolver()],
      dts: "src/typings/components.d.ts"
    })
  ];
}
