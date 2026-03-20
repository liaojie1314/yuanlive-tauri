<template>
  <div class="h-full overflow-hidden">
    <div class="h-60px flex-center gap-2">
      <img src="/vite.svg" alt="" class="w-24px h-24px" />
      <p class="text-(20px [--text-color]) cursor-default select-none">YuanLive</p>
    </div>
    <main
      data-tauri-drag-region
      class="left min-w-150px flex-col-center box-border h-[calc(100%-40px)] p-[0_6px_40px] select-none">
      <!-- 导航 -->
      <action-list />
    </main>
  </div>
</template>

<script setup lang="ts">
import ActionList from "./components/ActionList.vue";
</script>

<style scoped lang="scss">
@use "style";
</style>
