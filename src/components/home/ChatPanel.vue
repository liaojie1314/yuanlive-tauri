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
                class="audience-item flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-[--bg-menu-hover]"
                :key="user.id">
                <div
                  :class="[
                    'w-5 shrink-0 text-center text-base font-bold',
                    index === 0
                      ? 'text-[#ff2e55]'
                      : index === 1
                        ? 'text-[#ff6a38]'
                        : index === 2
                          ? 'text-[#f1a629]'
                          : 'text-[#999999]'
                  ]">
                  {{ index + 1 }}
                </div>

                <user-info-popover :user="{ name: user.name, avatar: user.avatar, level: user.level }">
                  <div
                    class="h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-full border border-transparent transition-colors hover:border-[#ff0050]">
                    <img class="h-full w-full object-cover" :src="user.avatar" :alt="user.name" />
                  </div>
                </user-info-popover>

                <div class="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-[--text-color]">
                  <user-info-popover
                    class="shrink-0 max-w-[80px]"
                    :user="{ name: user.name, avatar: user.avatar, level: user.level }">
                    <span class="block cursor-pointer truncate transition-colors hover:text-[#ff0050]">
                      {{ user.name }}
                    </span>
                  </user-info-popover>

                  <span
                    v-if="user.level"
                    class="flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-[2px] text-[9px] text-white">
                    <i-material-symbols-diamond class="h-2 w-2 text-yellow-200" />
                    {{ user.level }}
                  </span>

                  <span
                    v-if="user.isVip"
                    class="flex shrink-0 items-center justify-center rounded-[4px] bg-gradient-to-r from-[#d18758] to-[#b35728] px-1.5 py-[2px] text-[9px] font-bold text-white">
                    <span class="font-serif italic mr-[1px]">V</span>
                  </span>

                  <span
                    v-if="user.fanClubLevel || user.medals"
                    class="flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#ffb43b] to-[#ff7820] py-[2px] pl-[2px] pr-2 text-[9px] text-white">
                    <span
                      class="flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#4281ff]">
                      {{ user.fanClubLevel || "9" }}
                    </span>
                    <span class="font-medium">{{ user.fanClubName || "狗远洛" }}</span>
                  </span>
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
                        class="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-purple-300 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <i-mdi-account />
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
                        class="relative h-8 w-8 shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80">
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
                          class="relative h-8 w-8 shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80">
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
                        class="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-200 bg-purple-100 text-purple-300 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <i-mdi-account />
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
        <transition name="slide-entrance">
          <div
            v-if="currentEntrance"
            :class="[
              'absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-full py-[3px] pr-3 pl-1 text-[13px] text-white shadow-md',
              currentEntrance.isVip
                ? 'bg-gradient-to-r from-[#fbcc52] to-[#f4852d]' // VIP专属金橘色渐变气泡
                : 'bg-gradient-to-r from-[#7a9cf8] to-[#aa8ef5]' // 普通/粉丝团蓝紫色渐变气泡
            ]">
            <div
              v-if="currentEntrance.isVip"
              class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-red-500 font-serif text-[11px] font-bold italic text-white border border-white/50 shadow-sm">
              V
            </div>

            <div
              v-else-if="currentEntrance.level"
              class="flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-[2px] text-[9px] font-bold text-white border border-white/30 shadow-sm">
              <i-material-symbols-diamond class="h-2 w-2 text-yellow-200" />
              {{ currentEntrance.level }}
            </div>

            <span class="font-medium truncate max-w-[120px]">{{ currentEntrance.name }}</span>
            <span class="text-xs opacity-90 whitespace-nowrap">加入了直播间</span>
          </div>
        </transition>

        <transition name="fade">
          <div
            v-if="unreadCount > 0"
            class="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-red-500 shadow-[0_2px_8px_rgba(255,0,80,0.2)] dark:border dark:border-gray-700 dark:bg-gray-800"
            @click="scrollToBottom">
            <span>{{ unreadCount }} 条新消息</span>
            <i-mdi-chevron-double-down class="h-3 w-3" />
          </div>
        </transition>

        <transition name="list-fade" mode="out-in">
          <div
            v-if="currentNotification"
            class="absolute bottom-2 left-2 z-10 pointer-events-auto"
            :key="currentNotification.id">
            <template v-if="currentNotification.type === 'gift'">
              <div
                class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-50/95 to-pink-50/95 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:from-[#2e3450]/80 dark:to-[#422e40]/80 border border-transparent">
                <div
                  v-if="currentNotification.level"
                  class="flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-[2px] text-[9px] text-white">
                  <i-material-symbols-diamond class="h-2 w-2 text-yellow-200" />
                  {{ currentNotification.level }}
                </div>

                <span class="text-xs font-medium text-[#4db2d8] dark:text-[#7ba9be] truncate max-w-[80px]">
                  {{ currentNotification.user }}
                </span>
                <span class="text-xs text-[--text-color]">
                  送出了
                  <span class="text-orange-400 font-medium">{{ currentNotification.giftName || "礼物" }}</span>
                </span>
                <img
                  v-if="currentNotification.giftIcon"
                  class="h-5 w-5 object-contain drop-shadow-sm"
                  :src="currentNotification.giftIcon" />
                <span class="text-xs font-black italic text-[#f8a61b]">x{{ currentNotification.giftCount || 1 }}</span>
              </div>
            </template>

            <template v-else-if="currentNotification.type === 'enter'">
              <div
                class="inline-flex items-center gap-1.5 rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 backdrop-blur-sm">
                <span class="text-xs text-[--text-color]">{{ currentNotification.user }} 来了</span>
              </div>
            </template>

            <template v-else-if="currentNotification.type === 'like'">
              <div
                class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 dark:from-pink-900/30 dark:to-rose-900/30 px-3 py-1 backdrop-blur-sm border border-red-100 dark:border-red-900/50">
                <span class="text-xs text-[--text-color]">{{ currentNotification.user }} 点赞了</span>
                <i-mdi-heart class="h-3 w-3 text-red-500" />
              </div>
            </template>
          </div>
        </transition>

        <div v-if="showUserCard" class="user-info-card absolute top-0 right-0 left-0 z-30 transition-all duration-300">
          <slot name="user-info-card"></slot>
        </div>

        <n-scrollbar height="100%" ref="chatScrollbar" @scroll="handleChatScroll">
          <div class="p-2">
            <div class="system-message py-2 text-center">
              <div
                class="inline-block rounded-lg bg-[--bg-setting-item] px-3 py-1 text-[11px] leading-relaxed text-[--user-text-color]">
                欢迎来到直播间！抖音严禁未成年人直播或礼物消费。严禁违法违规、低俗色情、吸烟酗酒、人身伤害等直播内容。理性消费，如主播在直播中以不当方式诱导消费，请谨慎辨别。切勿私下交易，以防人财两失，谨防网络诈骗。
              </div>
            </div>

            <div v-for="(message, index) in chatMessages" class="message-item py-1" :key="index">
              <template v-if="message.type === 'system'">
                <div class="text-[13px] leading-[22px] text-[#f1a629]">
                  <span class="align-middle">恭喜</span>

                  <span class="inline-flex items-center align-middle mx-1 gap-1">
                    <span
                      v-if="message.level"
                      class="flex h-2 shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-[2px] text-[9px] text-white">
                      <i-material-symbols-diamond class="h-2 w-2 text-yellow-200" />
                      {{ message.level }}
                    </span>
                    <span
                      v-if="message.isVip"
                      class="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-red-500 font-serif text-[9px] font-bold italic text-white">
                      V
                    </span>
                  </span>

                  <user-info-popover
                    class="inline-block align-middle"
                    :user="{ name: message.user, avatar: message.avatar, level: message.level }">
                    <span class="cursor-pointer font-medium transition-colors hover:text-[#ff0050]">
                      {{ message.user }}
                    </span>
                  </user-info-popover>

                  <span class="ml-1 break-words align-middle">{{ message.content }}</span>
                </div>
              </template>

              <template v-else>
                <div class="flex items-start gap-2">
                  <div class="min-w-0 flex-1 text-[13px] leading-[22px] text-[--text-color]">
                    <span class="inline-flex items-center align-middle mr-1 gap-1">
                      <span
                        v-if="message.fanClubLevel"
                        class="flex shrink-0 items-center gap-0.5 rounded-sm bg-gradient-to-r from-orange-400 to-red-400 px-1 py-[2px] text-[9px] text-white">
                        <i-mdi-heart class="h-2 w-2" />
                        {{ message.fanClubLevel }}
                      </span>

                      <span
                        v-if="message.level"
                        class="flex h-2 shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-1.5 py-[2px] text-[9px] text-white">
                        <i-material-symbols-diamond class="h-2 w-2 text-yellow-200" />
                        {{ message.level }}
                      </span>

                      <span
                        v-if="message.isVip"
                        class="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-red-500 font-serif text-[9px] font-bold italic text-white">
                        V
                      </span>
                    </span>

                    <user-info-popover
                      class="inline-block align-middle"
                      :user="{ name: message.user, avatar: message.avatar, level: message.level }">
                      <span
                        class="cursor-pointer text-[#4db2d8] dark:text-[#7ba9be] font-medium transition-colors hover:text-[#ff0050]">
                        {{ message.user }}
                        <span class="text-[--user-text-color] ml-[1px]">：</span>
                      </span>
                    </user-info-popover>

                    <template v-if="message.type === 'gift'">
                      <span class="ml-1 break-words align-middle font-medium text-[#f1a629]">
                        送出了
                        <img
                          v-if="message.giftIcon"
                          class="inline-block h-[18px] w-[18px] align-middle object-contain mx-0.5 drop-shadow-sm"
                          :src="message.giftIcon" />
                        <span class="font-bold">x {{ message.giftCount || 1 }}</span>
                      </span>
                    </template>

                    <template v-else-if="message.type === 'vip_open'">
                      <span class="ml-1 break-words align-middle font-medium text-[#f1a629]">开通了会员</span>
                    </template>

                    <template v-else>
                      <span class="ml-1 break-words align-middle">{{ message.content }}</span>
                    </template>
                  </div>
                </div>
              </template>
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
const props = defineProps<{
  audienceList: any[];
  chatMessages: any[];
  emojiPickerStyle?: Record<string, string | number>;
}>();

const emit = defineEmits<(e: "send-message", content: string) => void>();

const chatTabs = [
  { id: "all", name: "全部" },
  { id: "contributor", name: "1000贡献用户", count: 0 },
  { id: "vip", name: "高等级用户" }
];
let emojiPickerHideTimer: number | null = null;
let notificationTimer: number | null = null;
let entranceTimer: number | null = null;

const activeTab = ref("all");
const chatScrollbar = ref<any>(null);
const unreadCount = ref(0);
const isAtBottom = ref(true);
const currentEntrance = ref<any>(null);
const entranceQueue = ref<any[]>([]);
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
const currentNotification = ref<any>(null);

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

const handleChatScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  // 计算距离底部的距离 (容差设为 20px)
  const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
  isAtBottom.value = distanceToBottom <= 20;

  if (isAtBottom.value) {
    unreadCount.value = 0; // 滑到底部时清空未读提示
  }
};

const scrollToBottom = () => {
  if (chatScrollbar.value) {
    chatScrollbar.value.scrollTo({ position: "bottom", behavior: "smooth" });
    unreadCount.value = 0;
    isAtBottom.value = true;
  }
};

const processEntranceQueue = () => {
  if (currentEntrance.value || entranceQueue.value.length === 0) return;
  currentEntrance.value = entranceQueue.value.shift();
  // 悬停 3 秒后出场
  entranceTimer = window.setTimeout(() => {
    currentEntrance.value = null;
    // 等待离场动画播放完毕后，再处理下一个
    setTimeout(processEntranceQueue, 800);
  }, 3000);
};

// 暴露一个方法供父组件(LivePlay)调用，或者自行监听 WebSocket 事件
const triggerEntrance = (user: any) => {
  entranceQueue.value.push(user);
  processEntranceQueue();
};

// 监听消息数组变化，判断是否需要自动滚动或增加未读
watch(
  () => props.chatMessages.length,
  () => {
    if (isAtBottom.value) {
      nextTick(() => {
        scrollToBottom();
      });
    } else {
      unreadCount.value++;
    }
  }
);

// 暴露给父组件或 WebSocket 使用的推送通知方法（进房、送礼、点赞）
const pushNotification = (message: any) => {
  // 每次推新消息直接覆盖，保证最多同时出现一个
  currentNotification.value = { ...message, id: Date.now() + Math.random() };

  if (notificationTimer) clearTimeout(notificationTimer);

  // 3秒后自动消失
  notificationTimer = window.setTimeout(() => {
    currentNotification.value = null;
  }, 3000);
};

// (测试用) 模拟推送送礼、进房、点赞消息
onMounted(() => {
  setTimeout(() => {
    // 1. 测试 VIP：显示 V 图标，气泡变金黄色
    triggerEntrance({ name: "毛仔ᴹᶻ", level: 38, isVip: true });

    // 2. 测试 普通财富用户：显示钻石和财富等级，气泡变蓝紫色
    setTimeout(() => {
      triggerEntrance({ name: "路人甲", level: 22, isVip: false });
    }, 4000);
  }, 2000);

  // 模拟下方的悬浮送礼和进房消息
  setTimeout(() => {
    setTimeout(() => {
      pushNotification({
        type: "gift",
        user: "大德",
        level: 31,
        giftName: "小心心",
        giftCount: 15,
        giftIcon: "https://picsum.photos/id/10/20/20"
      });
    }, 500);

    setTimeout(() => {
      pushNotification({ type: "enter", user: "李四", level: 12 });
    }, 4500); // 4.5秒后覆盖上一条

    // 触发一个点赞通知 (测试用)
    setTimeout(() => {
      pushNotification({ type: "like", user: "卿卿" });
    }, 8500);
  }, 2000);
});

onUnmounted(() => {
  if (entranceTimer) clearTimeout(entranceTimer);
  if (notificationTimer) clearTimeout(notificationTimer);
});
</script>

<style scoped lang="scss">
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

/* 进场动画：从右侧进入，向左侧离开 */
.slide-entrance-enter-active,
.slide-entrance-leave-active {
  transition:
    transform 0.8s cubic-bezier(0.25, 1, 0.5, 1),
    opacity 0.8s;
}
.slide-entrance-enter-from {
  transform: translateX(300px); /* 从容器右侧外飞入 */
  opacity: 0;
}
.slide-entrance-leave-to {
  transform: translateX(-100%); /* 飞向容器左侧外 */
  opacity: 0;
}

/* 新消息气泡渐隐渐出 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* 左下角单条悬浮消息动画 */
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.list-fade-enter-from {
  opacity: 0;
  transform: translateX(-30px); /* 从左边滑入 */
}
.list-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px); /* 向上飘出消失 */
}
</style>
