<template>
  <div class="home-container p-4 h-full overflow-y-auto select-none">
    <!-- 搜索框 -->
    <search-box class="mx-auto mb-10px" />

    <!-- 分类导航 -->
    <category-nav :categories="categories" :active-category="activeCategory" @category-change="handleCategoryChange" />

    <!-- 大图展示区域（仅在全部分类显示） -->
    <div v-if="activeCategory === 'all'" class="grid grid-cols-5 gap-4 mt-4">
      <!-- 主要大图 -->
      <div
        class="relative col-span-3 rounded-lg overflow-hidden bg-black cursor-pointer hover:opacity-90 transition-opacity aspect-[16/9]"
        @click="navigateToLive(1)">
        <img
          src="https://picsum.photos/id/123/800/450"
          alt="Featured content"
          class="w-full h-full object-cover"
          loading="lazy" />
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
          <div
            class="inline-flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium mb-2">
            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span>live</span>
          </div>
          <h3 class="text-lg font-medium mb-2">我就狐狸娇妻 在吗吃饭了吗</h3>
          <div class="flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              9986
            </span>
            <span class="text-gray-300">大怪怪（云顶之弈）</span>
          </div>
        </div>
      </div>

      <!-- 右侧小图推荐 -->
      <div class="col-span-2 grid grid-cols-2 grid-rows-2 gap-4">
        <div
          v-for="item in sideFeaturedItems"
          :key="item.id"
          class="side-featured-item flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          @click="navigateToLive(item.id)">
          <div class="relative aspect-video rounded-lg overflow-hidden bg-black">
            <img :src="item.imageUrl" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
          </div>
          <div class="flex flex-col gap-1 min-h-[40px]">
            <h4 class="text-sm font-medium truncate">{{ item.title }}</h4>
            <div class="text-xs text-gray-500">
              <span class="block">{{ item.viewers }}</span>
              <span class="block">{{ item.author }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 我的关注和热门标签区域（仅在全部分类显示，位于大图下方） -->
    <div v-if="activeCategory === 'all'" class="grid grid-cols-2 gap-6 mt-8">
      <!-- 我的关注 -->
      <div>
        <div class="text-lg font-medium mb-4">我的关注</div>
        <div class="bg-white rounded-lg h-[110px] flex items-center">
          <n-scrollbar x-scrollable class="ml-4 h-full">
            <div class="flex gap-6 min-w-max py-[10px]">
              <div v-for="follow in followList" :key="follow.id" class="flex flex-col items-center">
                <div class="relative">
                  <img
                    :src="follow.avatar"
                    :alt="follow.name"
                    class="w-14 h-14 rounded-full object-cover"
                    loading="lazy" />
                  <div class="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                </div>
                <div class="mt-1 text-center">
                  <div class="text-sm font-medium">{{ follow.name }}</div>
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
            :key="tag.label"
            class="bg-white rounded-lg p-[14px] text-center text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
            @click="handleCategoryChange(tag.value)">
            {{ tag.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 图片卡片网格 -->
    <div v-if="activeCategory === 'all'" class="text-lg font-medium mb-4 mt-4">更多直播</div>
    <div class="grid grid-cols-4 gap-4 mt-4">
      <div v-for="item in filteredItems" :key="item.id" class="cursor-pointer" @click="navigateToLive(item.id)">
        <image-card
          :image-url="item.imageUrl"
          :title="item.title"
          :author="item.author"
          :viewers="item.viewers"
          :is-live="item.isLive" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Index"
});

const router = useRouter();

// 跳转到直播播放页面
const navigateToLive = (id: number) => {
  router.push(`/live/${id}`);
};

// 分类列表
const categories = ref([
  { label: "全部", value: "all" },
  { label: "聊天", value: "chat" },
  { label: "音乐", value: "music" },
  { label: "游戏", value: "game" },
  { label: "二次元", value: "anime" },
  { label: "舞蹈", value: "dance" },
  { label: "文化", value: "culture" },
  { label: "生活", value: "life" },
  { label: "运动", value: "sports" }
]);

// 当前激活分类
const activeCategory = ref("all");

// 模拟数据
const items = ref([
  {
    id: 1,
    imageUrl: "https://picsum.photos/id/1/400/300",
    title: "唱首歌……",
    author: "李歌者",
    viewers: 1234,
    isLive: true,
    category: "music"
  },
  {
    id: 2,
    imageUrl: "https://picsum.photos/id/2/400/300",
    title: "主播碎碎念，乐事一箩筐",
    author: "十一",
    viewers: 567,
    isLive: true,
    category: "chat"
  },
  {
    id: 3,
    imageUrl: "https://picsum.photos/id/3/400/300",
    title: "今天不可以吃的",
    author: "宁萌",
    viewers: 890,
    isLive: false,
    category: "life"
  },
  {
    id: 4,
    imageUrl: "https://picsum.photos/id/4/400/300",
    title: "众筹买黑丝",
    author: "在下小喵喵",
    viewers: 1122,
    isLive: true,
    category: "anime"
  },
  {
    id: 5,
    imageUrl: "https://picsum.photos/id/5/400/300",
    title: "子木正在直播",
    author: "徐文婧",
    viewers: 345,
    isLive: true,
    category: "dance"
  },
  {
    id: 6,
    imageUrl: "https://picsum.photos/id/6/400/300",
    title: "全民K歌",
    author: "做好自己",
    viewers: 678,
    isLive: false,
    category: "music"
  },
  {
    id: 7,
    imageUrl: "https://picsum.photos/id/7/400/300",
    title: "！",
    author: "大壮_",
    viewers: 901,
    isLive: false,
    category: "chat"
  },
  {
    id: 8,
    imageUrl: "https://picsum.photos/id/8/400/300",
    title: "李敏香去付种电池的小姐姐",
    author: "安娜琪",
    viewers: 234,
    isLive: true,
    category: "life"
  }
]);

// 右侧小图推荐数据
const sideFeaturedItems = ref([
  {
    id: 101,
    imageUrl: "https://picsum.photos/id/9/300/200",
    title: "国服前十 全阵容讲解运营上分必学",
    author: "大怪怪",
    viewers: 500
  },
  {
    id: 102,
    imageUrl: "https://picsum.photos/id/10/300/200",
    title: "公务员、事业编刷进行中……",
    author: "公考一月",
    viewers: 72
  },
  {
    id: 103,
    imageUrl: "https://picsum.photos/id/11/300/200",
    title: "一甲一组单四分尔南",
    author: "地铁逃生白起",
    viewers: 986
  },
  {
    id: 104,
    imageUrl: "https://picsum.photos/id/12/300/200",
    title: "采山人正在直播",
    author: "采山人",
    viewers: 2025
  }
]);

// 我的关注数据
const followList = ref([
  {
    id: 201,
    name: "森森动画",
    status: "直播中...",
    avatar: "https://picsum.photos/id/20/100/100",
    imageUrl: "https://picsum.photos/id/1/400/225",
    title: "学习动画吗？我教你",
    viewers: 1234
  },
  {
    id: 202,
    name: "象棋大师",
    status: "直播中...",
    avatar: "https://picsum.photos/id/21/100/100",
    imageUrl: "https://picsum.photos/id/2/400/225",
    title: "简单粗暴，专杀不服，绝妙杀招，由你来定",
    viewers: 567
  },
  {
    id: 203,
    name: "虚拟偶像",
    status: "直播中...",
    avatar: "https://picsum.photos/id/22/100/100",
    imageUrl: "https://picsum.photos/id/3/400/225",
    title: "深塔最严厉的主人，进来打个满满意...",
    viewers: 890
  },
  {
    id: 204,
    name: "游戏达人",
    status: "直播中...",
    avatar: "https://picsum.photos/id/23/100/100",
    imageUrl: "https://picsum.photos/id/4/400/225",
    title: "今天玩点不一样的游戏",
    viewers: 1357
  },
  {
    id: 205,
    name: "美食主播",
    status: "直播中...",
    avatar: "https://picsum.photos/id/24/100/100",
    imageUrl: "https://picsum.photos/id/5/400/225",
    title: "教你做一道简单又好吃的家常菜",
    viewers: 2468
  }
]);

// 热门标签数据，包含显示名称和对应分类值
const hotTags = ref([
  { label: "舞蹈", value: "dance" },
  { label: "音乐", value: "music" },
  { label: "王者荣耀", value: "game" },
  { label: "和平精英", value: "game" },
  { label: "无畏契约", value: "game" },
  { label: "CSGO", value: "game" }
]);

// 筛选后的项目
const filteredItems = computed(() => {
  if (activeCategory.value === "all") {
    return items.value;
  }
  return items.value.filter((item) => item.category === activeCategory.value);
});

// 分类切换处理
const handleCategoryChange = (category: string) => {
  activeCategory.value = category;
};
</script>

<style scoped>
:deep(.n-scrollbar-content) {
  max-width: 100vw;
}
</style>
