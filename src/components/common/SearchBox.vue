<template>
  <div class="relative w-[400px]">
    <div
      class="relative z-1 mx-auto flex w-full max-w-3xl items-center overflow-hidden rounded-lg border border-[--line-color] bg-[--bg-popover] transition-colors duration-300">
      <input
        type="text"
        class="py-1.7 h-full flex-1 rounded-l-md bg-transparent px-4 text-[--text-color] outline-none"
        v-model="searchQuery"
        :placeholder="$t('components.searchBox.placeholder')"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @keydown.enter="handleSearch" />

      <div
        v-if="searchQuery"
        class="absolute right-23 flex h-4 w-4 cursor-pointer items-center justify-center text-[--action-bar-icon-color] transition-colors hover:text-[--text-color]"
        @click="clearInput"
        @mousedown.stop>
        <i-mdi-close-circle-outline class="h-4 w-4" />
      </div>

      <div
        class="flex h-full items-center gap-1 border-l border-[--line-color] bg-[--text-color] px-4 py-2.5 whitespace-nowrap text-[--bg-popover] transition-opacity hover:opacity-90"
        @click="handleSearch">
        <i-mdi-magnify class="h-5 w-5" />
        <span class="text-[14px] font-medium">{{ $t("components.searchBox.search") }}</span>
      </div>
    </div>

    <div
      v-if="showDropdown"
      class="search-dropdown-container absolute top-full left-1/2 z-10 mt-1 w-full max-w-3xl -translate-x-1/2 transform overflow-hidden rounded-lg shadow-lg">
      <div
        class="search-dropdown border border-[--line-color] bg-[--bg-popover] p-4"
        @mousedown="handleDropdownMousedown">
        <div v-if="searchHistory.length > 0" class="mb-4">
          <div class="mb-2 flex-between-center">
            <span class="text-sm font-medium text-[--text-color]">{{ $t("components.searchBox.history") }}</span>
            <div
              class="flex cursor-pointer items-center gap-1 text-xs text-[--user-text-color] transition-colors hover:text-[--text-color]"
              @click="clearSearchHistory">
              <i-mdi-close-circle-outline class="h-3 w-3" />
              {{ $t("components.searchBox.clear") }}
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(item, index) in searchHistory"
              class="group relative flex cursor-pointer items-center rounded-full border border-[--line-color] bg-[--tray-bg-color] px-3 py-1 text-xs text-[--text-color] transition-colors hover:bg-[--tray-hover]"
              :key="index">
              <span @click="handleHistoryClick(item)">{{ item }}</span>
              <div
                class="ml-1 flex h-3 w-3 items-center justify-center rounded-full text-[--user-text-color] opacity-0 transition-colors group-hover:opacity-100 hover:bg-[--line-color] hover:text-[--text-color]"
                @click.stop="deleteSearchHistory(index)"
                @mousedown.stop>
                <i-mdi-close class="h-2.5 w-2.5" />
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="mb-2 flex-between-center">
            <span class="text-sm font-medium text-[--text-color]">{{ $t("components.searchBox.guess") }}</span>
            <div
              class="flex cursor-pointer items-center gap-1 text-xs text-[--user-text-color] transition-colors hover:text-[--text-color]"
              @click="handleRefreshSuggestions">
              <i-mdi-refresh class="h-3 w-3" :class="{ 'rotate-animation': isRefreshing }" />
              {{ $t("components.searchBox.refresh") }}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(item, index) in searchSuggestions"
              class="cursor-pointer truncate rounded px-2 py-1.5 text-sm transition-colors hover:bg-[--tray-hover]"
              :key="index"
              @click="handleSuggestionClick(item.content)">
              <span class="text-[--text-color]" :class="{ 'font-medium text-red-500': index < 2 }">
                {{ item.content }}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div class="mb-2 text-sm font-medium text-[--text-color]">{{ $t("components.searchBox.trending") }}</div>
          <div class="space-y-1">
            <div
              v-for="(item, index) in hotSearches"
              class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[--tray-hover]"
              :key="index"
              @click="handleTrendingClick(item.content)">
              <span
                class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[10px] font-medium"
                :class="index < 3 ? 'bg-red-500 text-white' : 'bg-[--line-color] text-[--user-text-color]'">
                {{ index + 1 }}
              </span>
              <span class="truncate text-sm text-[--text-color]">{{ item.content }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMitt } from "@/hooks/useMitt";
import { StorageKeyEnum, MittEnum } from "@/enums";
import { getHotSearchApi, getRecommendSearchApi } from "@/api/user";
import type { HotSearchItem, RecommendSearchItem } from "@/api/types.ts";

defineOptions({
  name: "SearchBox"
});

// 搜索查询
const searchQuery = ref("");
// 显示下拉框
const showDropdown = ref(false);
// 用于跟踪是否点击了下拉框内容
const isDropdownClicked = ref(false);
const isRefreshing = ref(false);

/**
 * 获取搜索历史记录
 * @returns 搜索历史记录数组
 */
const getSearchHistory = (): string[] => {
  const stored = localStorage.getItem(StorageKeyEnum.SEARCH_HISTORY);
  return stored ? JSON.parse(stored) : [];
};

const searchHistory = ref<string[]>(getSearchHistory());
// 搜索建议
const searchSuggestions = ref<RecommendSearchItem[]>([]);
// 最近热搜
const hotSearches = ref<HotSearchItem[]>([]);

/** 处理搜索 */
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    // 添加到搜索历史
    if (!searchHistory.value.includes(searchQuery.value)) {
      searchHistory.value.unshift(searchQuery.value);
      // 限制历史记录数量
      if (searchHistory.value.length > 10) {
        searchHistory.value.pop();
      }
    }
    // 发送搜索事件
    useMitt.emit(MittEnum.SEARCH, searchQuery.value);
    searchQuery.value = "";
    // 关闭下拉框
    showDropdown.value = false;
  }
};

/**
 * 处理历史记录点击
 * @param item 点击的历史记录项
 */
const handleHistoryClick = (item: string) => {
  searchQuery.value = item;
  handleSearch();
};

/**
 * 处理搜索建议点击
 * @param content 点击的搜索建议项内容
 */
const handleSuggestionClick = (content: string) => {
  searchQuery.value = content;
  handleSearch();
};

/**
 * 处理热搜点击
 * @param content 点击的热搜项内容
 */
const handleTrendingClick = (content: string) => {
  searchQuery.value = content;
  handleSearch();
};

/** 清除搜索历史 */
const clearSearchHistory = () => {
  searchHistory.value = [];
};

/**
 * 删除单个搜索历史
 * @param index 要删除的历史记录索引
 */
const deleteSearchHistory = (index: number) => {
  searchHistory.value.splice(index, 1);
};

/** 刷新搜索建议 */
const handleRefreshSuggestions = () => {
  // 如果已经在刷新中，则不作处理（防止重复点击）
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  fetchRecommendSearch().finally(() => {
    isRefreshing.value = false;
  });
};

/** 处理输入框失去焦点 */
const handleBlur = () => {
  setTimeout(() => {
    if (!isDropdownClicked.value) {
      showDropdown.value = false;
    }
    isDropdownClicked.value = false;
  }, 150);
};

/** 处理下拉框内容点击 */
const handleDropdownMousedown = () => {
  isDropdownClicked.value = true;
};

/** 清空输入框 */
const clearInput = () => {
  searchQuery.value = "";
};

/** 获取热搜 */
const fetchHotSearch = async () => {
  hotSearches.value = (await getHotSearchApi()) || [];
};

/** 获取推荐搜索 */
const fetchRecommendSearch = async () => {
  const res = await getRecommendSearchApi();
  if (res) {
    // 将isMostRecommend为true的项放在前面
    searchSuggestions.value = [
      ...res.filter((item) => item.isMostRecommend),
      ...res.filter((item) => !item.isMostRecommend)
    ];
  }
};

watch(
  searchHistory,
  (newHistory) => {
    localStorage.setItem(StorageKeyEnum.SEARCH_HISTORY, JSON.stringify(newHistory));
  },
  { deep: true }
);

onMounted(() => {
  fetchHotSearch();
  fetchRecommendSearch();
});
</script>

<style scoped>
.search-dropdown-container {
  z-index: 50;
}

.rotate-animation {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
