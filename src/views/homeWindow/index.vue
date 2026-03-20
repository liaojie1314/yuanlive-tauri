<template>
  <n-scrollbar>
    <div class="home-container h-full p-4 text-[--text-color] select-none">
      <div class="sticky top-0 z-50 -mx-4 -mt-4 mb-2 bg-[--right-bg-color] px-4 pt-4 pb-2">
        <search-box class="mx-auto" />
      </div>

      <div v-if="isSearching">
        <search-result :query="currentSearchQuery" @back="handleBackToHome" />
      </div>

      <div v-else>
        <category-nav
          :active-category="activeCategory"
          :active-child-category="activeChildCategory"
          @category-change="handleCategoryChange" />

        <div v-if="activeCategory === 'all'" class="mt-4 grid grid-cols-5 gap-4">
          <div
            class="relative col-span-3 flex cursor-pointer flex-col overflow-hidden rounded-lg bg-black transition-opacity hover:opacity-90"
            @click="navigateToLive(bigLive.id)">
            <img class="h-full w-full object-cover" :src="bigLive.coverImg" />
            <div class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
              <div class="flex-y-center gap-4 text-sm">
                <span class="flex-y-center gap-1">
                  <i-mdi-eye />
                  {{ bigLive.hotScore }}
                </span>
                <span class="text-gray-300">{{ bigLive.anchorName }}</span>
              </div>
            </div>
          </div>

          <div class="col-span-2 grid h-full grid-cols-2 grid-rows-2 gap-4">
            <div
              v-for="item in sideLiveList"
              class="side-featured-item flex cursor-pointer flex-col gap-2 transition-opacity hover:opacity-90"
              :key="item.id"
              @click="navigateToLive(item.id)">
              <div class="relative flex-1 overflow-hidden rounded-lg bg-black">
                <img loading="lazy" class="h-full w-full object-cover" :src="item.coverImg" :alt="item.title" />
              </div>
              <div class="flex min-h-[40px] flex-col gap-1">
                <h4 class="truncate text-sm font-medium">{{ item.title }}</h4>
                <div class="text-xs text-[--user-text-color]">
                  <span class="block">{{ item.hotScore }}</span>
                  <span class="block">{{ item.anchorName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeCategory === 'all'" class="mt-8 grid grid-cols-2 gap-6">
          <div>
            <div class="mb-4 text-lg font-medium">{{ $t("home.index.myFollow") }}</div>
            <div class="flex h-[110px] items-center rounded-lg bg-[--tray-bg-color] transition-colors duration-300">
              <n-scrollbar x-scrollable class="m-4 h-full">
                <div class="flex min-w-max gap-6 py-[10px]">
                  <div v-for="follow in followLiveList" class="flex-col-x-center" :key="follow.roomId">
                    <div class="relative">
                      <img
                        loading="lazy"
                        class="h-14 w-14 rounded-full object-cover"
                        :src="follow.avatar"
                        :alt="follow.username" />
                      <div
                        class="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-[--tray-bg-color] bg-red-500"></div>
                    </div>
                    <div class="mt-1 text-center">
                      <div class="text-sm font-medium">{{ follow.username }}</div>
                    </div>
                  </div>
                </div>
              </n-scrollbar>
            </div>
          </div>

          <div>
            <div class="mb-4 text-lg font-medium">{{ $t("home.index.hotTags") }}</div>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="tag in hotTags"
                class="cursor-pointer rounded-lg bg-[--tray-bg-color] p-[14px] text-center text-sm font-medium transition-colors duration-300 hover:bg-[--tray-hover]"
                :key="tag.id"
                @click="handleCategoryChange(tag.parentValue, tag.value)">
                {{ tag.label }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeCategory === 'all'" class="mt-4 mb-4 text-lg font-medium">{{ $t("home.index.moreLive") }}</div>

        <div class="mt-4 grid grid-cols-4 gap-4">
          <div v-for="item in liveList" class="cursor-pointer" :key="item.id" @click="navigateToLive(item.id)">
            <live-card
              :cover-url="item.coverImg"
              :title="item.title"
              :anchor-name="item.anchorName"
              :hot-score="item.hotScore" />
          </div>
        </div>
      </div>
    </div>
  </n-scrollbar>
</template>

<script setup lang="ts">
import { MittEnum } from "@/enums";
import { useMitt } from "@/hooks/useMitt";
import type { LiveItem, FollowLiveItem, HotCategoryItem } from "@/api/types";
import { getTopFiveLiveApi, getFollowingLiveApi, getHotCategoryApi, getLiveListByCategoryApi } from "@/api/live";

defineOptions({
  name: "Index"
});

const router = useRouter();

// 当前激活分类
const activeCategory = ref("all");
const activeChildCategory = ref("all");

const liveList = ref<LiveItem[]>([]);
const topLiveList = ref<LiveItem[]>([]);
const followLiveList = ref<FollowLiveItem[]>([]);
const hotTags = ref<HotCategoryItem[]>([]);
// 搜索状态控制
const isSearching = ref(false);
const currentSearchQuery = ref("");

const bigLive = computed(() => topLiveList.value[0] || {});
const sideLiveList = computed(() => topLiveList.value.slice(1));

/**
 * 分类切换处理
 * @param parentValue 父分类值
 * @param childValue 子分类值，默认"all"表示不筛选子分类
 */
const handleCategoryChange = async (parentValue: string, childValue: string = "all") => {
  activeCategory.value = parentValue;
  activeChildCategory.value = childValue;
  liveList.value = await getLiveListByCategoryApi(childValue !== "all" ? childValue : parentValue);
};

/**
 * 跳转至直播播放页面
 * @param id 直播ID
 */
const navigateToLive = (id: number) => {
  router.push(`/live/${id}`);
};

/**
 * 返回首页处理
 */
const handleBackToHome = () => {
  isSearching.value = false;
  currentSearchQuery.value = "";
};

useMitt.on(MittEnum.SEARCH, (keyword: string) => {
  currentSearchQuery.value = keyword;
  isSearching.value = true;
});

onMounted(async () => {
  topLiveList.value = await getTopFiveLiveApi();
  hotTags.value = await getHotCategoryApi();
  followLiveList.value = await getFollowingLiveApi();
  liveList.value = await getLiveListByCategoryApi("all");
});
</script>

<style scoped></style>
