<template>
  <div class="w-[400px] relative">
    <div
      class="relative z-1 flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden w-full max-w-3xl mx-auto">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索你感兴趣的内容"
        class="flex-1 px-4 py-2 text-gray-700 rounded-l-md outline-none h-full"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @keydown.enter="handleSearch" />
      <!-- 清空按钮 -->
      <div
        v-if="searchQuery"
        class="w-4 h-4 absolute right-25 text-gray-500 hover:text-gray-700 transition-colors rounded-[8px]"
        @click="clearInput"
        @mousedown.stop>
        <i-mdi-close-circle-outline class="w-4 h-4" />
      </div>
      <button
        class="bg-black text-white px-4 py-2 flex items-center gap-1 hover:bg-gray-800 transition-colors h-full whitespace-nowrap"
        @click="handleSearch">
        <i-mdi-magnify class="w-5 h-5" />
        <n-text class="text-[16px] color-#fff">搜索</n-text>
      </button>
    </div>

    <!-- 搜索下拉框 -->
    <div
      v-if="showDropdown"
      class="search-dropdown-container absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-10 w-full max-w-3xl">
      <div class="search-dropdown bg-white rounded-lg p-4 overflow-hidden" @mousedown="handleDropdownMousedown">
        <!-- 搜索历史 -->
        <div v-if="searchHistory.length > 0" class="mb-2">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700 font-medium">历史记录</span>
            <div
              class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
              @click="clearSearchHistory">
              <i-mdi-close-circle-outline class="w-3 h-3" />
              清除记录
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(item, index) in searchHistory"
              :key="index"
              class="relative px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200 transition-colors flex items-center">
              <span @click="handleHistoryClick(item)">{{ item }}</span>
              <!-- 删除图标 -->
              <div
                class="absolute right-0 top-[2px] transform -translate-y-1/2 w-3 h-3 rounded-full bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer flex items-center justify-center"
                @click.stop="deleteSearchHistory(index)"
                @mousedown.stop>
                <i-mdi-close class="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        <!-- 猜你想搜 -->
        <div class="mb-2">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-700 font-medium">猜你想搜</span>
            <div
              class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
              @click="handleRefreshSuggestions">
              <i-mdi-refresh class="w-3 h-3" />
              换一换
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <span
              v-for="(item, index) in searchSuggestions"
              :key="index"
              class="py-2 px-1 cursor-pointer hover:bg-gray-100 rounded"
              @click="handleSuggestionClick(item)">
              <n-text class="text-gray-700" :class="{ 'text-red-500': index < 2 }">{{ item }}</n-text>
            </span>
          </div>
        </div>

        <!-- 最近热搜 -->
        <div>
          <div class="text-gray-700 font-medium mb-2">最近热搜</div>
          <div class="space-y-1">
            <div
              v-for="(item, index) in trendingSearches"
              :key="index"
              class="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-1 py-2 rounded"
              @click="handleTrendingClick(item)">
              <span
                class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                :class="{
                  'bg-red-500 text-white': index < 3,
                  'bg-gray-200 text-gray-700': index >= 3
                }">
                {{ index + 1 }}
              </span>
              <span class="text-gray-700">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { StorageKeyEnum } from "@/enums";

defineOptions({
  name: "SearchBox"
});

// 搜索查询
const searchQuery = ref("");
// 显示下拉框
const showDropdown = ref(false);
// 用于跟踪是否点击了下拉框内容
const isDropdownClicked = ref(false);

// 搜索历史记录
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

// 处理搜索
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
    // 执行搜索逻辑
    console.log("Searching for:", searchQuery.value);
    // 关闭下拉框
    showDropdown.value = false;
  }
};

// 处理历史记录点击
const handleHistoryClick = (item: string) => {
  searchQuery.value = item;
  handleSearch();
};

// 处理搜索建议点击
const handleSuggestionClick = (item: string) => {
  searchQuery.value = item;
  handleSearch();
};

// 处理热搜点击
const handleTrendingClick = (item: string) => {
  searchQuery.value = item;
  handleSearch();
};

// 清除搜索历史
const clearSearchHistory = () => {
  searchHistory.value = [];
};

// 删除单个搜索历史
const deleteSearchHistory = (index: number) => {
  searchHistory.value.splice(index, 1);
};

// 刷新搜索建议
const handleRefreshSuggestions = () => {
  // 这里可以添加刷新逻辑，比如从服务器获取新的建议
  console.log("Refreshing suggestions");
};

// 处理输入框失去焦点
const handleBlur = () => {
  // 延迟隐藏，以便处理下拉框内的点击事件
  setTimeout(() => {
    if (!isDropdownClicked.value) {
      showDropdown.value = false;
    }
    isDropdownClicked.value = false;
  }, 150);
};

// 处理下拉框内容点击
const handleDropdownMousedown = () => {
  isDropdownClicked.value = true;
};

// 清空输入框
const clearInput = () => {
  searchQuery.value = "";
};

// 监听搜索历史变化，自动保存到localStorage
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
  width: 100%;
  overflow-y: auto;
}

.search-dropdown {
  border: 1px solid #e5e7eb;
  border-top: none;
}
</style>
