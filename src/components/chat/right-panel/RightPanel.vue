<template>
  <div class="w-full h-full flex flex-col bg-[--tray-bg-color] overflow-hidden relative">
    <n-scrollbar class="flex-1">
      <div class="p-4 flex flex-col gap-8">
        <trending-prompts />

        <workspace-files />

        <agent-settings />
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts"></script>
