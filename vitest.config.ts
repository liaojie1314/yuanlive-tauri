/// <reference types="vitest" />

import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import Icons from "unplugin-icons/vite";
import VueJsx from "@vitejs/plugin-vue-jsx";
import AutoImport from "unplugin-auto-import/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { defineConfig, configDefaults } from "vitest/config";

import { getComponentsDirs, getComponentsDtsPath } from "./build/components";

const testPlatform = process.env.TAURI_ENV_PLATFORM;
const testComponentsDirs = getComponentsDirs(testPlatform);
const testComponentsDtsPath = getComponentsDtsPath(testPlatform);

export default defineConfig({
  plugins: [
    vue(),
    VueJsx(),
    Icons({ compiler: "vue3" }),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "pinia",
        { "naive-ui": ["useDialog", "useMessage", "useNotification", "useLoadingBar", "useModal"] }
      ],
      dts: "src/typings/auto-imports.d.ts"
    }),
    Components({
      dirs: testComponentsDirs,
      resolvers: [NaiveUiResolver()],
      dts: testComponentsDtsPath
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "#": fileURLToPath(new URL("./src/mobile", import.meta.url)),
      "~": fileURLToPath(new URL(".", import.meta.url))
    }
  },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [...configDefaults.exclude, "tests/**"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{vue,js,jsx,ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{js,ts}",
        "src/types/**",
        "src/**/*.d.ts",
        "src/main.ts",
        "src/enums/**",
        "src/router/**",
        "src/layout/**" // 纯粹的 UI 骨架交由 E2E 测试
      ]
    }
  }
});
