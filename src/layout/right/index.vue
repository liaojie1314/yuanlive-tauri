<template>
  <main data-tauri-drag-region class="min-w-600px flex min-h-0 flex-1 flex-col">
    <div data-tauri-drag-region class="flex min-h-0 flex-1 flex-col">
      <action-bar />
      <router-view v-slot="{ Component }">
        <keep-alive :include="['Index', 'AiChat', 'Follow', 'User']" :max="10">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </main>
</template>

<script setup lang="ts"></script>

<style scoped></style>
