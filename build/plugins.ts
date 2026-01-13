import type { PluginOption } from "vite";
import UnoCSS from "@unocss/vite";
import vue from "@vitejs/plugin-vue";
import VueJsx from "@vitejs/plugin-vue-jsx";
import VueSetupExtend from "vite-plugin-vue-setup-extend";
import AutoImport from "unplugin-auto-import/vite"; // 自动导入
import Components from "unplugin-vue-components/vite"; // 组件注入
import Icons from "unplugin-icons/vite"; // 图标本地化
import IconsResolver from "unplugin-icons/resolver"; // 图标解析器
import removeNoMatch from "vite-plugin-router-warn";
import { visualizer } from "rollup-plugin-visualizer";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import { codeInspectorPlugin } from "code-inspector-plugin";

import { viteBuildInfo } from "./info";

export function getPluginsList(_VITE_CDN: boolean, _VITE_COMPRESSION: ViteCompression): PluginOption[] {
  const lifecycle = process.env.npm_lifecycle_event;
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
    }),
    /**
     * 在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置
     * Mac 默认组合键 Option + Shift
     * Windows 默认组合键 Alt + Shift
     * 更多用法看 https://inspector.fe-dev.cn/guide/start.html
     */
    codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true
    }),
    viteBuildInfo(),
    /**
     * 开发环境下移除非必要的vue-router动态路由警告No match found for location with path
     * 非必要具体看 https://github.com/vuejs/router/issues/521 和 https://github.com/vuejs/router/issues/359
     * vite-plugin-router-warn只在开发环境下启用，只处理vue-router文件并且只在服务启动或重启时运行一次，性能消耗可忽略不计
     */
    removeNoMatch(),
    // 打包分析
    lifecycle === "report" ? visualizer({ open: true, brotliSize: true, filename: "report.html" }) : (null as any)
  ];
}
