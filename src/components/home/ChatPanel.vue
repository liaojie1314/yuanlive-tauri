<template>
  <div class="chat-area-wrapper relative flex min-h-0 flex-grow flex-col">
    <div class="chat-tabs flex min-w-0 shrink-0 border-b border-[--line-color]">
      <div
        v-for="tab in chatTabs"
        :key="tab.id"
        :class="[
          `mx-2 my-1 min-w-0 flex-1 cursor-pointer rounded-md py-1 text-center text-sm whitespace-nowrap transition-colors`,
          activeTab === tab.id
            ? 'border-b-2 border-red-500 bg-[--btn-secondary-border] font-medium text-[--left-active-text-color]'
            : 'text-[--left-text-color] hover:text-[--left-active-text-color]'
        ]"
        @click="activeTab = tab.id">
        <div class="flex min-w-0 items-center justify-center px-1">
          <span class="truncate">{{ tab.name }}</span>
          <span v-if="tab.count !== undefined" class="ml-1 flex-shrink-0 text-xs">({{ tab.count }})</span>
        </div>
      </div>
    </div>

    <div class="chat-content flex min-h-0 flex-grow flex-col overflow-hidden">
      <div
        class="audience-panels-wrapper relative h-[155px] shrink-0 overflow-hidden bg-[--home-bg-color] transition-all duration-300 hover:h-1/2"
        @mouseenter="showUserCard = true"
        @mouseleave="handleAudienceListLeave">
        <!-- 1. 全部 (All) Tab 内容 -->
        <div v-show="activeTab === 'all'" class="absolute inset-0 h-full">
          <n-scrollbar height="100%" ref="audienceScrollbar">
            <div class="p-2">
              <div
                v-for="(user, index) in audienceList"
                class="audience-item flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 hover:bg-[--bg-menu-hover]"
                :key="user.id">
                <div
                  :class="[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    index === 0
                      ? 'bg-yellow-500 text-white'
                      : index === 1
                        ? 'bg-gray-300 text-gray-800'
                        : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-[--bg-setting-item] text-[--text-color]'
                  ]">
                  {{ index + 1 }}
                </div>
                <user-info-popover :user="{ name: user.name, avatar: user.avatar, level: user.level }">
                  <div
                    class="h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-full border border-transparent transition-colors hover:border-[#ff0050]">
                    <img class="h-full w-full object-cover" :src="user.avatar" :alt="user.name" />
                  </div>
                </user-info-popover>
                <div class="min-w-0 flex-1">
                  <div class="flex min-w-0 items-center gap-1 text-sm text-[--text-color]">
                    <user-info-popover :user="{ name: user.name, avatar: user.avatar, level: user.level }">
                      <span class="cursor-pointer truncate transition-colors hover:text-[#ff0050]">
                        {{ user.name }}
                      </span>
                    </user-info-popover>
                    <span
                      v-if="user.medals && user.medals.length > 0"
                      class="flex-shrink-0 text-xs text-[--disabled-color]">
                      {{ user.medals.join(" ") }}
                    </span>
                  </div>
                  <div class="text-xs text-[--user-text-color]">{{ user.level }}</div>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>

        <!-- 2. 1000贡献用户 Tab 内容 -->
        <div v-show="activeTab === 'contributor'" class="absolute inset-0 h-full">
          <n-scrollbar height="100%">
            <div class="flex flex-col gap-6 p-4">
              <!-- 在线部分 -->
              <div>
                <div class="mb-4 text-center text-xs text-[--user-text-color]">
                  - 共{{ contributorData?.total || 0 }}位，当前在线{{ contributorData?.onlineCount || 0 }}位 -
                </div>
                <div class="grid grid-cols-5 gap-x-2 gap-y-4">
                  <template v-if="contributorData?.online?.length > 0">
                    <!-- 循环在线用户 -->
                  </template>
                  <template v-else>
                    <!-- 虚位以待 (增加了 whitespace-nowrap 和 shrink-0 防止被挤变形) -->
                    <div class="flex-col-x-center">
                      <div
                        class="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-purple-300 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <i-mdi-account class="h-7 w-7" />
                      </div>
                      <span class="text-xs whitespace-nowrap text-[--user-text-color]">虚位以待</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 不在线部分 -->
              <div>
                <div class="mb-4 text-center text-xs text-[--user-text-color]">- 以下贡献用户当前不在直播间 -</div>
                <div class="grid grid-cols-5 gap-x-2 gap-y-6">
                  <div v-for="user in contributorData?.offline || []" class="flex-col-x-center" :key="user.id">
                    <user-info-popover :user="user">
                      <div
                        class="relative h-12 w-12 shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80">
                        <img
                          class="h-full w-full rounded-full border border-[--line-color] object-cover"
                          :src="user.avatar" />
                        <!-- 等级徽章重叠在头像底部中间 -->
                        <div
                          class="absolute -bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-white bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 text-[9px] whitespace-nowrap text-white dark:border-gray-800">
                          <i-material-symbols-diamond class="h-2 w-2 text-yellow-200" />
                          {{ user.level }}
                        </div>
                      </div>
                    </user-info-popover>
                    <div class="mt-2 w-14 truncate text-center text-xs font-medium text-[--text-color]">
                      {{ user.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>

        <!-- 3. 高等级用户 Tab 内容 -->
        <div v-show="activeTab === 'vip'" class="absolute inset-0 h-full">
          <n-scrollbar height="100%">
            <div class="flex flex-col gap-6 p-4">
              <div v-for="(group, gIndex) in vipData" :key="gIndex">
                <div class="mb-4 pl-1 text-sm font-medium text-[--text-color]">
                  {{ group.title }} ({{ group.count }}人)
                </div>

                <div class="grid grid-cols-5 gap-x-2 gap-y-6">
                  <!-- 有数据时展示头像网格 -->
                  <template v-if="group.users.length > 0">
                    <div v-for="user in group.users" class="flex-col-x-center" :key="user.id">
                      <user-info-popover :user="user">
                        <div
                          class="relative h-12 w-12 shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80">
                          <img
                            class="h-full w-full rounded-full border border-[--line-color] object-cover"
                            :src="user.avatar" />
                          <div
                            class="absolute -bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-white bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 text-[9px] whitespace-nowrap text-white dark:border-gray-800">
                            <i-material-symbols-diamond class="h-2 w-2 text-yellow-200" />
                            {{ user.level }}
                          </div>
                        </div>
                      </user-info-popover>
                      <div class="mt-2 w-14 truncate text-center text-xs font-medium text-[--text-color]">
                        {{ user.name }}
                      </div>
                    </div>
                  </template>

                  <!-- 无数据时展示虚位以待 -->
                  <template v-else>
                    <div class="flex-col-x-center">
                      <div
                        class="mb-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-purple-300 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <i-mdi-account class="h-7 w-7" />
                      </div>
                      <span class="text-xs whitespace-nowrap text-[--user-text-color]">虚位以待</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>

      <div
        class="message-list relative min-h-0 flex-1 overflow-hidden border-t border-[--line-color] bg-[--home-bg-color] transition-all duration-300">
        <div v-if="showUserCard" class="user-info-card absolute top-0 right-0 left-0 z-10 transition-all duration-300">
          <slot name="user-info-card"></slot>
        </div>

        <n-scrollbar height="100%">
          <div class="p-2">
            <div class="system-message py-2 text-center">
              <div class="inline-block rounded-lg bg-[--bg-setting-item] px-3 py-1 text-xs text-[--user-text-color]">
                欢迎来到直播间！抖音严禁未成年人直播或礼物消费。严禁违法违规、低俗色情、吸烟酗酒、人身伤害等直播内容。理性消费，如主播在直播中以不当方式诱导消费，请谨慎辨别。切勿私下交易，以防人财两失，谨防网络诈骗。
              </div>
            </div>

            <div v-for="(message, index) in chatMessages" class="message-item py-2" :key="index">
              <div class="flex items-start gap-2">
                <user-info-popover :user="{ name: message.user, avatar: message.avatar, level: message.level }">
                  <div
                    class="mt-0.5 h-6 w-6 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border border-transparent transition-colors hover:border-[#ff0050]">
                    <img class="h-full w-full object-cover" :src="message.avatar" :alt="message.user" />
                  </div>
                </user-info-popover>
                <div class="min-w-0 flex-1">
                  <div class="flex-y-center gap-1">
                    <user-info-popover :user="{ name: message.user, avatar: message.avatar, level: message.level }">
                      <span
                        class="cursor-pointer truncate text-xs font-medium text-[--text-color] transition-colors hover:text-[#ff0050]">
                        {{ message.user }}
                      </span>
                    </user-info-popover>
                    <span v-if="message.level" class="flex-shrink-0 text-xs text-[--disabled-color]">
                      {{ message.level }}
                    </span>
                  </div>
                  <div class="word-break-all mt-1 text-sm text-[--text-color]">{{ message.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </div>

    <div class="chat-input-area shrink-0 border-t border-[--line-color] p-3">
      <div class="danmaku-input-wrapper !bg-[--left-item-bg-color]">
        <div
          class="emoji-btn hover:bg-[--action-bar-icon-hover]"
          @mouseenter="showEmojiPickerHover"
          @mouseleave="hideEmojiPickerHover">
          <i-mdi-emoticon-outline class="emoji-icon !text-[--action-bar-icon-color]" />
        </div>
        <input
          type="text"
          placeholder="与大家互动一下..."
          class="danmaku-input-field !text-[--text-color] placeholder:!text-[--disabled-color]"
          v-model="messageInput"
          @keyup.enter="handleSend" />
        <div class="send-btn shrink-0" @click="handleSend">
          <i-mdi-send class="send-icon" />
        </div>

        <div
          v-if="showEmojiPicker"
          class="emoji-picker-wrapper"
          :style="[{ bottom: 'calc(100% + 12px)', left: '0' }, emojiPickerStyle]"
          @mouseenter="handleEmojiPickerEnter"
          @mouseleave="handleEmojiPickerLeave">
          <emoji-picker @select-emoji="handleSelectEmoji" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  audienceList: any[];
  chatMessages: any[];
  emojiPickerStyle?: Record<string, string | number>;
}>();

const emit = defineEmits<(e: "send-message", content: string) => void>();

const activeTab = ref("all");
const chatTabs = [
  { id: "all", name: "全部" },
  { id: "contributor", name: "1000贡献用户", count: 0 },
  { id: "vip", name: "高等级用户" }
];

const contributorData = ref({
  total: 4,
  onlineCount: 0,
  online: [],
  offline: [
    { id: 101, name: "cc喵", avatar: "https://picsum.photos/id/101/100/100", level: 29 },
    { id: 102, name: "财宝ovo", avatar: "https://picsum.photos/id/102/100/100", level: 40 },
    { id: 103, name: "kikitty", avatar: "https://picsum.photos/id/103/100/100", level: 40 },
    { id: 104, name: "入梦不...", avatar: "https://picsum.photos/id/104/100/100", level: 43 }
  ]
});

const vipData = ref([
  {
    title: "51级以上观众",
    count: 0,
    users: []
  },
  {
    title: "41级以上观众",
    count: 1,
    users: [{ id: 201, name: "怒怒不...", avatar: "https://picsum.photos/id/201/100/100", level: 45 }]
  },
  {
    title: "31级以上观众",
    count: 15,
    users: [
      { id: 301, name: "dān.", avatar: "https://picsum.photos/id/301/100/100", level: 31 },
      { id: 302, name: "me", avatar: "https://picsum.photos/id/302/100/100", level: 31 },
      { id: 303, name: "柚夏", avatar: "https://picsum.photos/id/303/100/100", level: 33 },
      { id: 304, name: "🌈小乔...", avatar: "https://picsum.photos/id/304/100/100", level: 37 },
      { id: 305, name: "小迷糊...", avatar: "https://picsum.photos/id/305/100/100", level: 35 }
    ]
  }
]);

const showUserCard = ref(false);
const audienceScrollbar = ref<any>(null);
const messageInput = ref("");
const showEmojiPicker = ref(false);
let emojiPickerHideTimer: number | null = null;

const handleAudienceListLeave = () => {
  showUserCard.value = false;
  // 滚动到顶部，显示前三名观众
  setTimeout(() => {
    if (audienceScrollbar.value) {
      audienceScrollbar.value.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }, 300);
};

const showEmojiPickerHover = () => {
  showEmojiPicker.value = true;
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
    emojiPickerHideTimer = null;
  }
};

const hideEmojiPickerHover = () => {
  if (emojiPickerHideTimer) clearTimeout(emojiPickerHideTimer);
  emojiPickerHideTimer = window.setTimeout(() => {
    showEmojiPicker.value = false;
    emojiPickerHideTimer = null;
  }, 100);
};

const handleEmojiPickerEnter = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
    emojiPickerHideTimer = null;
  }
};

const handleEmojiPickerLeave = () => {
  if (emojiPickerHideTimer) clearTimeout(emojiPickerHideTimer);
  emojiPickerHideTimer = window.setTimeout(() => {
    showEmojiPicker.value = false;
    emojiPickerHideTimer = null;
  }, 100);
};

const handleSelectEmoji = (emoji: string) => {
  messageInput.value += emoji;
  showEmojiPicker.value = false;
};

const handleSend = () => {
  if (!messageInput.value.trim()) return;
  emit("send-message", messageInput.value);
  messageInput.value = "";
};
</script>

<style scoped>
.danmaku-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 18px;
  padding: 6px;
  position: relative;
  width: 100%;
}

.emoji-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.emoji-icon {
  width: 18px;
  height: 18px;
}

.danmaku-input-field {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  padding: 6px 0;
  max-width: none;
  width: 100%;
}

.send-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ff0050;
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover {
  background-color: #ff1a60;
  transform: scale(1.05);
}

.send-btn:active {
  transform: scale(0.95);
}

.send-icon {
  width: 16px;
  height: 16px;
}

.emoji-picker-wrapper {
  position: absolute;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background-color: var(--bg-popover, #fff);
}
</style>
