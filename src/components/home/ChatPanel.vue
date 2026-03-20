<template>
  <div class="chat-area-wrapper flex-grow flex flex-col min-h-0 relative">
    <div class="chat-tabs flex border-b border-[--line-color] min-w-0 shrink-0">
      <div
        v-for="tab in chatTabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex-1 py-1 my-1 mx-2 text-center text-sm transition-colors whitespace-nowrap min-w-0 cursor-pointer rounded-md',
          activeTab === tab.id
            ? 'text-[--left-active-text-color] bg-[--btn-secondary-border] font-medium border-b-2 border-red-500'
            : 'text-[--left-text-color] hover:text-[--left-active-text-color]'
        ]">
        <div class="flex items-center justify-center px-1 min-w-0">
          <span class="truncate">{{ tab.name }}</span>
          <span v-if="tab.count !== undefined" class="text-xs ml-1 flex-shrink-0">({{ tab.count }})</span>
        </div>
      </div>
    </div>

    <div class="chat-content flex-grow flex flex-col overflow-hidden min-h-0">
      <div
        class="audience-list h-[155px] overflow-hidden transition-all duration-300 hover:h-1/2 shrink-0"
        @mouseenter="showUserCard = true"
        @mouseleave="handleAudienceListLeave">
        <n-scrollbar height="100%" ref="audienceScrollbar">
          <div class="p-2">
            <div
              v-for="(user, index) in audienceList"
              :key="user.id"
              class="audience-item flex items-center gap-2 py-2 px-3 hover:bg-[--bg-menu-hover] rounded-md cursor-pointer">
              <div
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
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
                  class="w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer border border-transparent hover:border-[#ff0050] transition-colors">
                  <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
                </div>
              </user-info-popover>
              <div class="flex-1 min-w-0">
                <div class="text-[--text-color] text-sm flex items-center gap-1 min-w-0">
                  <user-info-popover :user="{ name: user.name, avatar: user.avatar, level: user.level }">
                    <span class="truncate cursor-pointer hover:text-[#ff0050] transition-colors">{{ user.name }}</span>
                  </user-info-popover>
                  <span
                    v-if="user.medals && user.medals.length > 0"
                    class="text-xs text-[--disabled-color] flex-shrink-0">
                    {{ user.medals.join(" ") }}
                  </span>
                </div>
                <div class="text-[--user-text-color] text-xs">{{ user.level }}</div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>

      <div
        class="message-list flex-1 overflow-hidden border-t border-[--line-color] transition-all duration-300 relative min-h-0">
        <div v-if="showUserCard" class="user-info-card absolute top-0 left-0 right-0 z-10 transition-all duration-300">
          <slot name="user-info-card"></slot>
        </div>

        <n-scrollbar height="100%">
          <div class="p-2">
            <div class="system-message text-center py-2">
              <div class="inline-block px-3 py-1 bg-[--bg-setting-item] text-[--user-text-color] text-xs rounded-lg">
                欢迎来到直播间！抖音严禁未成年人直播或礼物消费。严禁违法违规、低俗色情、吸烟酗酒、人身伤害等直播内容。理性消费，如主播在直播中以不当方式诱导消费，请谨慎辨别。切勿私下交易，以防人财两失，谨防网络诈骗。
              </div>
            </div>

            <div v-for="(message, index) in chatMessages" :key="index" class="message-item py-2">
              <div class="flex items-start gap-2">
                <user-info-popover :user="{ name: message.user, avatar: message.avatar, level: message.level }">
                  <div
                    class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 cursor-pointer border border-transparent hover:border-[#ff0050] transition-colors mt-0.5">
                    <img :src="message.avatar" :alt="message.user" class="w-full h-full object-cover" />
                  </div>
                </user-info-popover>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1">
                    <user-info-popover :user="{ name: message.user, avatar: message.avatar, level: message.level }">
                      <span
                        class="text-[--text-color] text-xs font-medium truncate cursor-pointer hover:text-[#ff0050] transition-colors">
                        {{ message.user }}
                      </span>
                    </user-info-popover>
                    <span v-if="message.level" class="text-[--disabled-color] text-xs flex-shrink-0">
                      {{ message.level }}
                    </span>
                  </div>
                  <div class="text-[--text-color] text-sm mt-1 word-break-all">{{ message.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </n-scrollbar>
      </div>
    </div>

    <div class="chat-input-area p-3 border-t border-[--line-color] shrink-0">
      <div class="danmaku-input-wrapper !bg-[--left-item-bg-color]">
        <div
          class="emoji-btn hover:bg-[--action-bar-icon-hover]"
          @mouseenter="showEmojiPickerHover"
          @mouseleave="hideEmojiPickerHover">
          <i-mdi-emoticon-outline class="emoji-icon !text-[--action-bar-icon-color]" />
        </div>
        <input
          v-model="messageInput"
          type="text"
          placeholder="与大家互动一下..."
          class="danmaku-input-field !text-[--text-color] placeholder:!text-[--disabled-color]"
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
