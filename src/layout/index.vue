<template>
  <div>layout</div>
</template>

<script setup lang="ts">
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

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
