<template>
  <div class="search-result-container flex h-full flex-col">
    <div class="mb-4 flex-between-center">
      <div class="text-lg">
        <span>{{ $t("components.searchResult.title") }}</span>
        <span class="font-bold text-red-500">"{{ query }}"</span>
        <span class="ml-2 text-sm text-gray-400">{{ $t("components.searchResult.total", { total }) }}</span>
      </div>
      <n-button size="small" secondary @click="handleBack">
        <template #icon>
          <i-mdi-arrow-left />
        </template>
        {{ $t("components.searchResult.back") }}
      </n-button>
    </div>

    <div v-if="loading" class="flex min-h-[300px] flex-1 items-center justify-center">
      <n-spin size="large" :description="$t('components.searchResult.loading')" />
    </div>

    <div v-else-if="list.length === 0" class="flex min-h-[300px] flex-1 items-center justify-center">
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
        <div v-for="item in list" :key="item.id" @click="navigateToLive(item)">
          <live-card
            :cover-url="item.coverImg"
            :title="item.title"
            :anchor-name="item.anchorName"
            :hot-score="item.hotScore" />
        </div>
      </div>

      <div class="mt-8 flex-x-center pb-4">
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
import type { VideoItem } from "@/api/types";
import { getSearchResultApi } from "@/api/user";
import { usePlaylistStore } from "@/stores/playlist";

defineOptions({ name: "SearchResult" });

const router = useRouter();
const playlistStore = usePlaylistStore();

const props = defineProps<{
  query: string;
}>();
const emit = defineEmits(["back"]);

interface DisplayItem {
  id: number;
  title: string;
  anchorName: string;
  coverImg: string;
  hotScore: number;
  isLive: boolean; // 增加标识，用于区分跳转路由
  // video 数据
  video?: VideoItem;
}

const loading = ref(false);
const list = ref<DisplayItem[]>([]);
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);

const pageCount = computed(() => Math.ceil(total.value / pageSize.value));

/** 获取搜索结果 */
const fetchSearchResults = async () => {
  loading.value = true;
  list.value = []; // 清空当前列表

  try {
    const res = await getSearchResultApi(props.query, page.value, pageSize.value);

    if (res) {
      total.value = res.total || 0;
      // 数据映射
      list.value = res.list
        ?.map((item) => {
          if (item.checkRoom && item.liveRoom) {
            // 直播间数据映射
            return {
              id: item.liveRoom.id,
              title: item.liveRoom.title || "",
              anchorName: item.liveRoom.anchorName || "",
              coverImg: item.liveRoom.coverImg || "",
              hotScore: item.liveRoom.hotScore || 0,
              isLive: true
            };
          } else if (!item.checkRoom && item.video) {
            // 视频数据映射
            return {
              id: item.video.id,
              title: item.video.title || "",
              anchorName: item.video.username || "",
              coverImg: item.video.coverUrl || "",
              hotScore: item.video.likeCount || 0,
              isLive: false,
              video: item.video
            };
          }
          return null;
        })
        .filter(Boolean) as DisplayItem[];
    }
  } catch (error) {
    console.error("获取搜索结果失败:", error);
  } finally {
    loading.value = false;
  }
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
 * @param item 搜索结果项
 */
const navigateToLive = (item: DisplayItem) => {
  if (item.isLive) {
    router.push(`/live/${item.id}`);
  } else {
    playlistStore.playSingleVideo(item.video as VideoItem);
    router.push("/video");
  }
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
