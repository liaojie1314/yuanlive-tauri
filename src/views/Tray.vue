<template>
  <n-flex v-if="showTray" vertical :size="6" class="tray">
    <n-flex vertical :size="6">
      <n-flex
        @click="checkWinExist('home')"
        align="center"
        :size="10"
        class="p-[8px_6px] rounded-4px hover:bg-[--tray-hover] cursor-pointer"
        v-once>
        <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
          <use href="#home"></use>
        </svg>
        <span>{{ t("components.tray.showMainPanel") }}</span>
      </n-flex>
      <div class="h-1px bg-[--line-color] w-full"></div>
      <n-flex align="center" :size="10" class="p-[8px_6px] rounded-4px hover:bg-[--tray-hover] cursor-pointer" v-once>
        <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
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
        <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
          <use href="#logout"></use>
        </svg>
        <span>{{ t("components.tray.exit") }}</span>
      </n-flex>
    </n-flex>
  </n-flex>
  <n-flex v-else vertical :size="6" class="tray">
    <n-flex
      @click="exit(0)"
      align="center"
      :size="10"
      class="p-[8px_6px] rounded-4px hover:bg-[--tray-hover-e] cursor-pointer"
      v-once>
      <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
        <use href="#logout"></use>
      </svg>
      <span>{{ t("components.tray.exit") }}</span>
    </n-flex>
  </n-flex>
</template>

<script setup lang="ts">
import { exit } from "@tauri-apps/plugin-process";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useI18nGlobal } from "../services/i18n";
import { useWindow } from "@/hooks/useWindow";
import { useGlobalStore } from "@/stores/global";

const { t } = useI18nGlobal();
const { checkWinExist, resizeWindow } = useWindow();
const globalStore = useGlobalStore();
const { showTray } = storeToRefs(globalStore);

// 监听托盘窗口尺寸调整事件
const handleTrayResize = async () => {
  const homeWindow = await WebviewWindow.getByLabel("home");
  await resizeWindow("tray", 130, homeWindow ? 138 : 48);
};

onMounted(async () => {
  // 监听系统缩放变化事件，自动调整托盘窗口尺寸
  window.addEventListener("resize-needed", handleTrayResize);
});

onUnmounted(() => {
  window.removeEventListener("resize-needed", handleTrayResize);
});
</script>

<style scoped lang="scss">
.tray {
  @apply bg-[--tray-bg-color] size-full p-8px box-border select-none text-[--text-color] text-12px;
}
</style>
