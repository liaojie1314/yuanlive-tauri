<template>
  <n-scrollbar>
    <div class="home-container p-4 h-full select-none text-[--text-color]">
      <div class="sticky top-0 z-50 -mt-4 -mx-4 pt-4 px-4 pb-2 mb-2 bg-[--right-bg-color]">
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

        <div v-if="activeCategory === 'all'" class="grid grid-cols-5 gap-4 mt-4">
          <div
            class="relative col-span-3 rounded-lg overflow-hidden bg-black cursor-pointer hover:opacity-90 transition-opacity flex flex-col"
            @click="navigateToLive(bigLive.id)">
            <img :src="bigLive.coverImg" class="w-full h-full object-cover" />
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
              <div class="flex items-center gap-4 text-sm">
                <span class="flex items-center gap-1">
                  <i-mdi-eye />
                  {{ bigLive.hotScore }}
                </span>
                <span class="text-gray-300">{{ bigLive.anchorName }}</span>
              </div>
            </div>
          </div>

          <div class="col-span-2 grid grid-cols-2 grid-rows-2 gap-4 h-full">
            <div
              v-for="item in sideLiveList"
              :key="item.id"
              class="side-featured-item flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              @click="navigateToLive(item.id)">
              <div class="relative rounded-lg overflow-hidden bg-black flex-1">
                <img :src="item.coverImg" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="flex flex-col gap-1 min-h-[40px]">
                <h4 class="text-sm font-medium truncate">{{ item.title }}</h4>
                <div class="text-xs text-[--user-text-color]">
                  <span class="block">{{ item.hotScore }}</span>
                  <span class="block">{{ item.anchorName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeCategory === 'all'" class="grid grid-cols-2 gap-6 mt-8">
          <div>
            <div class="text-lg font-medium mb-4">我的关注</div>
            <div class="bg-[--tray-bg-color] rounded-lg h-[110px] flex items-center transition-colors duration-300">
              <n-scrollbar x-scrollable class="m-4 h-full">
                <div class="flex gap-6 min-w-max py-[10px]">
                  <div v-for="follow in followLiveList" :key="follow.roomId" class="flex flex-col items-center">
                    <div class="relative">
                      <img
                        :src="follow.avatar"
                        :alt="follow.username"
                        class="w-14 h-14 rounded-full object-cover"
                        loading="lazy" />
                      <div
                        class="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[--tray-bg-color]"></div>
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
            <div class="text-lg font-medium mb-4">热门标签</div>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="tag in hotTags"
                :key="tag.id"
                class="bg-[--tray-bg-color] rounded-lg p-[14px] text-center text-sm font-medium cursor-pointer hover:bg-[--tray-hover] transition-colors duration-300"
                @click="handleCategoryChange(tag.parentValue, tag.value)">
                {{ tag.name }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeCategory === 'all'" class="text-lg font-medium mb-4 mt-4">更多直播</div>

        <div class="grid grid-cols-4 gap-4 mt-4">
          <div v-for="item in liveList" :key="item.id" class="cursor-pointer" @click="navigateToLive(item.id)">
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
import { getTopFiveLiveApi, getFollowingLiveApi, getLiveListByCategoryApi } from "@/api/live";

defineOptions({
  name: "Index"
});

interface LiveInfo {
  id: number;
  title: string;
  anchorName: string;
  coverImg: string;
  hotScore: number;
}

interface HotCategoryInfo {
  id: number;
  name: string;
  value: string;
  parentValue: string;
}

interface FollowLiveInfo {
  username: string;
  avatar: string;
  roomId: number;
}

const router = useRouter();

// 当前激活分类
const activeCategory = ref("all");
const activeChildCategory = ref("all");

const liveList = ref<LiveInfo[]>([]);
const topLiveList = ref<LiveInfo[]>([]);
const followLiveList = ref<FollowLiveInfo[]>([]);
const hotTags = ref<HotCategoryInfo[]>([]);
// 搜索状态控制
const isSearching = ref(false);
const currentSearchQuery = ref("");

const bigLive = computed(() => topLiveList.value[0] || {});
const sideLiveList = computed(() => topLiveList.value.slice(1));

// 分类切换处理
const handleCategoryChange = async (parentValue: string, childValue: string = "all") => {
  activeCategory.value = parentValue;
  activeChildCategory.value = childValue;
  liveList.value = await getLiveListByCategoryApi(childValue !== "all" ? childValue : parentValue);
};

// 跳转到直播播放页面
const navigateToLive = (id: number) => {
  router.push(`/live/${id}`);
};

useMitt.on(MittEnum.SEARCH, (keyword: string) => {
  console.log("Index received search:", keyword);
  currentSearchQuery.value = keyword;
  isSearching.value = true;
});

// 返回首页处理
const handleBackToHome = () => {
  isSearching.value = false;
  currentSearchQuery.value = "";
};

onMounted(async () => {
  topLiveList.value = await getTopFiveLiveApi();
  liveList.value = await getLiveListByCategoryApi("all");
  followLiveList.value = await getFollowingLiveApi();
});
</script>

<style scoped></style>
