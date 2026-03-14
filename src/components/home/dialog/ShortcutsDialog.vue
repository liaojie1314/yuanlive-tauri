<template>
  <base-dialog v-model:show="dialogVisible" :title="t('dialog.shortcuts.title')" height="540px" width="600px">
    <template #default>
      <div
        class="flex w-full border-t border-[var(--line-color)] bg-[var(--bg-popover)] text-[var(--text-color)] overflow-hidden"
        style="height: 460px">
        <div
          class="w-[140px] border-r border-[var(--line-color)] p-2 flex flex-col gap-1 shrink-0 z-10 bg-[var(--bg-popover)]">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] cursor-pointer text-[13px] transition-all select-none"
            :class="[
              activeTab === tab.id
                ? 'bg-[var(--bg-setting-item)] text-[var(--text-color)] font-medium shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                : 'text-[var(--user-text-color)] hover:bg-[var(--bg-left-menu-hover)]'
            ]"
            @click="scrollToGroup(tab.id)">
            <div class="flex items-center justify-center text-[16px]">
              <i-mdi-heart-outline v-if="tab.id === 'interactive'" />
              <i-mdi-play-circle-outline v-else-if="tab.id === 'playback'" />
            </div>
            <span>{{ tab.label }}</span>
          </div>
        </div>

        <div class="flex-1 flex flex-col h-full bg-[var(--bg-popover)] overflow-hidden">
          <div class="flex-1 h-0">
            <n-scrollbar ref="scrollbarRef" style="height: 100%" @scroll="handleScroll">
              <div class="px-6 py-4 pb-12">
                <div v-for="tab in tabs" :key="tab.id" :id="`shortcut-group-${tab.id}`" class="mb-8 last:mb-0">
                  <div class="text-[15px] font-semibold mb-2 text-[var(--text-color)]">
                    {{ tab.label }}
                  </div>

                  <div class="flex flex-col">
                    <div
                      v-for="item in shortcutStructure[tab.id]"
                      :key="item.key"
                      class="flex justify-between items-center h-[46px] border-b border-[var(--line-color)] last:border-none">
                      <span class="text-[13px] text-[var(--user-text-color)]">{{ item.label }}</span>

                      <div
                        class="flex items-center justify-center min-w-[60px] h-[28px] px-3 rounded-[6px] text-[13px] cursor-pointer transition-all select-none font-mono"
                        :class="[
                          recordingKey === item.key
                            ? 'bg-[rgba(255,0,80,0.1)] text-[#ff0050] border border-[#ff0050] animate-pulse shadow-sm'
                            : 'bg-[var(--bg-setting-item)] hover:bg-[var(--bg-left-menu-hover)] text-[var(--text-color)] border border-transparent'
                        ]"
                        @click="startRecording(item.key)">
                        <span v-if="recordingKey === item.key">{{ t("dialog.shortcuts.wait") }}</span>
                        <span v-else>{{ formatKeyDisplay(tempShortcuts[item.key]) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </n-scrollbar>
          </div>

          <div
            class="h-[60px] shrink-0 border-t border-[var(--line-color)] flex justify-between items-center px-6 bg-[var(--bg-popover)] z-10">
            <n-button secondary size="small" @click="restoreDefaults" class="!px-4">
              <template #icon>
                <i-mdi-refresh />
              </template>
              {{ t("dialog.shortcuts.restoreDefaults") }}
            </n-button>
            <n-button type="primary" color="#ff0050" size="small" class="!px-6 !font-medium" @click="handleSave">
              {{ t("dialog.shortcuts.save") }}
            </n-button>
          </div>
        </div>
      </div>
    </template>
  </base-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ScrollbarInst } from "naive-ui";

import { DEFAULT_SHORTCUTS, type ShortcutConfig } from "@/stores/shortcut";

defineOptions({
  name: "ShortcutsDialog"
});

const { t } = useI18n();

const props = defineProps<{ show: boolean; modelValue: ShortcutConfig }>();
const emit = defineEmits<{
  "update:show": [value: boolean];
  "update:modelValue": [value: ShortcutConfig];
  save: [value: ShortcutConfig];
}>();

type ShortcutKey = keyof ShortcutConfig;
interface ShortcutItem {
  label: string;
  key: ShortcutKey; // 锁定 key 的类型
}

// 按照分类和顺序组织结构
const shortcutStructure: Record<string, ShortcutItem[]> = {
  interactive: [
    { label: t("dialog.shortcuts.interactive.like"), key: "like" },
    { label: t("dialog.shortcuts.interactive.favorite"), key: "favorite" },
    { label: t("dialog.shortcuts.interactive.follow"), key: "follow" },
    { label: t("dialog.shortcuts.interactive.profile"), key: "profile" },
    { label: t("dialog.shortcuts.interactive.comment"), key: "comment" },
    { label: t("dialog.shortcuts.interactive.copyLink"), key: "copyLink" },
    { label: t("dialog.shortcuts.interactive.recommend"), key: "recommend" },
    { label: t("dialog.shortcuts.interactive.dislike"), key: "dislike" }
  ],
  playback: [
    { label: t("dialog.shortcuts.playback.toggleDanmaku"), key: "toggleDanmaku" },
    { label: t("dialog.shortcuts.playback.clearScreen"), key: "clearScreen" },
    { label: t("dialog.shortcuts.playback.autoPlay"), key: "autoPlay" },
    { label: t("dialog.shortcuts.playback.fullscreen"), key: "fullscreen" },
    { label: t("dialog.shortcuts.playback.watchLater"), key: "watchLater" },
    { label: t("dialog.shortcuts.playback.miniWindow"), key: "miniWindow" },
    { label: t("dialog.shortcuts.playback.volumeUp"), key: "volumeUp" },
    { label: t("dialog.shortcuts.playback.pageUp"), key: "pageUp" },
    { label: t("dialog.shortcuts.playback.forward"), key: "forward" },
    { label: t("dialog.shortcuts.playback.playPause"), key: "playPause" }
  ]
};

const tabs = [
  { id: "interactive", label: t("dialog.shortcuts.interactive.title") },
  { id: "playback", label: t("dialog.shortcuts.playback.title") }
];
let isClickScrolling = false;
let clickScrollTimer: ReturnType<typeof setTimeout> | null = null;

const activeTab = ref("interactive");
const tempShortcuts = ref<ShortcutConfig>({ ...DEFAULT_SHORTCUTS });
const recordingKey = ref<ShortcutKey | null>(null);
// 滚动条引用与状态控制
const scrollbarRef = ref<ScrollbarInst | null>(null);

const dialogVisible = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val)
});

/**
 * 点击左侧，滚动右侧到对应的分类组
 * @param tabId 分类ID
 */
const scrollToGroup = (tabId: string) => {
  activeTab.value = tabId;
  const el = document.getElementById(`shortcut-group-${tabId}`);
  if (el && scrollbarRef.value) {
    isClickScrolling = true;

    scrollbarRef.value.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });

    if (clickScrollTimer) clearTimeout(clickScrollTimer);
    clickScrollTimer = setTimeout(() => {
      isClickScrolling = false;
    }, 600);
  }
};

/**
 * 滚动右侧，高亮左侧对应的分类
 * @param e 滚动事件
 */
const handleScroll = (e: Event) => {
  if (isClickScrolling) return;

  const target = e.target as HTMLElement;
  const scrollTop = target.scrollTop;

  let currentId = tabs[0].id;
  for (let i = tabs.length - 1; i >= 0; i--) {
    const el = document.getElementById(`shortcut-group-${tabs[i].id}`);
    if (el && scrollTop >= el.offsetTop - 30) {
      currentId = tabs[i].id;
      break;
    }
  }

  if (activeTab.value !== currentId) {
    activeTab.value = currentId;
  }
};

/**
 * 格式化显示按键文本
 * @param key 按键字符串
 * @returns 格式化后的按键文本
 */
const formatKeyDisplay = (key: string) => {
  if (!key) return "";
  if (key === "volumeUp" || key === "Shift+") return "Shift + / Shift -";
  if (key === "pageUp" || key === "ArrowUp") return "↑ ↓";
  if (key === "forward" || key === "ArrowRight") return "← →";
  if (key === "Space" || key === " ") return t("dialog.shortcuts.space");
  return key;
};

/**
 * 开始记录按键
 * @param key 要记录的按键
 */
const startRecording = (key: ShortcutKey) => {
  if (["volumeUp", "pageUp", "forward"].includes(key)) {
    window.$message?.warning(t("dialog.shortcuts.msg.systemShortcut"));
    return;
  }
  recordingKey.value = key;
};

/**
 * 监听键盘事件，记录用户按键
 * @param e 键盘事件对象
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (!recordingKey.value) return;

  e.preventDefault();
  e.stopPropagation();

  if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key)) return;

  let newKey = e.key.toUpperCase();
  if (e.code === "Space") newKey = "Space";

  const isConflict = Object.values(tempShortcuts.value).includes(newKey);
  if (isConflict) {
    window.$message?.warning(t("dialog.shortcuts.msg.keyOccupied", { key: newKey }));
    recordingKey.value = null;
    return;
  }

  tempShortcuts.value[recordingKey.value] = newKey;
  recordingKey.value = null;
};

/** 回复默认快捷键 */
const restoreDefaults = () => {
  tempShortcuts.value = { ...DEFAULT_SHORTCUTS };
  window.$message?.success(t("dialog.shortcuts.msg.restoreDefaultSuccess"));
};

/** 保存快捷键配置 */
const handleSave = () => {
  emit("update:modelValue", { ...tempShortcuts.value });
  emit("save", { ...tempShortcuts.value });
  dialogVisible.value = false;
};

// 初始化数据
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      tempShortcuts.value = { ...props.modelValue };
      activeTab.value = "interactive";
      recordingKey.value = null;
      setTimeout(() => {
        scrollbarRef.value?.scrollTo({ top: 0 });
      }, 50);
    }
  }
);

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown, true);
});
</script>
