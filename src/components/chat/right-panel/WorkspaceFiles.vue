<template>
  <div class="flex flex-col gap-6 w-full">
    <div v-for="section in sections" :key="section.id" class="flex flex-col gap-3">
      <div class="flex items-center justify-between px-1 select-none">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full flex items-center justify-center border" :class="section.colorClass">
            <i-mdi-database-outline v-if="section.id === 'context'" class="w-4 h-4" />
            <i-mdi-auto-fix v-else class="w-4 h-4" />
          </div>
          <span class="text-sm font-bold text-[--text-color]">{{ section.title }}</span>
        </div>
        <span
          v-if="section.files.length > 0"
          class="text-xs font-mono text-[--user-text-color] bg-[--input-area-bg] px-2 py-0.5 rounded-md border border-[--line-color]">
          {{ section.files.length }}
        </span>
      </div>

      <div v-if="section.files.length > 0" class="flex flex-wrap gap-2.5 select-none mt-1">
        <div v-for="(item, index) in section.files" :key="index" class="relative flex-shrink-0 group cursor-default">
          <div
            v-if="['image', 'video'].includes(item.type)"
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-[--line-color] bg-[--input-area-bg] cursor-pointer hover:opacity-90 transition-opacity shadow-sm relative"
            @click="handlePreview(item)">
            <img :src="item.previewUrl" alt="img" class="w-full h-full object-cover" />
            <div
              v-if="item.type === 'video'"
              class="absolute bottom-1 left-1 bg-black/50 text-white rounded p-0.5 backdrop-blur-sm">
              <i-mdi-play class="w-3 h-3" />
            </div>
          </div>

          <div
            v-else
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-[--line-color] bg-[--input-area-bg] flex items-center justify-center flex-col gap-1 shadow-sm hover:shadow-md transition-shadow select-none cursor-pointer hover:bg-[--tray-hover]"
            :title="item.name"
            @click="handlePreview(item)">
            <span class="text-xs text-[--text-color] font-medium w-full px-1 truncate text-center">
              {{ item.name }}
            </span>
            <div class="flex items-center mt-0.5 gap-1 w-full justify-center opacity-80">
              <img
                :src="`/file/${getFileSuffix(item.name || '')}.svg`"
                :alt="getFileSuffix(item.name || '')"
                class="w-4 h-4 object-contain flex-shrink-0" />
              <span class="text-[9px] text-[--user-text-color] uppercase font-bold truncate max-w-[2rem]">
                {{ getFileSuffix(item.name) }}
              </span>
            </div>
          </div>

          <div
            class="absolute top-[-6px] right-[-6px] w-5 h-5 rounded-full bg-[--action-bar-icon-color] text-[--tray-bg-color] flex items-center justify-center cursor-pointer transition-colors shadow-sm z-10 opacity-0 group-hover:opacity-100"
            :class="section.actionHoverClass"
            :title="section.actionTooltip"
            @click.stop="section.onAction(index, item)">
            <i-mdi-close v-if="section.id === 'context'" class="w-3 h-3" />
            <i-mdi-download v-else class="w-3 h-3" />
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-center py-6 text-xs text-[--user-text-color] border border-dashed border-[--line-color] rounded-xl bg-[--input-area-bg] mt-1">
        {{ section.emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFileSuffix } from "@/utils/FormattingUtils";

const { t } = useI18n();

// 上下文
const contextFiles = ref([
  { type: "image", name: "图片.png", path: "/mock/path/img.png", previewUrl: "https://picsum.photos/id/180/200/200" }, //
  { type: "file", name: "Tauri2_官方API文档.pdf", path: "/mock/path/doc.pdf" },
  { type: "file", name: "assets.7z", path: "/mock/path/assets.7z" },
  { type: "file", name: "nginx.conf", path: "/mock/path/nginx.conf" }
]);

// 生成产物
const generatedFiles = ref([
  {
    type: "video",
    name: "1.mp4",
    path: "asset://localhost/E:/1.mp4",
    previewUrl: "https://picsum.photos/id/20/200/200"
  },
  {
    type: "image",
    name: "midjourney_design.png",
    path: "/mock/path/mj.png",
    previewUrl: "https://picsum.photos/id/64/200/200"
  },
  { type: "audio", name: "tts_voice_reply.mp3", path: "/mock/path/audio.mp3" },
  { type: "file", name: "LiveChatWebSocket.java", path: "/mock/path/LiveChatWebSocket.java" },
  { type: "file", name: "架构分析报告.md", path: "/mock/path/report.md" }
]);

// 将界面差异抽象为数据配置
const sections = computed(() => [
  {
    id: "context",
    title: t("components.workspaceFiles.context"),
    emptyText: t("components.workspaceFiles.emptyContext"),
    colorClass: "text-green-500 bg-green-500/10 border-green-500/20", // Tailwind 类名必须写全以防打包丢失
    files: contextFiles.value,
    actionHoverClass: "hover:bg-red-500",
    actionTooltip: t("components.workspaceFiles.remove"),
    onAction: (index: number, _item: any) => removeContextFile(index) // 绑定独立的事件
  },
  {
    id: "generated",
    title: t("components.workspaceFiles.generated"),
    emptyText: t("components.workspaceFiles.emptyGenerated"),
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    files: generatedFiles.value,
    actionHoverClass: "hover:bg-blue-500",
    actionTooltip: t("components.workspaceFiles.save"),
    onAction: (_index: number, item: any) => downloadGeneratedFile(item)
  }
]);

/**
 * 移除上下文文件
 * @param index 要移除的文件索引
 */
const removeContextFile = (index: number) => {
  contextFiles.value.splice(index, 1);
};

/**
 * 下载生成的文件
 * @param item 要下载的文件项
 */
const downloadGeneratedFile = (item: any) => {
  console.log("调用 Tauri api 保存文件到本地:", item.name);
};

/**
 * 处理文件预览
 * @param item 要预览的文件项
 */
const handlePreview = (item: any) => {
  console.log("预览文件:", item);
};
</script>
