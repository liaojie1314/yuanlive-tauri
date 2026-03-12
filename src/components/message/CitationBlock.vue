<template>
  <div v-if="citations && citations.length > 0" class="mt-3 pt-2 border-t border-[--line-color] w-full">
    <div class="flex items-center gap-1 text-[10px] text-[--user-text-color] mb-1.5 opacity-80 select-none">
      <i-mdi-text-search class="w-3 h-3" />
      <span>{{ $t("components.citationBlock.basedOnCitations", { count: citations.length }) }}</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <n-popover
        v-for="cite in citations"
        :key="cite.id"
        trigger="hover"
        placement="top"
        :keep-alive-on-hover="true"
        style="
          max-width: 300px;
          padding: 8px 12px;
          background-color: var(--bg-popover);
          border: 1px solid var(--line-color);
        ">
        <template #trigger>
          <div
            class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors border border-[--line-color] bg-[--input-area-bg] hover:bg-[--tray-hover]">
            <span class="text-[11px] font-mono font-bold text-[--message-render-color] flex-shrink-0">
              {{ cite.id }}.
            </span>

            <i-mdi-file-document-outline
              v-if="cite.type === 'file'"
              class="w-3.5 h-3.5 text-[--user-text-color] opacity-70" />
            <i-mdi-history
              v-else-if="cite.type === 'history'"
              class="w-3.5 h-3.5 text-[--user-text-color] opacity-70" />
            <i-mdi-web v-else class="w-3.5 h-3.5 text-[--user-text-color] opacity-70" />

            <span class="text-xs text-[--text-color] truncate max-w-[120px]">
              {{ cite.title }}
            </span>
          </div>
        </template>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between border-b border-[--line-color] pb-1">
            <span class="text-xs font-bold text-[--text-color] truncate pr-4">{{ cite.title }}</span>
            <span v-if="cite.score" class="text-[10px] text-green-500 font-mono">
              {{ (cite.score * 100).toFixed(1) }}% {{ $t("components.citationBlock.related") }}
            </span>
          </div>
          <div class="text-xs text-[--user-text-color] leading-relaxed line-clamp-5 select-text">
            "{{ cite.snippet }}"
          </div>
        </div>
      </n-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Citation } from "@/types/chat";

defineProps<{
  citations?: Citation[];
}>();
</script>

<style scoped>
.line-clamp-5 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5; /* 兼容旧版 WebKit 内核 */
  line-clamp: 5; /* W3C 标准属性 */
  overflow: hidden;
}
</style>
