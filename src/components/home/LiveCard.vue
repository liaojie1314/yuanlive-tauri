<template>
  <n-card
    :bordered="false"
    content-style="padding: 0;"
    class="w-full rounded-lg overflow-hidden bg-[--tray-bg-color] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
    hoverable>
    <template #cover>
      <div class="relative w-full aspect-video overflow-hidden">
        <img
          :src="coverUrl"
          :alt="title"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy" />

        <div class="absolute top-2 left-2">
          <n-badge value="live" type="error" dot processing />
          <span class="ml-1 text-xs text-white bg-red-500 px-1 rounded">Live</span>
        </div>

        <div
          class="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-[2px] text-white px-2 py-1 rounded text-xs">
          <n-icon size="14" color="white">
            <i-mdi-eye-outline />
          </n-icon>
          <span class="text-white text-xs">{{ hotScore }}</span>
        </div>
      </div>
    </template>

    <div class="p-3 flex flex-col gap-1">
      <n-text class="text-sm font-medium text-[--text-color] truncate block">
        {{ title }}
      </n-text>

      <n-text class="text-xs text-[--user-text-color] truncate block">
        {{ anchorName }}
      </n-text>
    </div>
  </n-card>
</template>

<script setup lang="ts">
defineOptions({
  name: "LiveCard"
});

interface Props {
  coverUrl: string;
  title: string;
  anchorName: string;
  hotScore: number;
}

defineProps<Props>();
</script>

<style scoped></style>
