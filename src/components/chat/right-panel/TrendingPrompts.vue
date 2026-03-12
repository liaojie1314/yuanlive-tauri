<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex items-center gap-2 px-1 select-none">
      <div
        class="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
        <i-mdi-compass-outline class="w-4 h-4" />
      </div>
      <span class="text-sm font-bold text-[--text-color]">{{ $t("components.trendingPrompts.title") }}</span>
    </div>

    <div class="flex flex-col gap-1">
      <div
        v-for="(item, index) in prompts"
        :key="index"
        class="group relative p-3 rounded-xl border border-[--line-color] bg-[--input-area-bg] hover:bg-[--tray-hover] hover:border-blue-500/30 hover:shadow-sm transition-all duration-300 cursor-pointer overflow-hidden"
        @click="handleSelect(item)">
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        <div class="flex items-start gap-3 relative z-10">
          <div class="flex flex-col flex-1 min-w-0">
            <span class="text-sm text-[--text-color] font-medium truncate">{{ item.title }}</span>
            <span class="text-xs text-[--user-text-color] mt-1 line-clamp-2 leading-relaxed opacity-80">
              {{ item.desc }}
            </span>
          </div>

          <div
            class="w-5 h-5 rounded-full flex items-center justify-center bg-[--bg-popover] border border-[--line-color] shadow-sm opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0">
            <i-mdi-arrow-top-right class="w-3 h-3 text-[--user-text-color] group-hover:text-blue-500" />
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
