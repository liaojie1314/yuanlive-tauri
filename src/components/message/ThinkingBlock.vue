<template>
  <div class="thinking-block mb-2 group">
    <div
      class="flex items-center justify-between px-3 py-2 cursor-pointer select-none rounded-lg transition-colors duration-200 bg-[--input-area-bg] hover:bg-[--tray-hover] border border-[--line-color] shadow-sm"
      @click="isExpanded = !isExpanded">
      <div class="flex items-center gap-2 text-xs">
        <i-mdi-loading v-if="!isExpanded && duration === 0" class="w-4 h-4 animate-spin text-blue-500" />
        <i-mdi-thought-bubble-outline v-else class="w-4 h-4 text-blue-500" />
        <span class="font-medium text-[--text-color]">
          {{ isExpanded ? "思考与执行过程" : $t("components.thinkingBlock.thinkDuration", { duration }) }}
        </span>
      </div>
      <i-material-symbols-keyboard-arrow-down
        class="w-4 h-4 transition-transform duration-300 opacity-60 text-[--user-text-color]"
        :class="{ 'rotate-180': isExpanded }" />
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out mt-2"
      :class="isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
      <div class="overflow-hidden">
        <div class="p-4 bg-[--tray-bg-color] rounded-lg border border-[--line-color]">
          <div
            v-if="content"
            class="text-xs leading-relaxed text-[--user-text-color] opacity-90 whitespace-pre-wrap mb-4">
            {{ content }}
          </div>

          <div v-if="toolCalls && toolCalls.length > 0" class="flex flex-col relative ml-1 mt-2">
            <div class="absolute left-[7px] top-3 bottom-2 w-[1.5px] bg-[--line-color] opacity-60 z-0"></div>

            <div
              v-for="tool in toolCalls"
              :key="tool.id"
              class="relative z-10 flex flex-col gap-1.5 pl-6 mb-5 last:mb-0">
              <div class="absolute left-0 top-0.5 w-4 h-4 flex items-center justify-center bg-[--tray-bg-color]">
                <i-mdi-check-circle-outline v-if="tool.status === 'success'" class="w-4 h-4 text-[#10b981]" />
                <i-mdi-close-circle-outline v-else-if="tool.status === 'error'" class="w-4 h-4 text-[#ef4444]" />
                <i-mdi-loading v-else-if="tool.status === 'executing'" class="w-4 h-4 text-blue-500 animate-spin" />
                <i-mdi-help-circle-outline v-else class="w-4 h-4 text-[#f59e0b]" />
              </div>

              <div class="text-xs text-[--text-color] flex items-center gap-1.5">
                <span class="opacity-70">{{ $t("components.thinkingBlock.callTool") }}:</span>
                <span class="text-[#8b5cf6] font-mono">{{ tool.name }}</span>
              </div>

              <div v-if="tool.args" class="text-[11.5px] text-[--user-text-color] font-mono mt-0.5 space-y-1">
                <div v-for="(val, key) in tool.args" :key="key" class="flex items-start gap-1">
                  <span class="opacity-60 min-w-max">{{ key }}:</span>
                  <span class="break-all text-[--text-color] opacity-90">
                    {{ typeof val === "object" ? JSON.stringify(val) : val }}
                  </span>
                </div>
              </div>

              <details
                v-if="tool.result"
                class="text-[11.5px] text-[--user-text-color] group/details outline-none cursor-pointer mt-1.5">
                <summary
                  class="flex items-center gap-1 opacity-60 hover:opacity-100 select-none outline-none transition-opacity">
                  <i-material-symbols-keyboard-arrow-right
                    class="w-3.5 h-3.5 transition-transform group-open/details:rotate-90" />
                  <span>{{ $t("components.thinkingBlock.toolResult") }}</span>
                </summary>
                <div
                  class="mt-2 p-2.5 bg-[--input-area-bg] border border-[--line-color] rounded-md max-h-40 overflow-y-auto font-mono whitespace-pre-wrap text-opacity-80">
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
  duration?: number;
  toolCalls?: any[];
}>();

const isExpanded = ref(true);
</script>
