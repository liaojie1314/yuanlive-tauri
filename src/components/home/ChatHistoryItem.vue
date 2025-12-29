<template>
  <div class="relative group">
    <!-- 对话标题 -->
    <div
      class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      :class="{ 'bg-blue-50': active }"
      @click="$emit('click')">
      <div class="text-sm text-gray-800 truncate">{{ title }}</div>

      <!-- 操作菜单按钮 -->
      <n-dropdown
        :options="menuOptions"
        trigger="hover"
        :show-arrow="false"
        placement="right-start"
        @select="handleMenuSelect">
        <button
          class="w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </n-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NDropdown } from "naive-ui";
// 定义组件属性
defineProps<{
  title: string;
  id?: string;
  active?: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  (e: "click"): void;
  (e: "rename"): void;
  (e: "share"): void;
  (e: "delete"): void;
}>();

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
      emit("rename");
      break;
    case "share":
      emit("share");
      break;
    case "delete":
      emit("delete");
      break;
  }
};
</script>
