<template>
  <div
    class="file-block my-2 flex max-w-full cursor-pointer items-center gap-3 rounded-lg border p-2.5 shadow-sm transition-opacity hover:opacity-80"
    :class="isSelf ? 'border-transparent bg-black/10' : 'border-[--line-color] bg-[--input-area-bg]'"
    @click="handleFileClick">
    <div
      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded"
      :class="isSelf ? 'bg-white/20' : 'bg-[--tray-bg-color]'">
      <img
        class="h-6 w-6 object-contain"
        :src="`/file/${getFileSuffix(name || '')}.svg`"
        :alt="getFileSuffix(name || '')" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center">
      <div
        class="w-full truncate text-sm font-medium"
        :class="isSelf ? 'text-white' : 'text-[--text-color]'"
        :title="name">
        {{ fileName }}
      </div>
      <div
        class="mt-0.5 flex-y-center gap-1 text-[10px] font-bold uppercase"
        :class="isSelf ? 'text-white/70' : 'text-[--user-text-color]'">
        <span class="max-w-[4rem] truncate">{{ getFileSuffix(name) }}</span>
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
