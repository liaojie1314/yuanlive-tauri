<template>
  <div class="flex h-full flex-col bg-[--tray-bg-color]">
    <div class="flex-between-center p-3">
      <n-button
        v-if="!isCollapsed"
        type="primary"
        class="mr-2 flex-1 border border-[--line-color] bg-[--btn-secondary-bg] text-[--text-color] transition-colors hover:bg-[--btn-secondary-hover]"
        @click="handleNewChat">
        <template #icon>
          <i-mdi-plus class="h-4 w-4" />
        </template>
        {{ t("components.chatHistoryList.newChat") }}
      </n-button>

      <n-button
        quaternary
        circle
        class="flex-shrink-0 text-[--action-bar-icon-color] hover:bg-[--tray-hover] hover:text-[--text-color]"
        :bordered="false"
        @click="emit('toggle-collapse')">
        <i-mdi-chevron-right v-if="isCollapsed" class="h-4 w-4" />
        <i-mdi-chevron-left v-else class="h-4 w-4" />
      </n-button>
    </div>

    <div
      v-if="!isCollapsed"
      class="flex-between-center border-y border-[--line-color] px-3 py-2 transition-colors"
      :class="{ 'bg-[--tray-hover]': isSelectionMode }">
      <template v-if="!isSelectionMode">
        <div class="flex-y-center gap-2 text-sm font-medium text-[--user-text-color]">
          <i-mdi-history class="h-4 w-4" />
          <span>{{ t("components.chatHistoryList.history") }}</span>
        </div>
        <div class="flex-y-center gap-1">
          <n-button
            quaternary
            circle
            size="small"
            class="text-[--action-bar-icon-color] hover:text-[--text-color]"
            :title="t('components.chatHistoryList.multiSelect')"
            @click="isSelectionMode = true">
            <i-mdi-playlist-check class="h-4 w-4" />
          </n-button>
          <n-dropdown trigger="click" placement="bottom-end" :options="clearMenuOptions" @select="handleMenuSelect">
            <n-button
              quaternary
              circle
              size="small"
              class="text-[--action-bar-icon-color] hover:bg-[--tray-hover] hover:text-[--text-color]"
              :bordered="false">
              <i-mdi-delete-outline class="h-4 w-4" />
            </n-button>
          </n-dropdown>
        </div>
      </template>

      <template v-else>
        <div class="flex-y-center gap-2 text-sm font-medium text-[--user-text-color]">
          <n-checkbox size="small" :checked="isAllSelected" @update:checked="handleSelectAll" />
          <span class="text-xs">{{ t("components.chatHistoryList.selectedCount", { count: selectedIds.size }) }}</span>
        </div>
        <div class="flex-y-center gap-2">
          <n-button size="tiny" type="error" ghost :disabled="selectedIds.size === 0" @click="handleBatchDelete">
            {{ t("components.chatHistoryList.delete") }}
          </n-button>
          <n-button size="tiny" quaternary @click="cancelSelection">
            {{ t("components.common.cancel") }}
          </n-button>
        </div>
      </template>
    </div>

    <n-scrollbar v-if="!isCollapsed" class="flex-1" @scroll="handleScroll">
      <div v-for="(group, index) in displayGroups" class="p-3" :key="index">
        <div class="mb-2 text-xs font-medium text-[--user-text-color] opacity-80">{{ group.date }}</div>

        <div v-for="(item, itemIndex) in group.items" :key="itemIndex">
          <chat-history-item
            :title="item.title"
            :time="formatTimeAgo(item.timestamp)"
            :active="item.id === activeChatId"
            :selection-mode="isSelectionMode"
            :selected="selectedIds.has(item.id)"
            :is-pinned="item.isPin"
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

import { useBatchTimeAgo } from "@/hooks/useTimeAgo";
import {
  getHistoryConversationApi,
  updateConversationTitleApi,
  pinConversationApi,
  unpinConversationApi,
  batchDeleteConversationApi,
  deleteAllConversationApi
} from "@/api/aiHistory";

defineOptions({
  name: "ChatHistoryList"
});

const { t } = useI18n();
const { formatTimeAgo, formatGroupDate } = useBatchTimeAgo();

defineProps<{
  activeChatId?: string;
  isCollapsed?: boolean;
}>();
const emit = defineEmits<{
  "new-chat": [];
  "select-chat": [id: string];
  "toggle-collapse": [];
}>();

interface ChatItem {
  id: string;
  title: string;
  timestamp: number;
  isPin?: boolean;
}

// 定义日期分组类型
interface HistoryGroup {
  date: string;
  items: ChatItem[];
}

// 历史对话数据
const historyGroups = ref<HistoryGroup[]>([]);
const isSelectionMode = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const pageNum = ref(1);
const pageSize = ref(20);
const isLoading = ref(false);
const hasMore = ref(true);

// 清空历史下拉菜单选项
const clearMenuOptions = computed(() => [
  {
    label: t("components.chatHistoryList.clearAll"),
    key: "clear"
  }
]);
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
      if (item.isPin) {
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
  historyGroups.value.forEach(async (group) => {
    const item = group.items.find((i) => i.id === id);
    if (item) {
      let res: { isPin: boolean };
      if (item.isPin) {
        res = await pinConversationApi(id);
      } else {
        res = await unpinConversationApi(id);
      }
      item.isPin = res.isPin || item.isPin;
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
    title: t("components.common.confirmDelete"),
    content: t("components.chatHistoryList.deleteSelected", { count: selectedIds.value.size }),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 1. 本地更新视图
      batchDeleteConversationApi(Array.from(selectedIds.value))
        .then(() => {
          historyGroups.value = historyGroups.value
            .map((group) => {
              return {
                ...group,
                items: group.items.filter((item) => !selectedIds.value.has(item.id))
              };
            })
            .filter((group) => group.items.length > 0);
          window.$message.success(t("components.chatHistoryList.msg.deleteSuccess"));
        })
        .catch(() => {
          window.$message.error(t("components.chatHistoryList.msg.deleteFailed"));
        })
        .finally(() => {
          // 退出多选模式
          cancelSelection();
        });
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

/** 加载历史对话列表 */
const loadHistoryList = async () => {
  if (isLoading.value || !hasMore.value) return;
  isLoading.value = true;
  try {
    const res = await getHistoryConversationApi(pageNum.value, pageSize.value);
    const records = res.list || [];
    if (records.length < pageSize.value) {
      hasMore.value = false; // 如果拉取的数据少于一页，说明到底了
    }
    records.forEach((apiItem) => {
      const newItem: ChatItem = {
        id: apiItem.id,
        title: apiItem.title,
        timestamp: apiItem.timestamp,
        isPin: apiItem.isTop
      };

      const groupDate = formatGroupDate(apiItem.timestamp);

      if (historyGroups.value.length === 0) {
        historyGroups.value.push({ date: groupDate, items: [newItem] });
      } else {
        const lastGroup = historyGroups.value[historyGroups.value.length - 1];
        if (lastGroup.date === groupDate) {
          lastGroup.items.push(newItem);
        } else {
          historyGroups.value.push({ date: groupDate, items: [newItem] });
        }
      }
    });

    pageNum.value++; // 成功后页码 +1
  } catch (error) {
    console.error("获取历史会话失败:", error);
  } finally {
    isLoading.value = false;
  }
};

/**
 * 处理滚动事件：触底加载更多
 * @param e 滚动事件对象
 */
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  // 触底缓冲距离：距离底部还剩 50px 时触发加载
  const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
  if (distanceToBottom < 50) {
    loadHistoryList();
  }
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
  historyGroups.value.forEach((group) => {
    const item = group.items.find((item) => item.id === id);
    if (item) {
      updateConversationTitleApi(id, newTitle).then(() => {
        item.title = newTitle;
      });
    }
  });
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
    title: t("components.common.confirmDelete"),
    content: t("components.chatHistoryList.deleteConfirm"),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 本地删除对话
      batchDeleteConversationApi([id])
        .then(() => {
          historyGroups.value = historyGroups.value
            .map((group) => {
              const newItems = group.items.filter((item) => item.id !== id);
              return {
                ...group,
                items: newItems
              };
            })
            .filter((group) => group.items.length > 0); // 过滤掉空分组
          window.$message.success(t("components.chatHistoryList.msg.deleteSuccess"));
        })
        .catch(() => {
          window.$message.error(t("components.chatHistoryList.msg.deleteFailed"));
        });
    }
  });
};

/** 处理清空所有历史 */
const handleClearAll = () => {
  window.$dialog.warning({
    title: t("components.common.confirmDelete"),
    content: t("components.chatHistoryList.clearAllConfirm"),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      // 本地清空所有历史
      deleteAllConversationApi()
        .then(() => {
          historyGroups.value = [];
          window.$message.success(t("components.chatHistoryList.msg.clearAllSuccess"));
        })
        .catch(() => {
          window.$message.error(t("components.chatHistoryList.msg.clearAllFailed"));
        });
    }
  });
};

onMounted(async () => {
  loadHistoryList();
});
</script>

<style scoped lang="scss">
:deep(.n-checkbox .n-checkbox-box) {
  border-radius: 2px;
}
</style>
