<template>
  <div class="danmaku-input-container" v-if="isEnabled" ref="containerRef">
    <div class="input-wrapper" :class="{ 'compact-mode': isCompactMode }">
      <div class="danmaku-controls-left" v-if="!isCompactMode">
        <div class="danmaku-toggle-btn" :class="{ active: isDanmakuEnabled }" @click="toggleDanmaku">
          弹
          <i-material-symbols-check-circle-outline-rounded v-if="isDanmakuEnabled" class="iconify-icon toggle-icon" />
          <i-mdi-close-circle v-else class="iconify-icon toggle-icon" />
        </div>
        <div class="danmaku-settings-container">
          <div
            class="danmaku-settings-panel"
            v-if="showDanmakuSettingsPanel"
            @mouseenter="handleSettingsPanelEnter"
            @mouseleave="handleSettingsPanelLeave">
            <div class="settings-header">
              <span class="settings-title">弹幕设置</span>
              <div class="reset-btn" @click="resetSettings">
                <i-ph-arrow-counter-clockwise class="reset-icon" />
                <span>恢复默认</span>
              </div>
            </div>
            <div class="settings-content">
              <div class="settings-item">
                <span class="settings-label">不透明度</span>
                <n-slider
                  v-model:value="danmakuSettings.opacity"
                  :min="0"
                  :max="100"
                  :step="1"
                  :tooltip="false"
                  @update:value="handleSettingsChange" />
                <span class="settings-value-right">{{ danmakuSettings.opacity }}%</span>
              </div>

              <div class="settings-item">
                <span class="settings-label">显示区域</span>
                <n-slider
                  v-model:value="danmakuSettings.displayArea"
                  :min="1"
                  :max="5"
                  :step="1"
                  :tooltip="false"
                  @update:value="handleSettingsChange" />
                <span class="settings-value-right">{{ displayAreaLabel }}</span>
              </div>

              <div class="settings-item">
                <span class="settings-label">字体大小</span>
                <n-slider
                  v-model:value="danmakuSettings.fontSize"
                  :min="1"
                  :max="5"
                  :step="1"
                  :tooltip="false"
                  @update:value="handleSettingsChange" />
                <span class="settings-value-right">{{ fontSizeLabel }}</span>
              </div>

              <div class="settings-item">
                <span class="settings-label">弹幕速度</span>
                <n-slider
                  v-model:value="danmakuSettings.speed"
                  :min="1"
                  :max="3"
                  :step="1"
                  :tooltip="false"
                  @update:value="handleSettingsChange" />
                <span class="settings-value-right">{{ speedLabel }}</span>
              </div>

              <div class="settings-divider"></div>

              <div class="settings-item settings-item-clickable" @click="toggleDanmakuList">
                <span class="settings-label">弹幕列表</span>
                <div class="settings-arrow">
                  <i-ph-caret-right class="arrow-icon" />
                </div>
              </div>
            </div>
          </div>

          <div class="danmaku-settings-btn" @mouseenter="showDanmakuSettings" @mouseleave="hideDanmakuSettings">
            弹
            <i-ph-gear-six class="iconify-icon settings-icon" />
          </div>
        </div>
        <div class="separator"></div>
      </div>

      <input
        v-if="!isCompactMode"
        v-model="danmakuText"
        type="text"
        placeholder="发一条友好的弹幕吧"
        class="danmaku-input"
        @keyup.enter="handleSend" />

      <div class="emoji-btn-container" v-if="!isCompactMode">
        <div class="emoji-btn" @mouseenter="showEmojiPickerHover" @mouseleave="hideEmojiPickerHover">
          <i-ph-smiley class="iconify-icon" />
        </div>
        <div
          v-if="showEmojiPicker"
          class="emoji-picker-wrapper"
          @mouseenter="handleEmojiPickerEnter"
          @mouseleave="handleEmojiPickerLeave">
          <EmojiPicker @select-emoji="handleSelectEmoji" />
        </div>
      </div>

      <div
        v-if="isCompactMode"
        class="compact-danmaku-btn"
        @mouseenter="showDanmakuSettings"
        @mouseleave="hideDanmakuSettings">
        弹
      </div>
    </div>

    <div
      v-if="isCompactMode && showDanmakuSettingsPanel"
      class="compact-settings-panel"
      @mouseenter="handleSettingsPanelEnter"
      @mouseleave="handleSettingsPanelLeave">
      <!-- 当hover emoji图标时，隐藏settings-header -->
      <div class="settings-header" v-if="!showEmojiSelector">
        <span class="settings-title">弹幕设置</span>
        <div class="reset-btn" @click="resetSettings">
          <i-ph-arrow-counter-clockwise class="reset-icon" />
          <span>恢复默认</span>
        </div>
      </div>
      <div class="settings-content">
        <!-- 当hover emoji图标时，显示emoji选择器，隐藏其他设置项 -->
        <n-scrollbar
          v-if="showEmojiSelector"
          class="emoji-selector-scroll"
          @mouseenter="handleEmojiSelectorEnter"
          @mouseleave="handleEmojiSelectorLeave">
          <div class="emoji-selector">
            <div class="emoji-item" v-for="emoji in commonEmojis" :key="emoji" @click="handleEmojiClick(emoji)">
              {{ emoji }}
            </div>
          </div>
        </n-scrollbar>

        <!-- 当未hover emoji图标时，显示正常的设置项 -->
        <template v-else>
          <div class="settings-item">
            <span class="settings-label">不透明度</span>
            <n-slider
              v-model:value="danmakuSettings.opacity"
              :min="0"
              :max="100"
              :step="1"
              :tooltip="false"
              @update:value="handleSettingsChange" />
            <span class="settings-value-right">{{ danmakuSettings.opacity }}%</span>
          </div>

          <div class="settings-item">
            <span class="settings-label">显示区域</span>
            <n-slider
              v-model:value="danmakuSettings.displayArea"
              :min="1"
              :max="5"
              :step="1"
              :tooltip="false"
              @update:value="handleSettingsChange" />
            <span class="settings-value-right">{{ displayAreaLabel }}</span>
          </div>

          <div class="settings-item">
            <span class="settings-label">字体大小</span>
            <n-slider
              v-model:value="danmakuSettings.fontSize"
              :min="1"
              :max="5"
              :step="1"
              :tooltip="false"
              @update:value="handleSettingsChange" />
            <span class="settings-value-right">{{ fontSizeLabel }}</span>
          </div>

          <div class="settings-item">
            <span class="settings-label">弹幕速度</span>
            <n-slider
              v-model:value="danmakuSettings.speed"
              :min="1"
              :max="3"
              :step="1"
              :tooltip="false"
              @update:value="handleSettingsChange" />
            <span class="settings-value-right">{{ speedLabel }}</span>
          </div>

          <div class="settings-divider"></div>

          <div class="settings-item settings-item-clickable" @click="toggleDanmakuList">
            <span class="settings-label">弹幕列表</span>
            <div class="settings-arrow">
              <i-ph-caret-right class="arrow-icon" />
            </div>
          </div>

          <div class="settings-divider"></div>

          <div class="settings-item">
            <span class="settings-label">弹幕开关</span>
            <div class="settings-arrow">
              <n-switch class="control-switch" :value="isDanmakuEnabled" @update:value="toggleDanmaku" />
            </div>
          </div>

          <div class="settings-divider"></div>
        </template>

        <!-- danmaku-input-section始终显示 -->
        <div class="danmaku-input-section">
          <div class="danmaku-input-wrapper">
            <div class="emoji-btn" @mouseenter="handleEmojiBtnEnter" @mouseleave="handleEmojiBtnLeave">
              <i-ph-smiley class="iconify-icon emoji-icon" />
            </div>
            <input
              v-model="danmakuText"
              type="text"
              placeholder="发一条弹幕吧"
              class="danmaku-input-field"
              @keyup.enter="handleSend" />
            <button class="send-btn" @click="handleSend">发送</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NSlider, NScrollbar } from "naive-ui";

defineProps<{
  isEnabled: boolean;
  isDanmakuEnabled: boolean;
}>();

const emit = defineEmits<{
  (e: "send-danmaku", content: string): void;
  (e: "toggle-danmaku"): void;
  (e: "danmaku-settings-change", settings: DanmakuSettings): void;
  (e: "toggle-danmaku-list"): void;
}>();

interface DanmakuSettings {
  opacity: number;
  fontSize: number;
  speed: number;
  position: string;
  displayArea: number;
  enableHighContrast: boolean;
  enableShield: boolean;
}

const danmakuText = ref("");
const showEmojiPicker = ref(false);
const showDanmakuSettingsPanel = ref(false);
const showEmojiSelector = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);
const isCompactMode = ref(false);

let danmakuSettingsHideTimer: number | null = null;
let emojiPickerHideTimer: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let emojiSelectorHideTimer: number | null = null;

// 常用emoji列表，增加数量以展示滚动效果
const commonEmojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🤗",
  "🤔",
  "🤭",
  "🤫",
  "🤥",
  "🤐",
  "🤢",
  "🤮",
  "🤧",
  "😷",
  "🤒",
  "🤕",
  "🤑",
  "🤠",
  "😈",
  "👿",
  "👹",
  "👺",
  "🤡",
  "💩",
  "👻"
];

const handleEmojiClick = (emoji: string) => {
  danmakuText.value += emoji;
  showEmojiSelector.value = false;
};

// 修复hover抽搐问题
const handleEmojiBtnEnter = () => {
  if (emojiSelectorHideTimer) {
    clearTimeout(emojiSelectorHideTimer);
    emojiSelectorHideTimer = null;
  }
  showEmojiSelector.value = true;
};

const handleEmojiBtnLeave = () => {
  if (emojiSelectorHideTimer) {
    clearTimeout(emojiSelectorHideTimer);
  }
  // 添加延迟，避免鼠标移动到emoji选择器时闪烁
  emojiSelectorHideTimer = window.setTimeout(() => {
    showEmojiSelector.value = false;
    emojiSelectorHideTimer = null;
  }, 100);
};

// 当鼠标进入emoji选择器时，保持显示
const handleEmojiSelectorEnter = () => {
  if (emojiSelectorHideTimer) {
    clearTimeout(emojiSelectorHideTimer);
    emojiSelectorHideTimer = null;
  }
};

// 当鼠标离开emoji选择器时，添加延迟隐藏
const handleEmojiSelectorLeave = () => {
  if (emojiSelectorHideTimer) {
    clearTimeout(emojiSelectorHideTimer);
  }
  // 添加延迟，避免鼠标移动到emoji选择器时闪烁
  emojiSelectorHideTimer = window.setTimeout(() => {
    showEmojiSelector.value = false;
    emojiSelectorHideTimer = null;
  }, 100);
};

const danmakuSettings = ref<DanmakuSettings>({
  opacity: 100,
  fontSize: 3,
  speed: 2,
  position: "scroll",
  displayArea: 3,
  enableHighContrast: false,
  enableShield: false
});

const fontSizeOptions = ["超小", "小号", "适中", "大号", "超大"];
const speedOptions = ["较慢", "适中", "较快"];
const displayAreaOptions = ["一行", "两行", "25%", "50%", "80%"];

const fontSizeLabel = computed(() => fontSizeOptions[danmakuSettings.value.fontSize - 1]);
const speedLabel = computed(() => speedOptions[danmakuSettings.value.speed - 1]);
const displayAreaLabel = computed(() => displayAreaOptions[danmakuSettings.value.displayArea - 1]);

const checkCompactMode = () => {
  if (containerRef.value) {
    const width = containerRef.value.offsetWidth;
    isCompactMode.value = width < 210;
  }
};

const handleSend = () => {
  if (danmakuText.value.trim()) {
    emit("send-danmaku", danmakuText.value.trim());
    danmakuText.value = "";
  }
};

const toggleDanmaku = () => {
  emit("toggle-danmaku");
};

const showDanmakuSettings = () => {
  showDanmakuSettingsPanel.value = true;
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
    danmakuSettingsHideTimer = null;
  }
};

const hideDanmakuSettings = () => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
  }
  danmakuSettingsHideTimer = window.setTimeout(() => {
    showDanmakuSettingsPanel.value = false;
    danmakuSettingsHideTimer = null;
  }, 100);
};

const showEmojiPickerHover = () => {
  showEmojiPicker.value = true;
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
    emojiPickerHideTimer = null;
  }
};

const hideEmojiPickerHover = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
  }
  emojiPickerHideTimer = window.setTimeout(() => {
    showEmojiPicker.value = false;
    emojiPickerHideTimer = null;
  }, 100);
};

const handleSettingsChange = () => {
  emit("danmaku-settings-change", danmakuSettings.value);
};

const handleSettingsPanelEnter = () => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
    danmakuSettingsHideTimer = null;
  }
};

const handleSettingsPanelLeave = () => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
  }
  danmakuSettingsHideTimer = window.setTimeout(() => {
    showDanmakuSettingsPanel.value = false;
    danmakuSettingsHideTimer = null;
  }, 100);
};

const handleEmojiPickerEnter = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
    emojiPickerHideTimer = null;
  }
};

const handleEmojiPickerLeave = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
  }
  emojiPickerHideTimer = window.setTimeout(() => {
    showEmojiPicker.value = false;
    emojiPickerHideTimer = null;
  }, 100);
};

const toggleDanmakuList = () => {
  emit("toggle-danmaku-list");
};

const resetSettings = () => {
  danmakuSettings.value = {
    opacity: 100,
    fontSize: 3,
    speed: 2,
    position: "scroll",
    displayArea: 3,
    enableHighContrast: false,
    enableShield: false
  };
  emit("danmaku-settings-change", danmakuSettings.value);
};

const handleSelectEmoji = (emoji: string) => {
  danmakuText.value += emoji;
  showEmojiPicker.value = false;
};

onMounted(() => {
  checkCompactMode();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      checkCompactMode();
    });
    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
  }
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
  }
  if (emojiSelectorHideTimer) {
    clearTimeout(emojiSelectorHideTimer);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped lang="scss">
.danmaku-input-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  z-index: 100;
  pointer-events: auto;
  animation: none !important;
  transition: none !important;
}

.input-wrapper {
  flex: 1;
  display: flex;
  position: relative;
  min-width: 0;
}

.input-wrapper.compact-mode {
  justify-content: start;
}

.danmaku-settings-container {
  position: relative;
}

.danmaku-settings-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  background-color: rgba(0, 0, 0, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  z-index: 1000;
  animation: slideUp 0.3s ease;
  min-width: 228px;
  max-width: min(228px, 95vw);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
}

.settings-title {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  cursor: pointer;
  transition: none;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  gap: 4px;

  .reset-icon {
    width: 14px;
    height: 14px;
  }
}

.settings-content {
  padding: 12px 15px;
  overflow-y: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.settings-label {
  color: #fff;
  font-size: 12px;
  min-width: 60px;
  flex-shrink: 0;
}

.settings-value-right {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  min-width: 50px;
  flex-shrink: 0;
  text-align: right;
}

:deep(.n-slider) {
  width: 100px;
  flex: 1;

  .n-slider-rail {
    background-color: rgba(255, 255, 255, 0.1);
    height: 4px;
  }

  .n-slider-rail__fill {
    background-color: #ff0050;
  }

  .n-slider-handle {
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    width: 12px;
    height: 12px;
  }
}

.settings-item-clickable {
  cursor: pointer;
  padding-top: 5px;
  padding-bottom: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

.settings-arrow {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;

  .arrow-icon {
    width: 14px;
    height: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.settings-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.emoji-picker-wrapper {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 1000;
}

.danmaku-input {
  flex: 1;
  padding: 8px 40px 8px 80px;
  border-radius: 20px;
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.3s ease;
  min-width: 0;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 15px rgba(255, 0, 80, 0.4);
  }
}

.danmaku-controls-left {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 0;
}

.danmaku-toggle-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: none !important;
  filter: none !important;
  box-shadow: none;
  position: relative;
  .toggle-icon {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 9px;
    height: 9px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.separator {
  width: 1px;
  height: 15px;
  background-color: rgba(255, 255, 255, 0.4);
  margin: 0 6px;
  align-self: center;
}

.danmaku-settings-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: none !important;
  filter: none !important;
  box-shadow: none;
  position: relative;
  color: #fff;
  font-size: 14px;
  font-weight: 500;

  .settings-icon {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 9px;
    height: 9px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.emoji-btn-container {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.emoji-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;

  .iconify-icon {
    width: 18px;
    height: 18px;
    color: #fff;
  }
}

.compact-danmaku-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.compact-settings-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  background-color: rgba(0, 0, 0, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  z-index: 1000;
  animation: slideUp 0.3s ease;
  min-width: 228px;
  max-width: min(228px, 95vw);
}

.control-switch {
  transform: scale(0.8);
  --n-switch-button-color: #fff;
  --n-switch-button-color-active: #ff0050;
  --n-switch-background-color: rgba(255, 255, 255, 0.2);
  --n-switch-background-color-active: rgba(255, 0, 80, 0.8);
  transition: all 0.3s ease;
}

.danmaku-input-section {
  padding: 4px 0;
}

.danmaku-input-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 2px 6px;
}

.emoji-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

.emoji-icon {
  width: 16px;
  height: 16px;
  color: #fff;
}

.danmaku-input-field {
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 11px;
  outline: none;
  padding: 4px 2px;
  max-width: 110px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.send-btn {
  background-color: #ff0050;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 40px;

  &:hover {
    background-color: #ff1a60;
  }

  &:active {
    transform: scale(0.95);
  }
}

:deep(.n-scrollbar) {
  width: 100%;
  height: 239px;
}

.emoji-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 12px 0;
  width: 100%;
}

.emoji-item {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transform: scale(1.2);
  }
}

/* 自定义naiveui滚动条样式 */
:deep(.n-scrollbar) {
  --n-scrollbar-width: 4px;
  --n-scrollbar-thumb-background-color: rgba(255, 255, 255, 0.2);
  --n-scrollbar-thumb-background-color-hover: rgba(255, 255, 255, 0.3);
  --n-scrollbar-track-background-color: rgba(255, 255, 255, 0.05);
}

:deep(.n-scrollbar-rail) {
  background-color: transparent;
}
</style>
