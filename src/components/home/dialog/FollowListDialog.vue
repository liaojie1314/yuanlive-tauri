<template>
  <base-dialog v-model:show="dialogVisible" :title="t('dialog.followList.title')">
    <template #header>
      <n-tabs type="line" class="mb-[-1px] h-12 w-full leading-12" v-model:value="activeTab">
        <n-tab-pane
          name="following"
          :tab="t('dialog.followList.following', { count: userInfo?.userStats.followingCount || 0 })" />
        <n-tab-pane
          name="followers"
          :tab="t('dialog.followList.followers', { count: userInfo?.userStats.followerCount || 0 })" />
      </n-tabs>
    </template>

    <div class="space-y-5">
      <div class="flex-between-center">
        <n-input
          clearable
          class="border-(1px solid #90909080) w-[360px]"
          v-model:value="searchQuery"
          :placeholder="t('dialog.followList.placeholder')">
          <template #prefix>
            <i-mdi-magnify class="text-[--disabled-color]" />
          </template>
        </n-input>
        <n-dropdown v-if="activeTab === 'following'" trigger="click" :options="sortOptions">
          <n-button quaternary class="text-[--user-text-color]">
            {{ t("dialog.followList.sortOption.sort") }}
          </n-button>
        </n-dropdown>
      </div>

      <n-scrollbar class="max-h-[450px] pr-2">
        <div class="divide-y divide-[--line-color]">
          <div
            v-for="user in displayUsers"
            class="flex-between-center rounded-lg px-2 py-4 transition-colors hover:bg-[--bg-left-menu-hover]"
            :key="user.id">
            <div class="flex min-w-0 flex-1 items-center">
              <img class="h-12 w-12 rounded-full border border-[--line-color] object-cover" :src="user.avatar" />
              <div class="ml-3 min-w-0 flex-1">
                <div class="mb-0.5 flex-y-center gap-1">
                  <span class="font-medium text-[--text-color]">{{ user.name }}</span>
                  <i-mdi-check-decagram v-if="user.verified" class="text-sm text-blue-500" />
                </div>
                <div class="truncate text-xs text-[--user-text-color]">{{ user.description }}</div>
              </div>
            </div>
            <div class="ml-4">
              <n-button
                v-if="user.isFollowing"
                round
                size="small"
                class="border-none bg-[--left-item-bg-color] text-[--user-text-color]">
                {{ t("dialog.followList.followed") }}
              </n-button>
              <n-button v-else round size="small" type="primary">{{ t("dialog.followList.follow") }}</n-button>
            </div>
          </div>
        </div>
        <div v-if="displayUsers.length === 0" class="py-10">
          <n-empty :description="t('dialog.followList.noContent')" />
        </div>
      </n-scrollbar>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/stores/user.ts";

const { t } = useI18n();
const { userInfo } = useUserStore();

interface Props {
  show: boolean;
  activeTab?: "following" | "followers";
}

const props = withDefaults(defineProps<Props>(), {
  activeTab: "following"
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  "update:activeTab": [value: "following" | "followers"];
}>();

interface User {
  id: string;
  name: string;
  avatar: string;
  description: string;
  verified: boolean;
  isFollowing: boolean;
}

// 关注列表
const followingList = ref<User[]>([]);
// 粉丝列表
const followersList = ref<User[]>([]);
// 排序选项
const sortOptions = ref([
  { label: t("dialog.followList.sortOption.sort"), key: "comprehensive" },
  { label: t("dialog.followList.sortOption.followTime"), key: "followTime" },
  { label: t("dialog.followList.sortOption.followerCount"), key: "followerCount" }
]);
const searchQuery = ref("");

// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

const activeTab = computed({
  get: () => props.activeTab,
  set: (value) => emit("update:activeTab", value)
});

// 根据当前Tab和搜索条件过滤用户列表
const displayUsers = computed(() => {
  const list = activeTab.value === "following" ? followingList.value : followersList.value;
  if (!searchQuery.value) return list;

  const query = searchQuery.value.toLowerCase();
  return list.filter(
    (user) => user.name.toLowerCase().includes(query) || user.description.toLowerCase().includes(query)
  );
});

// 清理函数
onUnmounted(() => {
  // 清理引用
  followingList.value = [];
  followersList.value = [];
});
</script>
