<template>
  <div
    class="file-block my-2 flex items-center gap-3 p-2.5 rounded-lg border shadow-sm cursor-pointer hover:opacity-80 transition-opacity max-w-full"
    :class="isSelf ? 'bg-black/10 border-transparent' : 'bg-[--input-area-bg] border-[--line-color]'"
    @click="handleFileClick">
    <div
      class="w-10 h-10 flex items-center justify-center rounded flex-shrink-0"
      :class="isSelf ? 'bg-white/20' : 'bg-[--tray-bg-color]'">
      <img
        :src="`/file/${getFileSuffix(name || '')}.svg`"
        :alt="getFileSuffix(name || '')"
        class="w-6 h-6 object-contain" />
    </div>

    <div class="flex-1 min-w-0 flex flex-col justify-center">
      <div
        class="text-sm font-medium truncate w-full"
        :class="isSelf ? 'text-white' : 'text-[--text-color]'"
        :title="name">
        {{ fileName }}
      </div>
      <div
        class="text-[10px] uppercase mt-0.5 font-bold flex items-center gap-1"
        :class="isSelf ? 'text-white/70' : 'text-[--user-text-color]'">
        <span class="truncate max-w-[4rem]">{{ getFileSuffix(name) }}</span>
        <span>FILE</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFileSuffix } from "@/utils/FormattingUtils";

defineOptions({
  name: "FileBlock"
});

const props = defineProps<{
  url: string;
  name: string;
  isSelf?: boolean;
}>();

const fileName = computed(() => {
  if (!props.name) return "Unknown File";
  try {
    // 1. URL 解码
    const decodedName = decodeURIComponent(props.name);
    // 2. 统一处理分隔符 (兼容 Windows 的 \ 和 Mac/Linux 的 /)
    // 将所有 \ 替换为 /，然后取最后一个 / 后面的内容
    return decodedName.replace(/\\/g, "/").split("/").pop() || props.name;
  } catch (e) {
    // 如果解码失败，尝试直接分割原始字符串
    return props.name.replace(/\\/g, "/").split("/").pop() || props.name;
  }
});

/** 点击文件块处理 */
const handleFileClick = () => {
  // TODO: 预览文件
  console.log("点击了消息中的文件:", props.name, props.url);
};
</script>
