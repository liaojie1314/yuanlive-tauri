<template>
  <div class="search-result-container h-full flex flex-col">
    <div class="mb-4 flex items-center justify-between">
      <div class="text-lg">
        <span>{{ $t("components.searchResult.title") }}</span>
        <span class="font-bold text-red-500">"{{ query }}"</span>
        <span class="text-sm text-gray-400 ml-2">{{ $t("components.searchResult.total", { total }) }}</span>
      </div>
      <n-button size="small" secondary @click="handleBack">
        <template #icon>
          <i-mdi-arrow-left />
        </template>
        {{ $t("components.searchResult.back") }}
      </n-button>
    </div>

    <div v-if="loading" class="flex-1 flex justify-center items-center min-h-[300px]">
      <n-spin size="large" :description="$t('components.searchResult.loading')" />
    </div>

    <div v-else-if="list.length === 0" class="flex-1 flex justify-center items-center min-h-[300px]">
      <n-empty :description="$t('components.searchResult.empty')">
        <template #extra>
          <n-button size="small" @click="handleBack">
            {{ $t("components.searchResult.back") }}
          </n-button>
        </template>
      </n-empty>
    </div>

    <div v-else class="flex-1">
      <div class="grid grid-cols-4 gap-4">
        <div v-for="item in list" :key="item.id" @click="navigateToLive(item.id)">
          <live-card
            :cover-url="item.coverImg"
            :title="item.title"
            :anchor-name="item.anchorName"
            :hot-score="item.hotScore" />
        </div>
      </div>

      <div class="flex justify-center mt-8 pb-4">
        <n-pagination
          v-model:page="page"
          :page-count="pageCount"
          :page-size="pageSize"
          @update:page="handlePageChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "SearchResult" });

interface Props {
  query: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["back"]);
const router = useRouter();

interface LiveInfo {
  id: number;
  title: string;
  anchorName: string;
  coverImg: string;
  hotScore: number;
}

const loading = ref(false);
const list = ref<LiveInfo[]>([]);
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);

const pageCount = computed(() => Math.ceil(total.value / pageSize.value));

/** 获取搜索结果 */
const fetchSearchResults = async () => {
  loading.value = true;
  list.value = []; // 清空当前列表

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 600));

  // 模拟生成数据
  const mockData: LiveInfo[] = Array.from({ length: pageSize.value }).map((_, i) => ({
    id: Date.now() + i,
    title: `${props.query} - 相关直播内容 ${page.value}-${i + 1}`,
    anchorName: `主播_${Math.floor(Math.random() * 1000)}`,
    coverImg: `https://picsum.photos/640/360?random=${page.value * 10 + i}`,
    hotScore: Math.floor(Math.random() * 100000)
  }));

  // 模拟总数 (根据关键词长度变一下，让它看起来不一样)
  total.value = props.query.length * 10 + 25;
  list.value = mockData;
  loading.value = false;
};

/** 翻页处理 */
const handlePageChange = (newPage: number) => {
  page.value = newPage;
  fetchSearchResults();
};

/** 返回首页 */
const handleBack = () => {
  emit("back");
};

/**
 * 导航到直播详情页
 * @param id 房间id
 */
const navigateToLive = (id: number) => {
  router.push(`/live/${id}`);
};

// 监听关键词变化，重置分页并搜索
watch(
  () => props.query,
  () => {
    page.value = 1;
    fetchSearchResults();
  }
);

onMounted(() => {
  fetchSearchResults();
});
</script>

<style scoped></style>
