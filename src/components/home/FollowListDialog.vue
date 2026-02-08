<template>
  <base-dialog v-model:show="dialogVisible">
    <template #header>
      <n-tabs v-model:value="activeTab" type="line" class="h-12 leading-12 mb-[-1px] w-full">
        <n-tab-pane name="following" :tab="`关注 (${userInfo?.userStats.followingCount})`" />
        <n-tab-pane name="followers" :tab="`粉丝 (${userInfo?.userStats.followerCount})`" />
      </n-tabs>
    </template>

    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索用户名或者YuanLive号"
          clearable
          class="w-[400px] border-(1px solid #90909080)">
          <template #prefix>
            <n-icon>
              <i-mdi-magnify />
            </n-icon>
          </template>
        </n-input>
        <n-dropdown v-if="activeTab === 'following'" trigger="click" :options="sortOptions">
          <n-button class="px-2 text-gray-600">
            <span>综合排序</span>
          </n-button>
        </n-dropdown>
      </div>
      <n-scrollbar class="h-[400px]">
        <div>
          <div
            v-for="user in displayUsers"
            :key="user.id"
            class="mr-4 flex items-center justify-between py-4 border-b border-gray-100">
            <div class="mr-3">
              <img :src="user.avatar" :alt="user.name" class="w-12 h-12 rounded-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1 mb-1">
                <span class="font-medium text-gray-800">{{ user.name }}</span>
                <span v-if="user.verified" class="text-blue-500">✓</span>
              </div>
              <div class="text-xs text-gray-600 truncate">{{ user.description }}</div>
            </div>
            <div class="ml-4">
              <n-button
                v-if="user.isFollowing"
                type="default"
                class="px-4 text-xs rounded-full bg-gray-100 text-gray-600">
                已关注
              </n-button>
              <n-button v-else type="primary" class="px-4 text-xs rounded-full">关注</n-button>
            </div>
          </div>
          <div v-if="displayUsers.length === 0" class="py-10 text-center">
            <n-empty description="暂无数据" />
          </div>
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
