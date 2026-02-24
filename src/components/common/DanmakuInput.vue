<template>
  <div v-resize="checkCompactMode" class="danmaku-input-container" v-if="isEnabled">
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
              <span class="settings-title">{{ t("components.danmakuInput.settings") }}</span>
              <div class="reset-btn" @click="resetSettings">
                <i-ph-arrow-counter-clockwise class="reset-icon" />
                <span>{{ t("components.danmakuInput.reset") }}</span>
              </div>
            </div>
            <div class="settings-content">
              <div class="settings-item" v-for="item in sliderConfigs" :key="item.key">
                <span class="settings-label">{{ item.label }}</span>
                <n-slider
                  v-model:value="localSettings[item.key]"
                  :min="item.min"
                  :max="item.max"
                  :step="1"
                  :tooltip="false"
                  @update:value="handleSettingsChange" />
                <span class="settings-value-right">{{ item.text }}</span>
              </div>

              <div class="settings-divider"></div>

              <div class="settings-item settings-item-clickable" @click="toggleDanmakuList">
                <span class="settings-label">{{ t("components.danmakuInput.danmakuList") }}</span>
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
        :placeholder="t('components.danmakuInput.placeholder')"
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
          <emoji-picker @select-emoji="handleSelectEmoji" />
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
      <div class="settings-header" v-if="!showEmojiSelector">
        <span class="settings-title">{{ t("components.danmakuInput.settings") }}</span>
        <div class="reset-btn" @click="resetSettings">
          <i-ph-arrow-counter-clockwise class="reset-icon" />
          <span>{{ t("components.danmakuInput.reset") }}</span>
        </div>
      </div>
      <div class="settings-content">
        <n-scrollbar
          v-if="showEmojiSelector"
          class="emoji-selector-scroll"
          @mouseenter="handleEmojiSelectorEnter"
          @mouseleave="handleEmojiSelectorLeave">
          <div class="emoji-selector">
            <div class="emoji-item" v-for="emoji in emojis" :key="emoji" @click="handleEmojiClick(emoji)">
              {{ emoji }}
            </div>
          </div>
        </n-scrollbar>
        <template v-else>
          <div class="settings-item" v-for="item in sliderConfigs" :key="item.key">
            <span class="settings-label">{{ item.label }}</span>
            <n-slider
              v-model:value="localSettings[item.key]"
              :min="item.min"
              :max="item.max"
              :step="1"
              :tooltip="false"
              @update:value="handleSettingsChange" />
            <span class="settings-value-right">{{ item.text }}</span>
          </div>

          <div class="settings-divider"></div>
          <div class="settings-item settings-item-clickable" @click="toggleDanmakuList">
            <span class="settings-label">{{ t("components.danmakuInput.danmakuList") }}</span>
            <div class="settings-arrow">
              <i-ph-caret-right class="arrow-icon" />
            </div>
          </div>
          <div class="settings-divider"></div>
          <div class="settings-item">
            <span class="settings-label">{{ t("components.danmakuInput.danmakuSwitch") }}</span>
            <div class="settings-arrow">
              <n-switch class="control-switch" :value="isDanmakuEnabled" @update:value="toggleDanmaku" />
            </div>
          </div>
          <div class="settings-divider"></div>
        </template>
        <div class="danmaku-input-section">
          <div class="danmaku-input-wrapper">
            <div class="emoji-btn" @mouseenter="handleEmojiBtnEnter" @mouseleave="handleEmojiBtnLeave">
              <i-ph-smiley class="iconify-icon emoji-icon" />
            </div>
            <input
              v-model="danmakuText"
              type="text"
              :placeholder="t('components.danmakuInput.placeholder')"
              class="danmaku-input-field"
              @keyup.enter="handleSend" />
            <button class="send-btn" @click="handleSend">{{ t("components.danmakuInput.send") }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useDebounceFn } from "@vueuse/core";

import { emojis } from "@/utils/EmojiUtils";
import { useDanmakuStore } from "@/stores/danmaku";

const { t } = useI18n();
const danmakuStore = useDanmakuStore();

defineProps<{
  isEnabled: boolean;
  isDanmakuEnabled: boolean;
}>();

const emit = defineEmits<{
  (e: "send-danmaku", content: string): void;
  (e: "toggle-danmaku"): void;
  (e: "toggle-danmaku-list"): void;
}>();

let danmakuSettingsHideTimer: number | null = null;
let emojiPickerHideTimer: number | null = null;
let emojiSelectorHideTimer: number | null = null;
const settingsChangeDebounceTimer: number | null = null;

const fontSizeOptions = [
  t("components.danmakuInput.fontSizeOptions.extraSmall"),
  t("components.danmakuInput.fontSizeOptions.small"),
  t("components.danmakuInput.fontSizeOptions.medium"),
  t("components.danmakuInput.fontSizeOptions.large"),
  t("components.danmakuInput.fontSizeOptions.extraLarge")
];
const speedOptions = [
  t("components.danmakuInput.speedOptions.slower"),
  t("components.danmakuInput.speedOptions.medium"),
  t("components.danmakuInput.speedOptions.faster")
];
const displayAreaOptions = [
  t("components.danmakuInput.displayAreaOptions.oneLine"),
  t("components.danmakuInput.displayAreaOptions.twoLines"),
  "25%",
  "50%",
  "80%"
];

// 字体大小映射：从实际像素值到滑块值（1-5）
const fontSizeToSliderMap: Record<number, number> = {
  12: 1,
  14: 2,
  16: 3,
  18: 4,
  20: 5
};

const danmakuText = ref("");
const showEmojiPicker = ref(false);
const showDanmakuSettingsPanel = ref(false);
const showEmojiSelector = ref(false);
const isCompactMode = ref(false);

/**
 * 从实际像素值获取对应的滑块值
 * @param pixelSize 实际字体像素大小
 * @returns 对应的滑块值（1-5）
 */
const getSliderFontSize = (pixelSize: number): number => {
  return fontSizeToSliderMap[pixelSize] || 3; // 默认返回适中大小
};

// 本地设置状态，用于滑块交互
const localSettings = ref({
  opacity: danmakuStore.opacity,
  fontSize: getSliderFontSize(danmakuStore.fontSize),
  speed: danmakuStore.speed,
  displayArea: danmakuStore.displayArea
});

const fontSizeLabel = computed(() => fontSizeOptions[localSettings.value.fontSize - 1]);
const speedLabel = computed(() => speedOptions[localSettings.value.speed - 1]);
const displayAreaLabel = computed(() => displayAreaOptions[localSettings.value.displayArea - 1]);
const sliderConfigs = computed(() => [
  {
    key: "opacity" as const,
    label: t("components.danmakuInput.opacity"),
    min: 0,
    max: 100,
    text: `${localSettings.value.opacity}%`
  },
  {
    key: "displayArea" as const,
    label: t("components.danmakuInput.displayArea"),
    min: 1,
    max: 5,
    text: displayAreaLabel.value
  },
  {
    key: "fontSize" as const,
    label: t("components.danmakuInput.fontSize"),
    min: 1,
    max: 5,
    text: fontSizeLabel.value
  },
  {
    key: "speed" as const,
    label: t("components.danmakuInput.speed"),
    min: 1,
    max: 3,
    text: speedLabel.value
  }
]);

/**
 * 处理emoji点击事件
 * @param emoji 点击的emoji字符
 */
const handleEmojiClick = (emoji: string) => {
  danmakuText.value += emoji;
  showEmojiSelector.value = false;
};

/** 从store同步最新设置到本地状态 */
const updateLocalSettingsFromStore = () => {
  localSettings.value.opacity = danmakuStore.opacity;
  localSettings.value.fontSize = getSliderFontSize(danmakuStore.fontSize);
  localSettings.value.speed = danmakuStore.speed;
  localSettings.value.displayArea = danmakuStore.displayArea;
};

/**
 * 检查是否为紧凑模式
 * @param width 输入框宽度
 */
const checkCompactMode = ({ width }: any) => {
  isCompactMode.value = width < 210;
};

/** 处理发送弹幕事件 */
const handleSend = () => {
  if (danmakuText.value.trim()) {
    emit("send-danmaku", danmakuText.value.trim());
    danmakuText.value = "";
  }
};

/** 处理弹幕设置变化事件（防抖） */
const handleSettingsChange = useDebounceFn(() => {
  // 根据滑块值映射到实际像素值
  const fontSizeMap: Record<number, number> = {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20
  };

  danmakuStore.setFontSize(fontSizeMap[localSettings.value.fontSize]);
  danmakuStore.setOpacity(localSettings.value.opacity);
  danmakuStore.setSpeed(localSettings.value.speed);
  danmakuStore.setDisplayArea(localSettings.value.displayArea);
}, 300);

/** 切换弹幕开关 */
const toggleDanmaku = () => {
  emit("toggle-danmaku");
};

/** 切换弹幕列表显示 */
const toggleDanmakuList = () => {
  emit("toggle-danmaku-list");
};

/** 重置弹幕设置 */
const resetSettings = () => {
  danmakuStore.resetSettings();
  updateLocalSettingsFromStore();
  localSettings.value.fontSize = 3;
};

/**
 * 处理选择表情符
 * @param emoji 选中的表情符
 */
const handleSelectEmoji = (emoji: string) => {
  danmakuText.value += emoji;
  showEmojiPicker.value = false;
};

/** 显示弹幕设置面板 */
const showDanmakuSettings = () => {
  // 打开设置面板时，从store同步最新设置
  updateLocalSettingsFromStore();
  showDanmakuSettingsPanel.value = true;
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
    danmakuSettingsHideTimer = null;
  }
};

/** 隐藏弹幕设置面板 */
const hideDanmakuSettings = () => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
  }
  danmakuSettingsHideTimer = window.setTimeout(() => {
    showDanmakuSettingsPanel.value = false;
    danmakuSettingsHideTimer = null;
  }, 100);
};

/** 显示emoji选择器（悬停） */
const showEmojiPickerHover = () => {
  showEmojiPicker.value = true;
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
    emojiPickerHideTimer = null;
  }
};

/** 隐藏emoji选择器（悬停） */
const hideEmojiPickerHover = () => {
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
  }
  emojiPickerHideTimer = window.setTimeout(() => {
    showEmojiPicker.value = false;
    emojiPickerHideTimer = null;
  }, 100);
};

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
  emojiSelectorHideTimer = window.setTimeout(() => {
    showEmojiSelector.value = false;
    emojiSelectorHideTimer = null;
  }, 100);
};

const handleEmojiSelectorEnter = () => {
  if (emojiSelectorHideTimer) {
    clearTimeout(emojiSelectorHideTimer);
    emojiSelectorHideTimer = null;
  }
};

const handleEmojiSelectorLeave = () => {
  if (emojiSelectorHideTimer) {
    clearTimeout(emojiSelectorHideTimer);
  }
  emojiSelectorHideTimer = window.setTimeout(() => {
    showEmojiSelector.value = false;
    emojiSelectorHideTimer = null;
  }, 100);
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

watch(
  () => danmakuStore.fontSize,
  (newSize) => {
    localSettings.value.fontSize = getSliderFontSize(newSize);
  }
);

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
  if (settingsChangeDebounceTimer) {
    clearTimeout(settingsChangeDebounceTimer);
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

.danmaku-settings-panel,
.compact-settings-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  background-color: var(--bg-popover);
  border: 1px solid var(--line-color);
  color: var(--text-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideUp 0.3s ease;
  min-width: 228px;
  max-width: min(228px, 95vw);

  .danmaku-input-wrapper {
    background-color: var(--input-area-bg);
    border: 1px solid var(--line-color);

    .danmaku-input-field {
      color: var(--text-color);
      &::placeholder {
        color: var(--user-text-color);
      }
    }

    .emoji-btn {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: var(--bg-left-menu-hover);
      }
      .emoji-icon {
        color: var(--action-bar-icon-color);
      }
    }
  }
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
  border-bottom: 1px solid var(--line-color);
}

.settings-title {
  color: var(--text-color);
  font-size: 13px;
  font-weight: 600;
}

.reset-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  color: var(--user-text-color);
  font-size: 12px;
  gap: 4px;

  .reset-icon {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background-color: var(--bg-left-menu-hover);
    color: var(--text-color);
  }
}

.settings-content {
  padding: 12px 15px;
  overflow-y: auto;
  border-top: none;
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
  color: var(--text-color);
  font-size: 12px;
  min-width: 60px;
  flex-shrink: 0;
}

.settings-value-right {
  color: var(--user-text-color);
  font-size: 12px;
  min-width: 50px;
  flex-shrink: 0;
  text-align: right;
}

:deep(.n-slider) {
  width: 100px;
  flex: 1;

  .n-slider-rail {
    background-color: var(--line-color);
    height: 4px;
    border-radius: 2px;
  }

  .n-slider-rail__fill {
    background-color: #ff0050;
  }

  .n-slider-handle {
    background-color: var(--bg-popover);
    box-shadow:
      0 0 0 1px var(--line-color),
      0 2px 4px rgba(0, 0, 0, 0.1);
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
    background-color: var(--bg-left-menu-hover);
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
    color: var(--user-text-color);
  }
}

.settings-divider {
  height: 1px;
  background-color: var(--line-color);
  margin: 8px 0;
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
  color: var(--text-color);

  &:hover {
    background-color: var(--bg-left-menu-hover);
    transform: scale(1.2);
  }
}

.control-switch {
  transform: scale(0.8);
  --n-switch-button-color: #fff;
  --n-switch-button-color-active: #fff;
  /* 轨道适配 */
  --n-switch-background-color: var(--line-color);
  --n-switch-background-color-active: #ff0050;
  transition: all 0.3s ease;
}

:deep(.n-scrollbar) {
  width: 100%;
  height: 239px;
  --n-scrollbar-width: 4px;
  --n-scrollbar-thumb-background-color: var(--disabled-color);
  --n-scrollbar-thumb-background-color-hover: var(--user-text-color);
  --n-scrollbar-track-background-color: transparent;
}

:deep(.n-scrollbar-rail__scrollbar) {
  width: 3px !important;
}

.emoji-picker-wrapper {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 1000;
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
  border: 1px solid transparent;
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
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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

.emoji-icon {
  width: 16px;
  height: 16px;
  color: #fff;
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
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &::placeholder {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    background-color: rgba(255, 255, 255, 0.15);
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
</style>
