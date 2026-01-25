<template>
  <n-card
    :bordered="false"
    class="w-full rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
    hoverable>
    <template #cover>
      <div class="relative w-full aspect-video overflow-hidden">
        <img
          :src="imageUrl"
          :alt="title"
          class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
        <n-badge
          v-if="isLive"
          type="error"
          class="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium"
          processing
          :show-dot="true">
          live
        </n-badge>
        <div
          class="absolute bottom-2 right-2 flex items-center gap-1 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
          <n-icon size="14" color="--tray-bg-color">
            <i-mdi-eye-outline class="w-4 h-4" />
          </n-icon>
          <n-text class="color-[--tray-bg-color]" size="small">{{ viewers }}</n-text>
        </div>
      </div>
    </template>
    <div class="p-2 flex flex-col gap-1">
      <n-text strong truncate class="text-sm font-medium text-gray-800 truncate">{{ title }}</n-text>
      <n-text :depth="3" truncate class="text-xs text-gray-500 truncate">{{ author }}</n-text>
    </div>
  </n-card>
</template>

<script setup lang="ts">
defineOptions({
  name: "ImageCard"
});

interface Props {
  imageUrl: string;
  title: string;
  author: string;
  viewers: number;
  isLive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLive: false
});
</script>
