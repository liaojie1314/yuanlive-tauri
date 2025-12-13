<template>
  <div class="h-full bg-[--left-bg-color]">
    <div class="h-60px flex-center gap-2">
      <img src="/vite.svg" class="w-24px h-24px" alt="" />
      <p class="text-(20px [--left-text-color]) cursor-default select-none">YuanLive</p>
    </div>
    <main
      class="left min-w-150px h-[calc(100%-60px)] p-[0_6px_40px] box-border flex-col-center select-none"
      data-tauri-drag-region>
      <!-- 头像 -->
      <!-- 导航:上(首页、AI、关注、我的) -->
      <!-- 导航:下(设置、关于) -->
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>
