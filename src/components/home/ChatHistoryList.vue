<template>
  <div class="flex flex-col h-full bg-[--tray-bg-color]">
    <div class="p-3 flex items-center justify-between">
      <n-button
        v-if="!isCollapsed"
        type="primary"
        @click="handleNewChat"
        class="bg-[--btn-secondary-bg] text-[--text-color] hover:bg-[--btn-secondary-hover] border border-[--line-color] flex-1 mr-2 transition-colors">
        <template #icon>
          <i-mdi-plus class="w-4 h-4" />
        </template>
        {{ t("components.chatHistoryList.newChat") }}
      </n-button>

      <n-button
        quaternary
        circle
        :bordered="false"
        @click="emit('toggle-collapse')"
        class="flex-shrink-0 text-[--action-bar-icon-color] hover:text-[--text-color] hover:bg-[--tray-hover]">
        <i-mdi-chevron-right v-if="isCollapsed" class="w-4 h-4" />
        <i-mdi-chevron-left v-else class="w-4 h-4" />
      </n-button>
    </div>

    <div
      v-if="!isCollapsed"
      class="flex items-center justify-between px-3 py-2 border-y border-[--line-color] transition-colors"
      :class="{ 'bg-[--tray-hover]': isSelectionMode }">
      <template v-if="!isSelectionMode">
        <div class="flex items-center gap-2 text-sm font-medium text-[--user-text-color]">
          <i-mdi-history class="w-4 h-4" />
          <span>{{ t("components.chatHistoryList.history") }}</span>
        </div>
        <div class="flex items-center gap-1">
          <n-button
            quaternary
            circle
            size="small"
            class="text-[--action-bar-icon-color] hover:text-[--text-color]"
            :title="t('components.chatHistoryList.multiSelect')"
            @click="isSelectionMode = true">
            <i-mdi-playlist-check class="w-4 h-4" />
          </n-button>
          <n-dropdown trigger="click" placement="bottom-end" :options="clearMenuOptions" @select="handleMenuSelect">
            <n-button
              quaternary
              circle
              size="small"
              :bordered="false"
              class="text-[--action-bar-icon-color] hover:text-[--text-color] hover:bg-[--tray-hover]">
              <i-mdi-delete-outline class="w-4 h-4" />
            </n-button>
          </n-dropdown>
        </div>
      </template>

      <template v-else>
        <div class="flex items-center gap-2 text-sm font-medium text-[--user-text-color]">
          <n-checkbox :checked="isAllSelected" @update:checked="handleSelectAll" size="small" />
          <span class="text-xs">{{ t("components.chatHistoryList.selectedCount", { count: selectedIds.size }) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <n-button size="tiny" type="error" ghost :disabled="selectedIds.size === 0" @click="handleBatchDelete">
            {{ t("components.chatHistoryList.delete") }}
          </n-button>
          <n-button size="tiny" quaternary @click="cancelSelection">
            {{ t("components.common.cancel") }}
          </n-button>
        </div>
      </template>
    </div>

    <n-scrollbar v-if="!isCollapsed" class="flex-1">
      <div v-for="(group, index) in displayGroups" :key="index" class="p-3">
        <div class="text-xs text-[--user-text-color] mb-2 font-medium opacity-80">{{ group.date }}</div>

        <div v-for="(item, itemIndex) in group.items" :key="itemIndex">
          <chat-history-item
            :title="item.title"
            :active="item.id === activeChatId"
            :selection-mode="isSelectionMode"
            :selected="selectedIds.has(item.id)"
            :is-pinned="item.isPinned"
            @click="handleChatClick(item.id)"
            @enter-multi-select="handleEnterMultiSelect(item.id)"
            @toggle-select="handleToggleSelect(item.id)"
            @rename="handleRename(item.id, $event)"
            @toggle-pin="handleTogglePin(item.id)"
            @delete="handleDelete(item.id)" />
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineOptions({
  name: "ChatHistoryList"
});

const { t } = useI18n();

defineProps<{
  activeChatId?: string;
  isCollapsed?: boolean;
}>();
const emit = defineEmits<{
  "new-chat": [];
  "select-chat": [id: string];
  "rename-chat": [id: string, newTitle: string];
  "toggle-pin-chat": [id: string, isPinned: boolean];
  "delete-chat": [id: string];
  "batch-delete-chat": [ids: string[]];
  "clear-all": [];
  "toggle-collapse": [];
}>();

interface ChatItem {
  id: string;
  title: string;
  date: string;
  isPinned?: boolean;
}

// 定义日期分组类型
interface HistoryGroup {
  date: string;
  items: ChatItem[];
}

// 清空历史下拉菜单选项
const clearMenuOptions = [
  {
    label: t("components.chatHistoryList.clearAll"),
    key: "clear"
  }
];

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

const isSelectionMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());

// 扁平化获取所有历史记录 ID，用于全选
const allChatIds = computed(() => {
  return historyGroups.value.flatMap((group) => group.items.map((item) => item.id));
});

// 是否全选状态
const isAllSelected = computed(() => {
  return allChatIds.value.length > 0 && selectedIds.value.size === allChatIds.value.length;
});

const displayGroups = computed(() => {
  const pinnedItems: ChatItem[] = [];
  const regularGroups: HistoryGroup[] = [];

  // 遍历所有历史记录，将置顶的单独抽出
  historyGroups.value.forEach((group) => {
    const unpinnedItems: ChatItem[] = [];
    group.items.forEach((item) => {
      if (item.isPinned) {
        pinnedItems.push(item);
      } else {
        unpinnedItems.push(item);
      }
    });
    // 只保留还有非置顶数据的普通日期分组
    if (unpinnedItems.length > 0) {
      regularGroups.push({ ...group, items: unpinnedItems });
    }
  });

  const result: HistoryGroup[] = [];
  // 如果存在置顶项目，将其作为第一个分组压入
  if (pinnedItems.length > 0) {
    result.push({ date: t("components.chatHistoryList.pinned"), items: pinnedItems });
  }
  // 追加其他普通日期分组
  result.push(...regularGroups);

  return result;
});

/**
 * 处理置顶/取消置顶
 * @param id 对话ID
 */
const handleTogglePin = (id: string) => {
  historyGroups.value.forEach((group) => {
    const item = group.items.find((i) => i.id === id);
    if (item) {
      item.isPinned = !item.isPinned;
      // 通知外层（或后端）状态改变
      emit("toggle-pin-chat", id, item.isPinned);
    }
  });
};

/** 处理退出多选模式 */
const cancelSelection = () => {
  isSelectionMode.value = false;
  selectedIds.value.clear();
};

/**
 * 切换单个选中状态
 * @param id 对话ID
 */
const handleToggleSelect = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
};

/**
 * 处理全选/取消全选
 * @param checked 是否选中
 */
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedIds.value = new Set(allChatIds.value);
  } else {
    selectedIds.value.clear();
  }
};

/** 处理批量删除选中对话 */
const handleBatchDelete = () => {
  window.$dialog.warning({
    content: t("components.chatHistoryList.deleteSelected", { count: selectedIds.value.size }),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 1. 本地更新视图
      historyGroups.value = historyGroups.value
        .map((group) => {
          return {
            ...group,
            items: group.items.filter((item) => !selectedIds.value.has(item.id))
          };
        })
        .filter((group) => group.items.length > 0);
      // 2. 派发事件通知外层或接口
      emit("batch-delete-chat", Array.from(selectedIds.value));
      // 3. 退出多选模式
      cancelSelection();
    }
  });
};

/**
 * 处理从右键菜单进入多选模式
 * @param id 对话ID
 */
const handleEnterMultiSelect = (id: string) => {
  isSelectionMode.value = true;
  // 自动勾选当前触发右键菜单的那一项，体验更好
  selectedIds.value.add(id);
};

/** 处理新建对话 */
const handleNewChat = () => {
  emit("new-chat");
};

/**
 * 处理选择对话
 * @param id 对话ID
 */
const handleChatClick = (id: string) => {
  emit("select-chat", id);
};

/**
 * 处理重命名对话
 * @param id 对话ID
 * @param newTitle 新标题
 */
const handleRename = (id: string, newTitle: string) => {
  // 本地更新对话标题
  historyGroups.value.forEach((group) => {
    const item = group.items.find((item) => item.id === id);
    if (item) {
      item.title = newTitle;
    }
  });
  emit("rename-chat", id, newTitle);
};

/**
 * 处理菜单选择（用于清空历史）
 * @param key 菜单键值
 */
const handleMenuSelect = (key: string) => {
  if (key === "clear") {
    handleClearAll();
  }
};

/**
 * 处理删除对话
 * @param id 对话ID
 */
const handleDelete = (id: string) => {
  window.$dialog.warning({
    content: t("components.chatHistoryList.deleteConfirm"),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 本地删除对话
      historyGroups.value = historyGroups.value
        .map((group) => {
          const newItems = group.items.filter((item) => item.id !== id);
          return {
            ...group,
            items: newItems
          };
        })
        .filter((group) => group.items.length > 0); // 过滤掉空分组
      console.log("对话已删除:", id);
      emit("delete-chat", id);
    }
  });
};

/** 处理清空所有历史 */
const handleClearAll = () => {
  window.$dialog.warning({
    content: t("components.chatHistoryList.clearAllConfirm"),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 本地清空所有历史
      historyGroups.value = [];
      console.log("所有历史对话已清空");
      emit("clear-all");
    }
  });
};
</script>

<style scoped lang="scss">
:deep(.n-checkbox .n-checkbox-box) {
  border-radius: 2px;
}
</style>
