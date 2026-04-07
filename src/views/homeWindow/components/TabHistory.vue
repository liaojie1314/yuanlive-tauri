<template>
  <div class="mx-4 flex min-h-0 flex-1 flex-col">
    <div class="mb-4 flex h-8 shrink-0 items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <div
          v-for="tab in [
            { label: t('home.user.history.users'), val: 'users' },
            { label: t('home.user.history.videos'), val: 'videos' },
            { label: t('home.user.history.lives'), val: 'lives' }
          ]"
          class="cursor-pointer rounded-md px-4 py-1 text-sm transition-colors"
          :key="tab.val"
          :class="
            historySubTab === tab.val
              ? 'bg-[#ff0050]/10 font-medium text-[#ff0050]'
              : 'bg-[--bg-setting-item] text-[--text-color] hover:bg-[--tray-hover]'
          "
          @click="historySubTab = tab.val">
          {{ tab.label }}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <template v-if="historySubTab === 'videos'">
          <div class="w-40 shrink-0">
            <n-input
              size="small"
              clearable
              class="bg-transparent"
              v-model:value="historyVideoSearchQuery"
              :placeholder="t('home.user.history.searchVideosPlaceholder')"
              :bordered="false">
              <template #prefix><i-mdi-magnify class="text-[--disabled-color]" /></template>
            </n-input>
          </div>
          <div class="h-3 w-px bg-[--line-color]"></div>
          <n-popover
            trigger="hover"
            placement="bottom-end"
            style="width: 380px; border-radius: 12px"
            :show-arrow="false">
            <template #trigger>
              <div
                class="flex cursor-pointer items-center gap-1 text-sm text-[--text-color] transition-colors hover:text-[#ff0050]">
                <i-mdi-filter-variant class="text-base" />
                <span>{{ t("home.user.history.filter") }}</span>
                <i-mdi-chevron-down />
              </div>
            </template>
            <div class="flex flex-col gap-5 p-3 text-sm">
              <div>
                <div class="mb-3 text-xs text-[--user-text-color]">{{ t("home.user.history.watchProgress") }}</div>
                <div class="flex flex-wrap gap-5">
                  <span
                    v-for="opt in filterOptions.progress"
                    class="cursor-pointer transition-colors"
                    :key="opt.value"
                    :class="
                      activeFilters.progress === opt.value
                        ? 'text-[#ff0050]'
                        : 'text-[--text-color] hover:text-[#ff0050]'
                    "
                    @click="activeFilters.progress = opt.value">
                    {{ opt.label }}
                  </span>
                </div>
              </div>
              <div>
                <div class="mb-3 text-xs text-[--user-text-color]">{{ t("home.user.history.videoDuration") }}</div>
                <div class="flex flex-wrap gap-5">
                  <span
                    v-for="opt in filterOptions.duration"
                    class="cursor-pointer transition-colors"
                    :key="opt.value"
                    :class="
                      activeFilters.duration === opt.value
                        ? 'text-[#ff0050]'
                        : 'text-[--text-color] hover:text-[#ff0050]'
                    "
                    @click="activeFilters.duration = opt.value">
                    {{ opt.label }}
                  </span>
                </div>
              </div>
              <div>
                <div class="mb-3 text-xs text-[--user-text-color]">{{ t("home.user.history.videoCategory") }}</div>
                <div class="flex flex-wrap gap-5">
                  <span
                    v-for="opt in filterOptions.category"
                    class="cursor-pointer transition-colors"
                    :key="opt.value"
                    :class="
                      activeFilters.category === opt.value
                        ? 'text-[#ff0050]'
                        : 'text-[--text-color] hover:text-[#ff0050]'
                    "
                    @click="activeFilters.category = opt.value">
                    {{ opt.label }}
                  </span>
                </div>
              </div>
            </div>
          </n-popover>
          <div class="h-3 w-px bg-[--line-color]"></div>
        </template>
        <div
          class="flex cursor-pointer items-center gap-1 text-[--disabled-color] transition-colors hover:text-red-500"
          @click="clearCurrentHistory">
          <i-mdi-delete-outline class="text-xl" />
        </div>
      </div>
    </div>

    <template v-if="historySubTab === 'users'">
      <n-scrollbar class="flex-grow pr-2">
        <div v-for="group in historyUsers" class="mb-2" :key="group.date">
          <div class="mb-3 text-xs font-medium text-[--user-text-color]">{{ group.date }}</div>
          <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            <history-user-card
              v-for="user in group.list"
              :key="user.id"
              :user="user"
              @toggle-follow="toggleFollow(user)" />
          </div>
        </div>
        <div v-if="historyUsers.length === 0" class="py-10 text-center text-sm text-[--disabled-color]">
          {{ t("home.user.history.noRecord") }}
        </div>
      </n-scrollbar>
    </template>

    <template v-else-if="historySubTab === 'videos'">
      <n-scrollbar class="flex-grow pr-2">
        <div v-for="group in historyVideos" class="mb-4" :key="group.date">
          <div class="mb-3 text-xs font-medium text-[--user-text-color]">{{ group.date }}</div>
          <div class="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <video-card v-for="video in group.list" :key="video.id" :video="video" />
          </div>
        </div>
        <div v-if="historyVideos.length === 0" class="py-10 text-center text-sm text-[--disabled-color]">
          {{ t("home.user.history.noRecord") }}
        </div>
      </n-scrollbar>
    </template>

    <template v-else-if="historySubTab === 'lives'">
      <n-scrollbar class="flex-grow pr-2">
        <div v-for="group in historyLives" class="mb-2" :key="group.date">
          <div class="mb-3 text-xs font-medium text-[--user-text-color]">{{ group.date }}</div>
          <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            <history-live-card
              v-for="live in group.list"
              :key="live.id"
              :live="live"
              @toggle-follow="toggleFollow(live)" />
          </div>
        </div>
        <div v-if="historyLives.length === 0" class="py-10 text-center text-sm text-[--disabled-color]">
          {{ t("home.user.history.noRecord") }}
        </div>
      </n-scrollbar>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const historySubTab = ref("users");
const historyVideoSearchQuery = ref("");
const historyUsers = ref([
  {
    date: "昨天",
    list: [
      {
        id: "1",
        name: "7.5H（看主页版）",
        avatar: "https://picsum.photos/seed/10/100",
        desc: "一个兴趣使然的傻了吧唧创作者",
        verified: false,
        unseenCount: 1,
        isFollowed: false
      }
    ]
  }
]);
const historyLives = ref([
  {
    date: "史早看过",
    list: [
      {
        id: "L1",
        name: "小红小蓝来了",
        avatar: "https://picsum.photos/seed/l1/100",
        desc: "软辅课堂开课啦！",
        statusText: "结束时间: 14:55",
        verified: false,
        isLiveNow: false,
        isFollowed: false
      }
    ]
  }
]);
const historyVideos = ref([
  {
    date: "今天",
    list: [
      {
        id: "hv1",
        title: "【厨神之招】从零开始...",
        coverUrl: "https://picsum.photos/seed/hv1/400/225",
        videoUrl: "",
        likes: 359,
        duration: 120
      }
    ]
  }
]);

const activeFilters = reactive({ progress: "all", duration: "all", category: "all" });
const filterOptions = computed(() => {
  return {
    progress: [
      { label: t("home.user.history.options.all"), value: "all" },
      { label: t("home.user.history.options.unseen"), value: "unseen" },
      { label: t("home.user.history.options.seen"), value: "seen" }
    ],
    duration: [
      { label: t("home.user.history.options.all"), value: "all" },
      { label: t("home.user.history.options.under1m"), value: "under_1m" },
      { label: t("home.user.history.options.under3m"), value: "1_to_3m" },
      { label: t("home.user.history.options.under10m"), value: "3_to_10m" },
      { label: t("home.user.history.options.over10m"), value: "over_10m" }
    ],
    // TODO: 获取视频分类列表
    category: [
      { label: t("home.user.history.options.all"), value: "all" },
      { label: "二次元", value: "anime" },
      { label: "音乐", value: "music" },
      { label: "体育", value: "sports" },
      { label: "电影", value: "movie" },
      { label: "游戏", value: "game" }
    ]
  };
});

/**
 * 切换关注状态
 * @param item 关注项
 */
const toggleFollow = (item: any) => {
  item.isFollowed = !item.isFollowed;
};

/** 清空当前历史记录 */
const clearCurrentHistory = () => {
  window.$dialog.warning({
    title: t("home.user.history.msg.clearHistory"),
    content: t("home.user.history.msg.confirmClearHistory"),
    positiveText: t("components.common.confirm"),
    negativeText: t("components.common.cancel"),
    onPositiveClick: () => {
      if (historySubTab.value === "users") historyUsers.value = [];
      else if (historySubTab.value === "lives") historyLives.value = [];
      else if (historySubTab.value === "videos") historyVideos.value = [];
      window.$message.success(t("home.user.history.msg.clearHistorySuccess"));
    }
  });
};
</script>
