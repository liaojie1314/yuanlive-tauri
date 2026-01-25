<template>
  <div class="relative group">
    <!-- 对话标题 -->
    <div
      class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      :class="{ 'bg-blue-50': active }"
      @click="$emit('click')">
      <!-- 标题显示或编辑模式 -->
      <div v-if="!isRenaming" class="text-sm text-gray-800 truncate">{{ title }}</div>
      <div v-else class="flex-1">
        <n-input
          v-model:value="editTitle"
          class="w-full"
          :size="'small'"
          @blur="handleRenameCancel"
          @keyup.enter="handleRenameConfirm"
          ref="renameInputRef" />
      </div>

      <!-- 操作菜单按钮 -->
      <n-dropdown
        :options="menuOptions"
        trigger="hover"
        :show-arrow="false"
        placement="right-start"
        @select="handleMenuSelect">
        <div class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <i-mdi-dots-vertical class="w-4 h-4" />
        </div>
      </n-dropdown>
    </div>
  </div>
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

// 定义操作菜单选项
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

// 处理菜单选项选择
const handleMenuSelect = (key: string) => {
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
