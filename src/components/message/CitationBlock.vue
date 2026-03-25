<template>
  <div v-if="citations && citations.length > 0" class="mt-3 w-full border-t border-[--line-color] pt-2">
    <div class="mb-1.5 flex-y-center gap-1 text-[10px] text-[--user-text-color] opacity-80 select-none">
      <i-mdi-text-search class="h-3 w-3" />
      <span>{{ $t("components.citationBlock.basedOnCitations", { count: citations.length }) }}</span>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <n-popover
        v-for="cite in isExpanded ? citations : citations?.slice(0, 3)"
        trigger="hover"
        placement="top"
        style="
          max-width: 300px;
          padding: 8px 12px;
          background-color: var(--bg-popover);
          border: 1px solid var(--line-color);
        "
        :key="cite.id"
        :keep-alive-on-hover="true">
        <template #trigger>
          <div
            class="flex cursor-pointer items-center gap-1.5 rounded-md border border-[--line-color] bg-[--input-area-bg] px-2 py-1 transition-colors hover:bg-[--tray-hover]">
            <span class="flex-shrink-0 font-mono text-[11px] font-bold text-[--message-render-color]">
              {{ cite.id }}.
            </span>

            <i-mdi-file-document-outline
              v-if="cite.type === 'file'"
              class="h-3.5 w-3.5 text-[--user-text-color] opacity-70" />
            <i-mdi-history
              v-else-if="cite.type === 'history'"
              class="h-3.5 w-3.5 text-[--user-text-color] opacity-70" />
            <i-mdi-web v-else class="h-3.5 w-3.5 text-[--user-text-color] opacity-70" />

            <span class="max-w-[120px] truncate text-xs text-[--text-color]">
              {{ cite.title }}
            </span>

            <i-mdi-open-in-new
              v-if="cite.type === 'web'"
              class="ml-0.5 h-3.5 w-3.5 text-blue-500 opacity-60 transition-opacity hover:opacity-100"
              @click="handleCitationClick(cite)" />
          </div>
        </template>

        <div class="flex flex-col gap-1.5">
          <div class="flex-between-center border-b border-[--line-color] pb-1">
            <span class="truncate pr-4 text-xs font-bold text-[--text-color]">{{ cite.title }}</span>
            <span v-if="cite.score" class="font-mono text-[10px] text-green-500">
              {{ (cite.score * 100).toFixed(1) }}% {{ $t("components.citationBlock.related") }}
            </span>
          </div>
          <div class="line-clamp-5 text-xs leading-relaxed text-[--user-text-color] select-text">
            "{{ cite.snippet }}"
          </div>
        </div>
      </n-popover>
      <div
        v-if="citations && citations.length > 3"
        class="flex cursor-pointer items-center justify-center rounded-md border border-[--line-color] bg-[--input-area-bg] px-2 py-1 text-[11px] font-bold text-[--user-text-color] transition-colors hover:bg-[--tray-hover]"
        @click="isExpanded = !isExpanded">
        <span v-if="!isExpanded">+{{ citations.length - 3 }}</span>
        <i-mdi-chevron-up v-else class="h-3.5 w-3.5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Citation } from "@/types/chat";
import { useWindow } from "@/hooks/useWindow";

const { createExternalWebviewWindow } = useWindow();

defineProps<{
  citations?: Citation[];
}>();

const isExpanded = ref(false);

/**
 * 处理引用点击事件
 * @param cite 点击的引用项
 */
const handleCitationClick = async (cite: Citation) => {
  if (cite.type === "web") {
    console.log(cite);
    // 假设网页的真实 URL 存在 cite.url
    const url = cite.url;
    if (url) {
      await createExternalWebviewWindow(cite.title, url);
    }
  } else if (cite.type === "file") {
    console.log("预览本地文件:", cite.title);
  }
};
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
