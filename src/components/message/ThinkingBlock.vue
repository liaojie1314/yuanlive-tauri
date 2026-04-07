<template>
  <div class="thinking-block group mb-2">
    <div
      class="flex cursor-pointer items-center justify-between rounded-lg border border-[--line-color] bg-[--input-area-bg] px-3 py-2 shadow-sm transition-colors duration-200 select-none hover:bg-[--tray-hover]"
      @click="isExpanded = !isExpanded">
      <div class="flex-y-center gap-2 text-xs">
        <i-mdi-thought-bubble-outline class="h-4 w-4 text-blue-500" />
        <span class="font-medium text-[--text-color]">{{ $t("components.thinkingBlock.think") }}</span>
      </div>
      <i-material-symbols-keyboard-arrow-down
        class="h-4 w-4 text-[--user-text-color] opacity-60 transition-transform duration-300"
        :class="{ 'rotate-180': isExpanded }" />
    </div>

    <div
      class="mt-2 grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
      <div class="overflow-hidden">
        <div class="rounded-lg border border-[--line-color] bg-[--tray-bg-color] p-4">
          <div
            v-if="content"
            class="mb-4 text-xs leading-relaxed whitespace-pre-wrap text-[--user-text-color] opacity-90">
            {{ content }}
          </div>

          <div v-if="toolCalls && toolCalls.length > 0" class="relative mt-2 ml-1 flex flex-col">
            <div class="absolute top-3 bottom-2 left-[7px] z-0 w-[1.5px] bg-[--line-color] opacity-60"></div>

            <div
              v-for="tool in toolCalls"
              class="relative z-10 mb-5 flex flex-col gap-1.5 pl-6 last:mb-0"
              :key="tool.id">
              <div class="absolute top-0.5 left-0 flex h-4 w-4 items-center justify-center bg-[--tray-bg-color]">
                <i-mdi-check-circle-outline v-if="tool.status === 'success'" class="h-4 w-4 text-[#10b981]" />
                <i-mdi-close-circle-outline v-else-if="tool.status === 'error'" class="h-4 w-4 text-[#ef4444]" />
                <i-mdi-loading v-else-if="tool.status === 'executing'" class="h-4 w-4 animate-spin text-blue-500" />
                <i-mdi-help-circle-outline v-else class="h-4 w-4 text-[#f59e0b]" />
              </div>

              <div class="flex-y-center gap-1.5 text-xs text-[--text-color]">
                <span class="opacity-70">{{ $t("components.thinkingBlock.callTool") }}:</span>
                <span class="font-mono text-[#8b5cf6]">{{ tool.name }}</span>
              </div>

              <div v-if="tool.args" class="mt-0.5 space-y-1 font-mono text-[11.5px] text-[--user-text-color]">
                <div v-for="(val, key) in tool.args" class="flex items-start gap-1" :key="key">
                  <span class="min-w-max opacity-60">{{ key }}:</span>
                  <span class="break-all text-[--text-color] opacity-90">
                    {{ typeof val === "object" ? JSON.stringify(val) : val }}
                  </span>
                </div>
              </div>

              <details
                v-if="tool.result"
                class="group/details mt-1.5 cursor-pointer text-[11.5px] text-[--user-text-color] outline-none">
                <summary
                  class="flex-y-center gap-1 opacity-60 transition-opacity outline-none select-none hover:opacity-100">
                  <i-material-symbols-keyboard-arrow-right
                    class="h-3.5 w-3.5 transition-transform group-open/details:rotate-90" />
                  <span>{{ $t("components.thinkingBlock.toolResult") }}</span>
                </summary>
                <div
                  class="text-opacity-80 mt-2 max-h-40 overflow-y-auto rounded-md border border-[--line-color] bg-[--input-area-bg] p-2.5 font-mono whitespace-pre-wrap">
                  {{ tool.result }}
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "ThinkingBlock" });

defineProps<{
  content?: string;
  toolCalls?: any[];
}>();

const isExpanded = ref(true);
</script>
