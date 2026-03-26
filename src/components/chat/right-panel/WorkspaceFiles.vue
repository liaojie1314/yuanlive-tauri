<template>
  <div class="flex w-full flex-col gap-6">
    <div v-for="section in sections" class="flex flex-col gap-3" :key="section.id">
      <div class="flex-between-center px-1 select-none">
        <div class="flex-y-center gap-2">
          <div class="flex h-6 w-6 items-center justify-center rounded-full border" :class="section.colorClass">
            <i-mdi-database-outline v-if="section.id === 'context'" class="h-4 w-4" />
            <i-mdi-auto-fix v-else class="h-4 w-4" />
          </div>
          <span class="text-sm font-bold text-[--text-color]">{{ section.title }}</span>
        </div>
        <span
          v-if="section.files.length > 0"
          class="rounded-md border border-[--line-color] bg-[--input-area-bg] px-2 py-0.5 font-mono text-xs text-[--user-text-color]">
          {{ section.files.length }}
        </span>
      </div>

      <div v-if="section.files.length > 0" class="mt-1 flex flex-wrap gap-2.5 select-none">
        <div
          v-for="(item, index) in expandedSections[section.id] ? section.files : section.files.slice(0, DISPLAY_LIMIT)"
          class="group relative flex-shrink-0 cursor-default"
          :key="index">
          <div
            v-if="['image', 'video'].includes(item.type)"
            class="relative h-14 w-14 cursor-pointer overflow-hidden rounded-lg border border-[--line-color] bg-[--input-area-bg] shadow-sm transition-opacity hover:opacity-90 sm:h-16 sm:w-16"
            @click="handlePreview(item)">
            <img alt="img" class="h-full w-full object-cover" :src="item.previewUrl" />
            <div
              v-if="item.type === 'video'"
              class="absolute bottom-1 left-1 rounded bg-black/50 p-0.5 text-white backdrop-blur-sm">
              <i-mdi-play class="h-3 w-3" />
            </div>
          </div>

          <div
            v-else
            class="flex h-14 w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-[--line-color] bg-[--input-area-bg] shadow-sm transition-shadow select-none hover:bg-[--tray-hover] hover:shadow-md sm:h-16 sm:w-16"
            :title="item.name"
            @click="handlePreview(item)">
            <span class="w-full truncate px-1 text-center text-xs font-medium text-[--text-color]">
              {{ item.name }}
            </span>
            <div class="mt-0.5 flex w-full items-center justify-center gap-1 opacity-80">
              <img
                class="h-4 w-4 flex-shrink-0 object-contain"
                :src="`/file/${getFileSuffix(item.name || '')}.svg`"
                :alt="getFileSuffix(item.name || '')" />
              <span class="max-w-[2rem] truncate text-[9px] font-bold text-[--user-text-color] uppercase">
                {{ getFileSuffix(item.name) }}
              </span>
            </div>
          </div>

          <div
            v-if="section.id === 'generated'"
            class="absolute top-[-6px] right-[-6px] z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[--action-bar-icon-color] text-[--tray-bg-color] opacity-0 shadow-sm transition-colors group-hover:opacity-100 hover:bg-blue-500"
            :title="t('components.workspaceFiles.save')"
            @click.stop="section.onAction(index, item)">
            <i-mdi-download class="h-3 w-3" />
          </div>

          <n-dropdown
            v-if="section.id === 'context'"
            trigger="click"
            placement="bottom-end"
            :options="getContextMenuOptions(item)"
            @select="(key: string) => handleContextAction(key, index, item)">
            <div
              class="absolute top-[-6px] right-[-6px] z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-[--action-bar-icon-color] text-[--tray-bg-color] opacity-0 shadow-sm transition-colors group-hover:opacity-100 hover:bg-gray-500"
              @click.stop>
              <i-mdi-dots-horizontal class="h-3 w-3" />
            </div>
          </n-dropdown>
        </div>

        <div
          v-if="section.files.length > DISPLAY_LIMIT"
          class="flex h-14 w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-[--line-color] bg-[--input-area-bg] shadow-sm transition-shadow select-none hover:bg-[--tray-hover] sm:h-16 sm:w-16"
          @click="toggleExpand(section.id)">
          <span class="text-xs font-bold text-[--user-text-color] opacity-80">
            {{ expandedSections[section.id] ? "收起" : `+${section.files.length - DISPLAY_LIMIT}` }}
          </span>
        </div>
      </div>

      <div
        v-else
        class="mt-1 rounded-xl border border-dashed border-[--line-color] bg-[--input-area-bg] py-6 text-center text-xs text-[--user-text-color]">
        {{ section.emptyText }}
      </div>
    </div>
    <add-to-knowledge-modal v-model:show="showKbModal" :file="currentOperateFile" @success="handleKbSuccess" />
  </div>
</template>

<script setup lang="ts">
import { NIcon } from "naive-ui";
import { useI18n } from "vue-i18n";
import IconClose from "~icons/mdi/close";
import IconDatabasePlus from "~icons/mdi/database-plus-outline";

import { getFileSuffix } from "@/utils/FormattingUtils";

const { t } = useI18n();

const DISPLAY_LIMIT = 5; // 设置默认展示的数量
// 允许加入知识库的文件后缀白名单
const SUPPORTED_KB_EXTENSIONS = ["md", "pdf", "txt", "docx", "csv", "json"];

const showKbModal = ref(false);
const currentOperateFile = ref<any>(null);
const expandedSections = ref<Record<string, boolean>>({});
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
 * 根据文件类型动态生成右键/下拉菜单
 * @param item 要操作的文件项
 * @returns 右键/下拉菜单选项数组
 */
const getContextMenuOptions = (item: any) => {
  const ext = getFileSuffix(item.name || "").toLowerCase();
  const isSupported = SUPPORTED_KB_EXTENSIONS.includes(ext);
  const options: any[] = [];
  // 只有在白名单内的文件，才显示“添加到知识库”
  if (isSupported) {
    options.push({
      label: t("components.workspaceFiles.addToKB"),
      key: "add_to_kb",
      icon: () => h(NIcon, null, { default: () => h(IconDatabasePlus) })
    });
    options.push({ type: "divider", key: "d1" });
  }
  // “移除”按钮对所有文件都可用
  options.push({
    label: t("components.workspaceFiles.remove"),
    key: "remove",
    icon: () => h(NIcon, { class: "text-red-500" }, { default: () => h(IconClose) })
  });
  return options;
};

/**
 * 切换文件列表的展开状态
 * @param sectionId 要切换的文件列表的 ID
 */
const toggleExpand = (sectionId: string) => {
  expandedSections.value[sectionId] = !expandedSections.value[sectionId];
};

/**
 * 处理上下文文件的菜单操作
 * @param key 菜单选项的键值
 * @param index 要操作的文件索引
 * @param item 要操作的文件项
 */
const handleContextAction = (key: string, index: number, item: any) => {
  if (key === "remove") {
    removeContextFile(index);
  } else if (key === "add_to_kb") {
    currentOperateFile.value = item;
    showKbModal.value = true;
  }
};

/**
 * 添加到知识库成功后的回调
 */
const handleKbSuccess = () => {
  console.log("已将文件加入全局记忆！");
  // 可以在这里刷新一下侧边栏的知识库列表等状态
};

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
