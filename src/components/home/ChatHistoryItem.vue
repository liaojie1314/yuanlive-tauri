<template>
  <context-menu :menu="selectionMode ? [] : contextMenuOptions" @select="handleContextMenuSelect">
    <div class="relative group px-2 py-1">
      <div
        class="flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 gap-2"
        :class="[
          /* 多选模式下不显示高亮背景，防止视觉干扰 */
          active && !selectionMode ? 'bg-[--bg-left-active]' : 'hover:bg-[--tray-hover]'
        ]"
        @click="selectionMode ? $emit('toggle-select') : $emit('click')">
        <div v-if="selectionMode" class="flex-shrink-0 flex items-center" @click.stop="$emit('toggle-select')">
          <n-checkbox :checked="selected" size="small" />
        </div>

        <div v-if="!isRenaming" class="flex items-center flex-1 min-w-0">
          <div
            class="text-sm truncate select-none transition-colors"
            :class="[active && !selectionMode ? 'text-[--left-active-text-color] font-medium' : 'text-[--text-color]']">
            {{ title }}
          </div>
          <i-mdi-pin class="w-3 h-3 ml-2 flex-shrink-0 text-[--action-bar-icon-color] opacity-70" v-if="isPinned" />
        </div>

        <div v-else class="flex-1" @click.stop>
          <n-input
            v-model:value="editTitle"
            class="w-full"
            size="tiny"
            @blur="handleRenameCancel"
            @keyup.enter="handleRenameConfirm"
            ref="renameInputRef" />
        </div>

        <n-dropdown
          v-if="!selectionMode"
          trigger="click"
          :options="menuOptions"
          :show-arrow="false"
          placement="bottom-start"
          @select="handleMenuSelect"
          @click.stop>
          <div
            class="w-6 h-6 flex items-center justify-center rounded-md transition-colors opacity-0 group-hover:opacity-100"
            :class="[
              active ? 'opacity-100 text-[--left-active-text-color]' : 'text-[--action-bar-icon-color]',
              'hover:bg-[--tray-hover]'
            ]">
            <i-mdi-dots-vertical class="w-4 h-4" />
          </div>
        </n-dropdown>
      </div>
    </div>
  </context-menu>
</template>

<script setup lang="ts">
import type { NInput } from "naive-ui";

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
  { label: "多选", key: "multi-select" },
  { label: "重命名", key: "rename" },
  { label: props.isPinned ? "取消置顶" : "置顶", key: "toggle-pin" },
  { label: "删除", key: "delete" }
]);

const contextMenuOptions = computed(() => [
  { label: "多选", key: "multi-select" },
  { label: "重命名", key: "rename" },
  { label: props.isPinned ? "取消置顶" : "置顶", key: "toggle-pin" },
  { label: "删除", key: "delete", disabled: false }
]);

const handleMenuSelect = (key: string) => executeAction(key);
const handleContextMenuSelect = (item: any) => {
  if (item && item.key) executeAction(item.key);
};

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

const handleRenameClick = () => {
  isRenaming.value = true;
  editTitle.value = props.title;
  nextTick(() => renameInputRef.value?.focus());
};

const handleRenameConfirm = () => {
  const newTitle = editTitle.value.trim();
  if (newTitle && newTitle !== props.title) emit("rename", newTitle);
  isRenaming.value = false;
};

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
