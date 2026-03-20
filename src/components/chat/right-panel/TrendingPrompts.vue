<template>
  <div class="flex w-full flex-col gap-3">
    <div class="flex-y-center gap-2 px-1 select-none">
      <div
        class="flex h-6 w-6 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500">
        <i-mdi-compass-outline class="h-4 w-4" />
      </div>
      <span class="text-sm font-bold text-[--text-color]">{{ $t("components.trendingPrompts.title") }}</span>
    </div>

    <div class="flex flex-col gap-1">
      <div
        v-for="(item, index) in prompts"
        class="group relative cursor-pointer overflow-hidden rounded-xl border border-[--line-color] bg-[--input-area-bg] p-3 transition-all duration-300 hover:border-blue-500/30 hover:bg-[--tray-hover] hover:shadow-sm"
        :key="index"
        @click="handleSelect(item)">
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

        <div class="relative z-10 flex items-start gap-3">
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-medium text-[--text-color]">{{ item.title }}</span>
            <span class="mt-1 line-clamp-2 text-xs leading-relaxed text-[--user-text-color] opacity-80">
              {{ item.desc }}
            </span>
          </div>

          <div
            class="flex h-5 w-5 flex-shrink-0 translate-x-2 transform items-center justify-center rounded-full border border-[--line-color] bg-[--bg-popover] opacity-0 shadow-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <i-mdi-arrow-top-right class="h-3 w-3 text-[--user-text-color] group-hover:text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MittEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";

// 模拟的推荐数据，实际可以通过后端接口拉取热搜
const prompts = ref([
  {
    title: "分析架构图",
    desc: "上传一张系统架构图，我将为你分析其瓶颈并给出优化建议。",
    prompt: "请分析我刚刚上传的这张架构图，指出潜在的性能瓶颈，并针对高并发场景给出优化建议。"
  },
  {
    title: "Vue3 性能优化",
    desc: "了解如何排查和解决前端渲染卡顿问题。",
    prompt: "在 Vue 3 开发中，有哪些常见导致性能卡顿的写法？请给出排查工具和优化方案。"
  },
  {
    title: "编写测试用例",
    desc: "为现有的 Rust / Tauri 代码生成单元测试。",
    prompt: "请帮我为以下的 Rust 代码编写规范的单元测试，要求覆盖正常路径和异常边界情况：\n\n"
  }
]);

/**
 * 处理选择推荐项
 * @param item 选中的推荐项
 */
const handleSelect = (item: any) => {
  useMitt.emit(MittEnum.FILL_MESSAGE_INPUT, item.prompt);
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
