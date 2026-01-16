<template>
  <main data-tauri-drag-region class="flex-1 bg-[--right-bg-color] flex flex-col min-h-0 min-w-600px">
    <div data-tauri-drag-region class="flex-1 flex flex-col min-h-0">
      <action-bar />
      <router-view v-slot="{ Component, route }">
        <keep-alive include="Index,AiChat,Follow,User" :max="10">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </router-view>
    </div>
  </main>
</template>

<script setup lang="ts"></script>

<style scoped></style>
