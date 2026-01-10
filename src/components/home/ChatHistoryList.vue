<template>
  <div class="flex flex-col h-full">
    <!-- 新建对话按钮和折叠图标 -->
    <div class="p-3 flex items-center justify-between">
      <n-button
        v-if="!isCollapsed"
        type="primary"
        @click="handleNewChat"
        class="bg-blue-50 text-blue-600 hover:bg-blue-100 flex-1 mr-2">
        <template #icon>
          <i-mdi-plus class="w-4 h-4" />
        </template>
        新建对话
      </n-button>
      <!-- 折叠图标按钮 -->
      <n-button quaternary circle :bordered="false" @click="emit('toggle-collapse')" class="flex-shrink-0">
        <i-mdi-chevron-right v-if="isCollapsed" class="w-4 h-4" />
        <i-mdi-chevron-left v-else class="w-4 h-4" />
      </n-button>
    </div>

    <!-- 历史对话标题 -->
    <div v-if="!isCollapsed" class="flex items-center justify-between px-3 py-2 border-y border-gray-200">
      <div class="flex items-center gap-2 text-sm font-medium">
        <i-mdi-history class="w-4 h-4" />
        <span>历史对话</span>
      </div>
      <n-dropdown trigger="click" placement="bottom-end" :options="clearMenuOptions">
        <n-button quaternary circle :bordered="false">
          <i-mdi-delete-outline class="w-4 h-4" />
        </n-button>
      </n-dropdown>
    </div>

    <!-- 历史对话列表 -->
    <n-scrollbar v-if="!isCollapsed" class="flex-1">
      <!-- 日期分组 -->
      <div v-for="(group, index) in historyGroups" :key="index" class="p-3">
        <div class="text-xs text-gray-500 mb-2">{{ group.date }}</div>

        <!-- 对话项 -->
        <div v-for="(item, itemIndex) in group.items" :key="itemIndex" class="mb-1">
          <chat-history-item
            :title="item.title"
            :active="item.id === activeChatId"
            @click="handleChatClick(item.id)"
            @rename="handleRename(item.id)"
            @share="handleShare(item.id)"
            @delete="handleDelete(item.id)" />
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import ChatHistoryItem from "./ChatHistoryItem.vue";
import { NButton, NDropdown, NScrollbar } from "naive-ui";

// 定义对话项类型
interface ChatItem {
  id: string;
  title: string;
  date: string;
}

// 定义日期分组类型
interface HistoryGroup {
  date: string;
  items: ChatItem[];
}

// Props
const props = defineProps<{
  activeChatId?: string;
  isCollapsed?: boolean;
}>();

// 使用props避免未使用警告
const { activeChatId } = props;

// Emits
const emit = defineEmits<{
  "new-chat": [];
  "select-chat": [id: string];
  "rename-chat": [id: string];
  "share-chat": [id: string];
  "delete-chat": [id: string];
  "clear-all": [];
  "toggle-collapse": [];
}>();

// 模拟历史对话数据
const historyGroups = ref<HistoryGroup[]>([
  {
    date: "12月26日",
    items: [
      { id: "1", title: "马航MH370的真相是什么", date: "2023-12-26" },
      { id: "2", title: "如何学习Vue 3", date: "2023-12-26" },
      { id: "3", title: "推荐几本技术书籍", date: "2023-12-26" }
    ]
  },
  {
    date: "12月25日",
    items: [
      { id: "4", title: "AI的未来发展趋势", date: "2023-12-25" },
      { id: "5", title: "什么是量子计算", date: "2023-12-25" },
      { id: "6", title: "AI在医疗领域的应用", date: "2023-12-25" },
      { id: "7", title: "推荐几本技术书籍", date: "2023-12-25" },
      { id: "8", title: "最新的AI研究动态", date: "2023-12-25" },
      { id: "9", title: "AI在教育领域的应用", date: "2023-12-25" },
      { id: "10", title: "推荐几本技术书籍", date: "2023-12-25" },
      { id: "11", title: "最新的AI研究动态", date: "2023-12-25" },
      { id: "12", title: "AI在教育领域的应用", date: "2023-12-25" }
    ]
  }
]);

// 处理新建对话
const handleNewChat = () => {
  emit("new-chat");
};

// 处理选择对话
const handleChatClick = (id: string) => {
  emit("select-chat", id);
};

// 处理重命名对话
const handleRename = (id: string) => {
  emit("rename-chat", id);
};

// 处理分享对话
const handleShare = (id: string) => {
  emit("share-chat", id);
};

// 处理删除对话
const handleDelete = (id: string) => {
  emit("delete-chat", id);
};

// 处理清空所有历史
const handleClearAll = () => {
  emit("clear-all");
};

// 清空历史下拉菜单选项
const clearMenuOptions = [
  {
    label: "清空所有历史",
    key: "clear",
    onClick: handleClearAll
  }
];
</script>
