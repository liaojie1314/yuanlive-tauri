<template>
  <n-flex v-if="showTray" vertical class="tray" :size="6">
    <n-flex vertical :size="6">
      <n-flex
        align="center"
        v-once
        class="rounded-4px cursor-pointer p-[8px_6px] hover:bg-[--tray-hover]"
        :size="10"
        @click="checkWinExist('home')">
        <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
          <use href="#home"></use>
        </svg>
        <span>{{ t("components.tray.showMainPanel") }}</span>
      </n-flex>
      <div class="h-1px w-full bg-[--line-color]"></div>
      <n-flex align="center" v-once class="rounded-4px cursor-pointer p-[8px_6px] hover:bg-[--tray-hover]" :size="10">
        <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
          <use href="#settings"></use>
        </svg>
        <span>{{ t("components.tray.setting") }}</span>
      </n-flex>
      <div class="h-1px w-full bg-[--line-color]"></div>
      <n-flex
        align="center"
        v-once
        class="rounded-4px cursor-pointer p-[8px_6px] hover:bg-[--tray-hover-e]"
        :size="10"
        @click="exit(0)">
        <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
          <use href="#logout"></use>
        </svg>
        <span>{{ t("components.tray.exit") }}</span>
      </n-flex>
    </n-flex>
  </n-flex>
  <n-flex v-else vertical class="tray" :size="6">
    <n-flex
      align="center"
      v-once
      class="rounded-4px cursor-pointer p-[8px_6px] hover:bg-[--tray-hover-e]"
      :size="10"
      @click="exit(0)">
      <svg class="color-[--action-bar-icon-color] size-16px ml-4px">
        <use href="#logout"></use>
      </svg>
      <span>{{ t("components.tray.exit") }}</span>
    </n-flex>
  </n-flex>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { exit } from "@tauri-apps/plugin-process";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useWindow } from "@/hooks/useWindow";
import { useGlobalStore } from "@/stores/global";

const { t } = useI18n();
const { checkWinExist, resizeWindow } = useWindow();
const globalStore = useGlobalStore();
const { showTray } = storeToRefs(globalStore);

/** 监听托盘窗口尺寸调整事件 */
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
  @apply p-8px text-12px box-border size-full bg-[--tray-bg-color] text-[--text-color] select-none;
}
</style>
