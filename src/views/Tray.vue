<template>
  <n-flex v-if="false" vertical :size="6" class="tray">
    <n-flex vertical :size="6">
      <n-flex
        @click="checkWinExist('home')"
        align="center"
        :size="10"
        class="p-[8px_6px] rounded-4px hover:bg-[--tray-hover] cursor-pointer"
        v-once>
        <svg class="color-[--action-bar-icon-color] size-16px ml-4">
          <use href="#home"></use>
        </svg>
        <span>{{ t("components.tray.showMainPanel") }}</span>
      </n-flex>
      <div class="h-1px bg-[--line-color] w-full"></div>
      <n-flex align="center" :size="10" class="p-[8px_6px] rounded-4px hover:bg-[--tray-hover] cursor-pointer" v-once>
        <svg class="color-[--action-bar-icon-color] size-16px ml-4">
          <use href="#settings"></use>
        </svg>
        <span>{{ t("components.tray.setting") }}</span>
      </n-flex>
      <div class="h-1px bg-[--line-color] w-full"></div>
      <n-flex
        @click="exit(0)"
        align="center"
        :size="10"
        class="p-[8px_6px] rounded-4px hover:bg-[--tray-hover-e] cursor-pointer"
        v-once>
        <svg class="color-[--action-bar-icon-color] size-16px ml-4">
          <use href="#logout"></use>
        </svg>
        <span>{{ t("components.tray.exit") }}</span>
      </n-flex>
    </n-flex>
  </n-flex>
  <n-flex vertical :size="6" class="tray">
    <n-flex
      @click="exit(0)"
      align="center"
      :size="10"
      class="p-[8px_6px] rounded-4px hover:bg-[--tray-hover-e] cursor-pointer"
      v-once>
      <svg class="color-[--action-bar-icon-color] size-16px ml-4">
        <use href="#logout"></use>
      </svg>
      <span>{{ t("components.tray.exit") }}</span>
    </n-flex>
  </n-flex>
</template>

<script setup lang="ts">
import { exit } from "@tauri-apps/plugin-process";
import { onMounted } from "vue";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useI18nGlobal } from "../services/i18n";
import { useWindow } from "@/hooks/useWindow";

const { t } = useI18nGlobal();
const { checkWinExist } = useWindow();

onMounted(async () => {
  const trayWindow = await WebviewWindow.getByLabel("tray");
  // 监听窗口失去焦点事件，点击窗口外区域时隐藏托盘窗口
  trayWindow?.listen("tauri://blur", async () => {
    await trayWindow.hide();
  });
});
</script>

<style scoped lang="scss">
.tray {
  @apply bg-[--tray-bg-color] size-full p-8px box-border select-none text-[--text-color] text-12px;
}
</style>
