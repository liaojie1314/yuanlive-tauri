<template>
  <context-menu :menu="selectionMode ? [] : contextMenuOptions" @select="handleContextMenuSelect">
    <div class="group relative px-2 py-1">
      <div
        class="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors duration-200"
        :class="[
          /* 多选模式下不显示高亮背景，防止视觉干扰 */
          active && !selectionMode ? 'bg-[--bg-left-active]' : 'hover:bg-[--tray-hover]'
        ]"
        @click="selectionMode ? $emit('toggle-select') : $emit('click')">
        <div v-if="selectionMode" class="flex flex-shrink-0 items-center" @click.stop="$emit('toggle-select')">
          <n-checkbox size="small" :checked="selected" />
        </div>

        <div v-if="!isRenaming" class="flex min-w-0 flex-1 items-center">
          <div
            class="truncate text-sm transition-colors select-none"
            :class="[active && !selectionMode ? 'font-medium text-[--left-active-text-color]' : 'text-[--text-color]']">
            {{ title }}
          </div>
          <i-mdi-pin v-if="isPinned" class="ml-2 h-3 w-3 flex-shrink-0 text-[--action-bar-icon-color] opacity-70" />
        </div>

        <div v-else class="flex-1" @click.stop>
          <n-input
            size="tiny"
            ref="renameInputRef"
            class="w-full"
            v-model:value="editTitle"
            @blur="handleRenameCancel"
            @keyup.enter="handleRenameConfirm" />
        </div>

        <n-dropdown
          v-if="!selectionMode"
          trigger="click"
          placement="bottom-start"
          :options="menuOptions"
          :show-arrow="false"
          @select="handleMenuSelect"
          @click.stop>
          <div
            class="flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-colors group-hover:opacity-100"
            :class="[
              active ? 'text-[--left-active-text-color] opacity-100' : 'text-[--action-bar-icon-color]',
              'hover:bg-[--tray-hover]'
            ]">
            <i-mdi-dots-vertical class="h-4 w-4" />
          </div>
        </n-dropdown>
      </div>
    </div>
  </context-menu>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { NInput } from "naive-ui";

const { t } = useI18n();

const props = defineProps<{
  title: string;
  id?: string;
  active?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  isPinned?: boolean;
}>();

const emit = defineEmits<{
  (e: "click"): void;
  (e: "toggle-select"): void;
  (e: "enter-multi-select"): void;
  (e: "rename", newTitle: string): void;
  (e: "toggle-pin"): void;
  (e: "delete"): void;
}>();

const isRenaming = ref(false);
const editTitle = ref(props.title);
const renameInputRef = ref<InstanceType<typeof NInput> | null>(null);

const menuOptions = computed(() => [
  { label: t("components.contextMenu.multi-select"), key: "multi-select" },
  { label: t("components.contextMenu.rename"), key: "rename" },
  { label: props.isPinned ? t("components.contextMenu.unpin") : t("components.contextMenu.pin"), key: "toggle-pin" },
  { label: t("components.contextMenu.delete"), key: "delete" }
]);

const contextMenuOptions = computed(() => [
  { label: t("components.contextMenu.multi-select"), key: "multi-select" },
  { label: t("components.contextMenu.rename"), key: "rename" },
  { label: props.isPinned ? t("components.contextMenu.unpin") : t("components.contextMenu.pin"), key: "toggle-pin" },
  { label: t("components.contextMenu.delete"), key: "delete", disabled: false }
]);

/**
 * 处理菜单选择
 * @param key 菜单选项的key
 */
const handleMenuSelect = (key: string) => executeAction(key);

/**
 * 处理上下文菜单选择
 * @param item 上下文菜单选项
 */
const handleContextMenuSelect = (item: any) => {
  if (item && item.key) executeAction(item.key);
};

/**
 * 执行菜单操作
 * @param key 菜单选项的key
 */
const executeAction = (key: string) => {
  switch (key) {
    case "multi-select":
      emit("enter-multi-select");
      break;
    case "rename":
      handleRenameClick();
      break;
    case "toggle-pin":
      emit("toggle-pin");
      break;
    case "delete":
      emit("delete");
      break;
  }
};

/** 处理重命名点击 */
const handleRenameClick = () => {
  isRenaming.value = true;
  editTitle.value = props.title;
  nextTick(() => renameInputRef.value?.focus());
};

/** 处理重命名确认 */
const handleRenameConfirm = () => {
  const newTitle = editTitle.value.trim();
  if (newTitle && newTitle !== props.title) emit("rename", newTitle);
  isRenaming.value = false;
};

/** 处理重命名取消 */
const handleRenameCancel = () => {
  isRenaming.value = false;
  editTitle.value = props.title;
};
</script>

<style scoped lang="scss">
:deep(.n-checkbox .n-checkbox-box) {
  border-radius: 2px;
}
</style>
