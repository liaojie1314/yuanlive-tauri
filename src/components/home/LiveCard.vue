<template>
  <n-card
    content-style="padding: 0;"
    hoverable
    class="group w-full cursor-pointer overflow-hidden rounded-lg bg-[--tray-bg-color] shadow-sm transition-all duration-200 hover:shadow-md"
    :bordered="false">
    <template #cover>
      <div class="relative aspect-video w-full overflow-hidden">
        <img
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          :src="coverUrl"
          :alt="title" />

        <div class="absolute top-2 left-2">
          <n-badge value="live" type="error" dot processing />
          <span class="ml-1 rounded bg-red-500 px-1 text-xs text-white">Live</span>
        </div>

        <div
          class="absolute right-2 bottom-2 flex-y-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-[2px]">
          <n-icon size="14" color="white">
            <i-mdi-eye-outline />
          </n-icon>
          <span class="text-xs text-white">{{ hotScore }}</span>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-1 p-3">
      <n-text class="block truncate text-sm font-medium text-[--text-color]">
        {{ title }}
      </n-text>

      <n-text class="block truncate text-xs text-[--user-text-color]">
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
