<template>
  <context-menu :menu="contextMenuOptions" @select="handleContextMenuSelect">
    <div class="relative group px-2 py-1">
      <div
        class="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200"
        :class="[
          /* 悬停和激活状态背景适配 */
          active ? 'bg-[--bg-left-active]' : 'hover:bg-[--tray-hover]'
        ]"
        @click="$emit('click')">
        <div
          v-if="!isRenaming"
          class="text-sm truncate select-none transition-colors"
          :class="[
            /* 文字颜色适配 */
            active ? 'text-[--left-active-text-color] font-medium' : 'text-[--text-color]'
          ]">
          {{ title }}
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
          trigger="click"
          :options="menuOptions"
          :show-arrow="false"
          placement="bottom-start"
          @select="handleMenuSelect"
          @click.stop>
          <div
            class="w-6 h-6 flex items-center justify-center rounded-md transition-colors opacity-0 group-hover:opacity-100"
            :class="[
              /* 激活状态下图标常驻显示，否则只在 group-hover 显示 */
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
const props = defineProps<{
  title: string;
  id?: string;
  active?: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  (e: "click"): void;
  (e: "rename", newTitle: string): void;
  (e: "share"): void;
  (e: "delete"): void;
}>();

// 重命名状态
const isRenaming = ref(false);
// 编辑标题
const editTitle = ref(props.title);
// 重命名输入框引用
const renameInputRef = ref<InstanceType<typeof NInput> | null>(null);

// 1. 定义操作菜单选项 (Naive UI Dropdown 使用)
const menuOptions = [
  {
    label: "重命名",
    key: "rename"
  },
  {
    label: "分享",
    key: "share"
  },
  {
    label: "删除",
    key: "delete"
  }
];

// 2. 定义右键菜单选项 (ContextMenu 组件使用)
const contextMenuOptions = [
  {
    label: "重命名",
    key: "rename"
  },
  {
    label: "分享",
    key: "share"
  },
  {
    label: "删除",
    key: "delete",
    disabled: false // 可以根据需要设置是否禁用
  }
];

// 处理菜单选项选择 (下拉菜单)
const handleMenuSelect = (key: string) => {
  executeAction(key);
};

// 3. 处理右键菜单选择
// 注意：ContextMenu 组件的 select 事件通常返回点击的 item 对象
const handleContextMenuSelect = (item: any) => {
  if (item && item.key) {
    executeAction(item.key);
  }
};

// 4. 统一执行动作的函数
const executeAction = (key: string) => {
  switch (key) {
    case "rename":
      handleRenameClick();
      break;
    case "share":
      emit("share");
      break;
    case "delete":
      emit("delete");
      break;
  }
};

// 开始重命名
const handleRenameClick = () => {
  isRenaming.value = true;
  editTitle.value = props.title;
  // 等待DOM更新后聚焦输入框
  nextTick(() => {
    renameInputRef.value?.focus();
  });
};

// 确认重命名
const handleRenameConfirm = () => {
  const newTitle = editTitle.value.trim();
  if (newTitle && newTitle !== props.title) {
    emit("rename", newTitle);
  }
  isRenaming.value = false;
};

// 取消重命名
const handleRenameCancel = () => {
  isRenaming.value = false;
  editTitle.value = props.title;
};
</script>
