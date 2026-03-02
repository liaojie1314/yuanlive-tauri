<template>
  <div class="thinking-block mb-2 group">
    <div
      class="flex items-center justify-between px-3 py-2 cursor-pointer select-none rounded-lg transition-colors duration-200"
      :class="
        isExpanded
          ? 'bg-[--tray-hover] text-[--text-color]'
          : 'hover:bg-[--tray-hover] text-[--user-text-color] opacity-70 hover:opacity-100'
      "
      @click="isExpanded = !isExpanded">
      <div class="flex items-center gap-2 text-xs">
        <i-mdi-loading v-if="!isExpanded && duration === 0" class="w-4 h-4 animate-spin text-blue-500" />
        <i-mdi-thought-bubble-outline v-else class="w-4 h-4" :class="isExpanded ? 'text-blue-500' : ''" />

        <span class="font-medium">
          {{
            isExpanded
              ? $t("components.thinkingBlock.think")
              : $t("components.thinkingBlock.thinkDuration", { duration })
          }}
        </span>
      </div>

      <i-material-symbols-keyboard-arrow-down
        class="w-4 h-4 transition-transform duration-300 opacity-60"
        :class="{ 'rotate-180': isExpanded }" />
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
      <div class="overflow-hidden">
        <div class="pt-1 pb-3 pl-2 pr-2">
          <div class="p-3 rounded-md bg-[--line-color] bg-opacity-30 border-l-2 border-blue-400/50">
            <div class="text-xs leading-relaxed text-[--user-text-color] opacity-80 whitespace-pre-wrap font-mono">
              {{ content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "ThinkingBlock"
});

defineProps<{
  content: string;
  duration: number;
}>();

const isExpanded = ref(true);
</script>

<style scoped>
.thinking-block {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
