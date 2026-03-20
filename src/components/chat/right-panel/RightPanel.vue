<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden bg-[--tray-bg-color]">
    <n-scrollbar class="flex-1">
      <div class="flex flex-col gap-8 p-4">
        <trending-prompts />

        <workspace-files />

        <agent-settings />
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts"></script>
