<template>
  <div id="layout" class="relative flex min-w-310px bg-[--home-bg-color] h-full">
    <div class="flex flex-1 min-h-0">
      <left />
      <right />
    </div>
    <!-- <loading-spinner :percentage="loadingPercentage" :loading-text="loadingText" /> -->
  </div>
</template>

<script setup lang="ts">
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import Left from "./left/index.vue";
import Right from "./right/index.vue";

onMounted(async () => {
  const homeWindow = await WebviewWindow.getByLabel("home");
  if (homeWindow) {
    // 居中
    homeWindow.center();
    homeWindow.show();
  }
});
</script>

<style scoped></style>
