<template>
  <div>live window</div>
</template>

<script setup lang="ts">
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

onMounted(async () => {
  await getCurrentWebviewWindow().show();
});
</script>

<style scoped lang="scss"></style>
