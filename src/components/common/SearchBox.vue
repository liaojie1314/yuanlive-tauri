<template>
  <div class="w-[400px] relative">
    <div
      class="relative z-1 flex items-center bg-[--bg-popover] rounded-lg border border-[--line-color] overflow-hidden w-full max-w-3xl mx-auto transition-colors duration-300">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="$t('components.searchBox.placeholder')"
        class="flex-1 px-4 py-1.7 text-[--text-color] bg-transparent rounded-l-md outline-none h-full"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @keydown.enter="handleSearch" />

      <div
        v-if="searchQuery"
        class="w-4 h-4 absolute right-23 text-[--action-bar-icon-color] hover:text-[--text-color] transition-colors cursor-pointer flex items-center justify-center"
        @click="clearInput"
        @mousedown.stop>
        <i-mdi-close-circle-outline class="w-4 h-4" />
      </div>

      <div
        class="bg-[--text-color] text-[--bg-popover] px-4 py-2.5 flex items-center gap-1 hover:opacity-90 transition-opacity h-full whitespace-nowrap border-l border-[--line-color]"
        @click="handleSearch">
        <i-mdi-magnify class="w-5 h-5" />
        <span class="text-[14px] font-medium">{{ $t("components.searchBox.search") }}</span>
      </div>
    </div>

    <div
      v-if="showDropdown"
      class="search-dropdown-container absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-10 w-full max-w-3xl shadow-lg rounded-lg overflow-hidden">
      <div
        class="search-dropdown bg-[--bg-popover] p-4 border border-[--line-color]"
        @mousedown="handleDropdownMousedown">
        <div v-if="searchHistory.length > 0" class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-[--text-color] font-medium text-sm">{{ $t("components.searchBox.history") }}</span>
            <div
              class="text-xs text-[--user-text-color] hover:text-[--text-color] flex items-center gap-1 transition-colors cursor-pointer"
              @click="clearSearchHistory">
              <i-mdi-close-circle-outline class="w-3 h-3" />
              {{ $t("components.searchBox.clear") }}
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(item, index) in searchHistory"
              :key="index"
              class="relative group px-3 py-1 bg-[--tray-bg-color] text-[--text-color] rounded-full text-xs cursor-pointer hover:bg-[--tray-hover] transition-colors flex items-center border border-[--line-color]">
              <span @click="handleHistoryClick(item)">{{ item }}</span>
              <div
                class="ml-1 w-3 h-3 rounded-full hover:bg-[--line-color] text-[--user-text-color] hover:text-[--text-color] transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                @click.stop="deleteSearchHistory(index)"
                @mousedown.stop>
                <i-mdi-close class="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-[--text-color] font-medium text-sm">{{ $t("components.searchBox.guess") }}</span>
            <div
              class="text-xs text-[--user-text-color] hover:text-[--text-color] flex items-center gap-1 transition-colors cursor-pointer"
              @click="handleRefreshSuggestions">
              <i-mdi-refresh class="w-3 h-3" />
              {{ $t("components.searchBox.refresh") }}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(item, index) in searchSuggestions"
              :key="index"
              class="py-1.5 px-2 cursor-pointer hover:bg-[--tray-hover] rounded transition-colors text-sm truncate"
              @click="handleSuggestionClick(item)">
              <span class="text-[--text-color]" :class="{ 'text-red-500 font-medium': index < 2 }">
                {{ item }}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div class="text-[--text-color] font-medium mb-2 text-sm">{{ $t("components.searchBox.trending") }}</div>
          <div class="space-y-1">
            <div
              v-for="(item, index) in trendingSearches"
              :key="index"
              class="flex items-center gap-2 cursor-pointer hover:bg-[--tray-hover] px-2 py-1.5 rounded transition-colors"
              @click="handleTrendingClick(item)">
              <span
                class="w-4 h-4 rounded text-[10px] flex items-center justify-center font-medium flex-shrink-0"
                :class="index < 3 ? 'bg-red-500 text-white' : 'bg-[--line-color] text-[--user-text-color]'">
                {{ index + 1 }}
              </span>
              <span class="text-[--text-color] text-sm truncate">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { StorageKeyEnum, MittEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";

defineOptions({
  name: "SearchBox"
});

// 搜索查询
const searchQuery = ref("");
// 显示下拉框
const showDropdown = ref(false);
// 用于跟踪是否点击了下拉框内容
const isDropdownClicked = ref(false);

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
const searchSuggestions = ref<string[]>([
  "基米说",
  "不再曼波",
  "最近最火的舞蹈",
  "qq音乐蓝牙耳机",
  "最后一哈",
  "抖音必听的20首歌",
  "公务员有多难考",
  "喵喵手势舞"
]);

// 最近热搜
const trendingSearches = ref<string[]>([
  "领悟总书记对海南自贸港的殷殷期待",
  "海南自贸港正式封关",
  "再坚持一下 2262年有两个春节",
  "不断巩固拓展经济稳中有向好势头",
  "剑来动画第二季定档"
]);

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
 * @param item 点击的搜索建议项
 */
const handleSuggestionClick = (item: string) => {
  searchQuery.value = item;
  handleSearch();
};

/**
 * 处理热搜点击
 * @param item 点击的热搜项
 */
const handleTrendingClick = (item: string) => {
  searchQuery.value = item;
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
  console.log("Refreshing suggestions");
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

watch(
  searchHistory,
  (newHistory) => {
    localStorage.setItem(StorageKeyEnum.SEARCH_HISTORY, JSON.stringify(newHistory));
  },
  { deep: true }
);
</script>

<style scoped>
.search-dropdown-container {
  z-index: 50;
}
</style>
