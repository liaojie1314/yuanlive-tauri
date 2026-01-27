<template>
  <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg">
    <div class="flex items-center gap-5 justify-between">
      <div class="shrink-0">
        <img
          :src="avatar"
          :alt="`${name}的头像`"
          class="w-24 h-24 rounded-full border-3 border-white shadow-lg object-cover"
          loading="lazy" />
      </div>
      <div class="flex flex-col gap-2 flex-1">
        <div class="flex items-center gap-2">
          <span
            class="text-2xl font-semibold text-gray-800 cursor-pointer hover:text-blue-500 transition-colors"
            @click="openEditDialog">
            {{ name }}
          </span>
          <span v-if="verified" class="text-blue-500 text-xl font-bold">✓</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('following')">
            关注
            <span class="text-gray-800 font-medium">{{ formattedFollowing }}</span>
          </span>
          <span class="text-gray-200 mx-1">|</span>
          <span
            v-if="liveUsers > 0"
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500 text-red-500">
            {{ formattedLiveUsers }}人正在直播
          </span>
          <span v-if="liveUsers > 0" class="text-gray-200 mx-1">|</span>
          <span
            class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500"
            @click="openFollowDialog('followers')">
            粉丝
            <span class="text-gray-800 font-medium">{{ formattedFollowers }}</span>
          </span>
          <span class="text-gray-200 mx-1">|</span>
          <span class="special-style cursor-pointer transition-colors duration-200 hover:text-blue-500">
            获赞
            <span class="text-gray-800 font-medium">{{ formattedLikes }}</span>
          </span>
        </div>
        <div class="text-sm text-gray-600">
          <span class="mr-2">YuanLive号:</span>
          <span class="font-medium text-gray-800">{{ yuanliveId }}</span>
        </div>
      </div>
      <div class="flex items-center justify-end">
        <div class="flex items-center gap-2.5 text-sm text-gray-600">
          <span class="whitespace-nowrap">保存登录信息</span>
          <n-switch :value="localSaveLoginInfo" @update:value="handleSaveLoginInfoChange" />
        </div>
      </div>
    </div>

    <follow-list-dialog
      v-model:show="dialogVisible"
      v-model:active-tab="activeTab"
      :following-count="following"
      :followers-count="followers"
      :following-list="followingList"
      :followers-list="followersList" />

    <edit-profile-dialog v-model:show="editDialogVisible" :name="name" :avatar="avatar" @save="saveProfile" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string;
  avatar: string;
  verified?: boolean;
  following: number;
  followers: number;
  likes: number;
  liveUsers: number;
  yuanliveId?: string;
  saveLoginInfo?: boolean;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  description: string;
  verified: boolean;
  isFollowing: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  saveLoginInfo: false
});

const emit = defineEmits<{
  "update:saveLoginInfo": [value: boolean];
}>();

// 使用本地ref来处理双向绑定
const localSaveLoginInfo = ref(props.saveLoginInfo);

// 对话框状态
const dialogVisible = ref(false);
const activeTab = ref<"following" | "followers">("following");

// 编辑资料对话框状态
const editDialogVisible = ref(false);

// 计算属性：格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + "万";
  }
  return num.toString();
};

// 格式化后的数字
const formattedFollowing = computed(() => formatNumber(props.following));
const formattedFollowers = computed(() => formatNumber(props.followers));
const formattedLikes = computed(() => formatNumber(props.likes));
const formattedLiveUsers = computed(() => formatNumber(props.liveUsers));

// 监听props变化，更新本地ref
watch(
  () => props.saveLoginInfo,
  (newVal) => {
    localSaveLoginInfo.value = newVal;
  },
  { immediate: true }
);

// 处理开关变化，发射事件
const handleSaveLoginInfoChange = (value: boolean) => {
  localSaveLoginInfo.value = value;
  emit("update:saveLoginInfo", value);
};

// 打开关注/粉丝对话框
const openFollowDialog = (tab: "following" | "followers") => {
  activeTab.value = tab;
  dialogVisible.value = true;
};

// 打开编辑资料对话框
const openEditDialog = () => {
  editDialogVisible.value = true;
};

// 保存资料
const saveProfile = (data: { name: string; description: string; password?: string }) => {
  console.log("保存资料:", data);
};

// 模拟关注列表数据
const followingList = ref<User[]>([
  {
    id: "1",
    name: "皇甫极",
    avatar: "https://picsum.photos/id/1/200/200",
    description: "呆呆Ruanua@漫迷菌 直播时间: 21:00",
    verified: false,
    isFollowing: true
  },
  {
    id: "2",
    name: "中国军号",
    avatar: "https://picsum.photos/id/2/200/200",
    description: "解放军新闻传播中心官方账号",
    verified: true,
    isFollowing: true
  },
  {
    id: "3",
    name: "春娇与志明",
    avatar: "https://picsum.photos/id/3/200/200",
    description: "没有什么心情是一首歌解决不了的❤️",
    verified: false,
    isFollowing: true
  },
  {
    id: "4",
    name: "阿Z想不开了",
    avatar: "https://picsum.photos/id/4/200/200",
    description: "原创音乐人",
    verified: true,
    isFollowing: true
  },
  {
    id: "5",
    name: "富贵哥",
    avatar: "https://picsum.photos/id/5/200/200",
    description: "智慧双全富贵哥切片，好看的皮囊千篇一律，有趣的灵魂万里挑一",
    verified: false,
    isFollowing: true
  }
]);

// 模拟粉丝列表数据
const followersList = ref<User[]>([
  {
    id: "6",
    name: "小甜豆",
    avatar: "https://picsum.photos/id/6/200/200",
    description: "喜欢音乐和美食",
    verified: false,
    isFollowing: false
  },
  {
    id: "7",
    name: "电竞大神",
    avatar: "https://picsum.photos/id/7/200/200",
    description: "游戏主播，专注王者荣耀",
    verified: true,
    isFollowing: false
  }
]);

// 清理函数
onUnmounted(() => {
  // 清理引用
  followingList.value = [];
  followersList.value = [];
});
</script>

<style scoped lang="scss">
.special-style {
  background: linear-gradient(to right, #ec695c, #61c454) no-repeat left bottom;
  background-size: 0 2px;
  transition: background-size 800ms;
}

.special-style:hover {
  background-position-x: left;
  background-size: 100% 2px;
}
</style>
