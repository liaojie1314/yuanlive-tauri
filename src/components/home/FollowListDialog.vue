<template>
  <base-dialog v-model:show="dialogVisible">
    <template #header>
      <n-tabs v-model:value="activeTab" type="line" class="h-12 leading-12 mb-[-1px] w-full">
        <n-tab-pane name="following" :tab="`关注 (${userInfo?.userStats.followingCount || 0})`" />
        <n-tab-pane name="followers" :tab="`粉丝 (${userInfo?.userStats.followerCount || 0})`" />
      </n-tabs>
    </template>

    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索用户名"
          clearable
          class="w-[360px] border-(1px solid #90909080)">
          <template #prefix>
            <i-mdi-magnify class="text-[--disabled-color]" />
          </template>
        </n-input>
        <n-dropdown v-if="activeTab === 'following'" trigger="click" :options="sortOptions">
          <n-button quaternary class="text-[--user-text-color]">综合排序</n-button>
        </n-dropdown>
      </div>

      <n-scrollbar class="max-h-[450px] pr-2">
        <div class="divide-y divide-[--line-color]">
          <div
            v-for="user in displayUsers"
            :key="user.id"
            class="flex items-center justify-between py-4 transition-colors hover:bg-[--bg-left-menu-hover] rounded-lg px-2">
            <div class="flex items-center flex-1 min-w-0">
              <img :src="user.avatar" class="w-12 h-12 rounded-full object-cover border border-[--line-color]" />
              <div class="ml-3 flex-1 min-w-0">
                <div class="flex items-center gap-1 mb-0.5">
                  <span class="font-medium text-[--text-color]">{{ user.name }}</span>
                  <i-mdi-check-decagram v-if="user.verified" class="text-blue-500 text-sm" />
                </div>
                <div class="text-xs text-[--user-text-color] truncate">{{ user.description }}</div>
              </div>
            </div>
            <div class="ml-4">
              <n-button
                v-if="user.isFollowing"
                round
                size="small"
                class="bg-[--left-item-bg-color] text-[--user-text-color] border-none">
                已关注
              </n-button>
              <n-button v-else round size="small" type="primary">关注</n-button>
            </div>
          </div>
        </div>
        <div v-if="displayUsers.length === 0" class="py-10">
          <n-empty description="暂无内容" />
        </div>
      </n-scrollbar>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
import { useUserStore } from "@/stores/user";

interface User {
  id: string;
  name: string;
  avatar: string;
  description: string;
  verified: boolean;
  isFollowing: boolean;
}

interface Props {
  show: boolean;
  activeTab?: "following" | "followers";
}

const { userInfo } = useUserStore();

const props = withDefaults(defineProps<Props>(), {
  activeTab: "following"
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  "update:activeTab": [value: "following" | "followers"];
}>();

// 模拟关注列表数据
const followingList = ref<User[]>([]);
// 模拟粉丝列表数据
const followersList = ref<User[]>([]);

// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

const activeTab = computed({
  get: () => props.activeTab,
  set: (value) => emit("update:activeTab", value)
});

const searchQuery = ref("");

// 排序选项
const sortOptions = ref([
  { label: "综合排序", key: "comprehensive" },
  { label: "关注时间", key: "followTime" },
  { label: "粉丝数量", key: "followerCount" }
]);

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
