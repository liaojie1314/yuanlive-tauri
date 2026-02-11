<template>
  <n-scrollbar>
    <div class="home-container p-4 h-full select-none">
      <!-- 搜索框 -->
      <search-box class="mx-auto mb-10px" />
      <!-- 分类导航 -->
      <category-nav
        :active-category="activeCategory"
        :active-child-category="activeChildCategory"
        @category-change="handleCategoryChange" />
      <div v-if="activeCategory === 'all'" class="grid grid-cols-5 gap-4 mt-4">
        <div
          class="relative col-span-3 rounded-lg overflow-hidden bg-black cursor-pointer hover:opacity-90 transition-opacity flex flex-col"
          @click="navigateToLive(topLiveList[0].id)">
          <div class="flex-1">
            <img
              :src="topLiveList[0].coverImg"
              :alt="topLiveList[0].title"
              class="w-full h-full object-cover"
              loading="lazy" />
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
            <div
              class="inline-flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium mb-2">
              <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span>live</span>
            </div>
            <h3 class="text-lg font-medium mb-2">{{ topLiveList[0].title }}</h3>
            <div class="flex items-center gap-4 text-sm">
              <span class="flex items-center gap-1">
                <i-mdi-eye />
                {{ topLiveList[0].hotScore }}
              </span>
              <span class="text-gray-300">{{ topLiveList[0].anchorName }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧小图推荐 -->
        <div class="col-span-2 grid grid-cols-2 grid-rows-2 gap-4 h-full">
          <div
            v-for="item in topLiveList.splice(1)"
            :key="item.id"
            class="side-featured-item flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            @click="navigateToLive(item.id)">
            <div class="relative rounded-lg overflow-hidden bg-black flex-1">
              <img :src="item.coverImg" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
            </div>
            <div class="flex flex-col gap-1 min-h-[40px]">
              <h4 class="text-sm font-medium truncate">{{ item.title }}</h4>
              <div class="text-xs text-gray-500">
                <span class="block">{{ item.hotScore }}</span>
                <span class="block">{{ item.anchorName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的关注和热门标签区域 -->
      <div v-if="activeCategory === 'all'" class="grid grid-cols-2 gap-6 mt-8">
        <!-- 我的关注 -->
        <div>
          <div class="text-lg font-medium mb-4">我的关注</div>
          <div class="bg-white rounded-lg h-[110px] flex items-center">
            <n-scrollbar x-scrollable class="ml-4 h-full">
              <div class="flex gap-6 min-w-max py-[10px]">
                <div v-for="follow in followLiveList" :key="follow.roomId" class="flex flex-col items-center">
                  <div class="relative">
                    <img
                      :src="follow.avatar"
                      :alt="follow.username"
                      class="w-14 h-14 rounded-full object-cover"
                      loading="lazy" />
                    <div class="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div class="mt-1 text-center">
                    <div class="text-sm font-medium">{{ follow.username }}</div>
                  </div>
                </div>
              </div>
            </n-scrollbar>
          </div>
        </div>
        <!-- 热门标签 -->
        <div>
          <div class="text-lg font-medium mb-4">热门标签</div>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="tag in hotTags"
              :key="tag.name"
              class="bg-white rounded-lg p-[14px] text-center text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
              @click="handleCategoryChange(tag.value, tag.parentValue)">
              {{ tag.value }}
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
  </n-scrollbar>
</template>

<script setup lang="ts">
import { getTopFiveLiveApi, getFollowingLiveApi, getLiveListByCategoryApi } from "@/api/live";

defineOptions({
  name: "Index"
});

interface LiveInfo {
  // 房间ID
  id: number;
  // 房间名
  title: string;
  // 主播名
  anchorName: string;
  // 直播封面
  coverImg: string;
  // 人气指数
  hotScore: number;
}

interface HotCategoryInfo {
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

// 模拟数据
const liveList = ref<LiveInfo[]>([]);

// 右侧小图推荐数据
const topLiveList = ref<LiveInfo[]>([]);

// 我的关注数据
const followLiveList = ref<FollowLiveInfo[]>([]);

// 热门标签数据，包含显示名称和对应分类值
const hotTags = ref<HotCategoryInfo[]>([]);

// 分类切换处理
const handleCategoryChange = async (value: string, parentValue?: string) => {
  activeCategory.value = parentValue ? parentValue : value;
  activeChildCategory.value = parentValue ? value : "all";
  liveList.value = await getLiveListByCategoryApi(value);
};

// 跳转到直播播放页面
const navigateToLive = (id: number) => {
  router.push(`/live/${id}`);
};

onMounted(async () => {
  topLiveList.value = await getTopFiveLiveApi();
  liveList.value = await getLiveListByCategoryApi(activeCategory.value);
  followLiveList.value = await getFollowingLiveApi();
});
</script>

<style scoped></style>
