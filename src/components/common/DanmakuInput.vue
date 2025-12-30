<template>
  <div class="danmaku-input-container" v-if="isEnabled">
    <div class="input-wrapper">
      <div class="danmaku-controls-left">
        <div class="danmaku-toggle-btn" :class="{ active: isDanmakuEnabled }" @click="toggleDanmaku">
          弹
          <i-material-symbols-check-circle-outline-rounded v-if="isDanmakuEnabled" class="iconify-icon toggle-icon" />
          <i-mdi-close-circle v-else class="iconify-icon toggle-icon" />
        </div>
        <div class="danmaku-settings-container">
          <!-- 弹幕设置面板 -->
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
              <!-- 不透明度 -->
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

              <!-- 显示区域 -->
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

              <!-- 字体大小 -->
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

              <!-- 弹幕速度 -->
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

              <!-- 弹幕列表 -->
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
        v-model="danmakuText"
        type="text"
        placeholder="发一条友好的弹幕吧"
        class="danmaku-input"
        @keyup.enter="handleSend" />
      <div class="emoji-btn-container">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import EmojiPicker from "./EmojiPicker.vue";
import { NSlider } from "naive-ui";

// Props
const { isEnabled, isDanmakuEnabled } = defineProps<{
  isEnabled: boolean;
  isDanmakuEnabled: boolean;
}>();

// Emits
const emit = defineEmits<{
  (e: "send-danmaku", content: string): void;
  (e: "toggle-danmaku"): void;
  (e: "danmaku-settings-change", settings: DanmakuSettings): void;
  (e: "toggle-danmaku-list"): void;
}>();

// 弹幕设置类型
interface DanmakuSettings {
  opacity: number;
  fontSize: number;
  speed: number;
  position: string;
  displayArea: number;
  enableHighContrast: boolean;
  enableShield: boolean;
}

// Refs
const danmakuText = ref("");
const showEmojiPicker = ref(false);
const showDanmakuSettingsPanel = ref(false);

// 防抖计时器
let danmakuSettingsHideTimer: number | null = null;
let emojiPickerHideTimer: number | null = null;

// 弹幕设置状态
const danmakuSettings = ref<DanmakuSettings>({
  opacity: 100,
  fontSize: 3,
  speed: 2,
  position: "scroll",
  displayArea: 3,
  enableHighContrast: false,
  enableShield: false
});

// 字体大小选项映射
const fontSizeOptions = ["超小", "小号", "适中", "大号", "超大"];

// 弹幕速度选项映射
const speedOptions = ["较慢", "适中", "较快"];

// 显示区域选项映射
const displayAreaOptions = ["一行", "两行", "25%", "50%", "80%"];

// 计算属性：字体大小标签
const fontSizeLabel = computed(() => fontSizeOptions[danmakuSettings.value.fontSize - 1]);

// 计算属性：弹幕速度标签
const speedLabel = computed(() => speedOptions[danmakuSettings.value.speed - 1]);

// 计算属性：显示区域标签
const displayAreaLabel = computed(() => displayAreaOptions[danmakuSettings.value.displayArea - 1]);

// Methods
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

onUnmounted(() => {
  if (danmakuSettingsHideTimer) {
    clearTimeout(danmakuSettingsHideTimer);
  }
  if (emojiPickerHideTimer) {
    clearTimeout(emojiPickerHideTimer);
  }
});
</script>

<style scoped lang="scss">
.danmaku-input-container {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
  pointer-events: auto;
  animation: none !important;
  transition: none !important;
}

.danmaku-settings-container {
  position: relative;
}

.danmaku-settings-panel {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  background-color: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  z-index: 1000;
  animation: slideUp 0.3s ease;
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
  max-height: 400px;
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
  gap: 10px;
  margin-bottom: 16px;

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

// NaiveUI 组件样式覆盖
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

.input-wrapper {
  flex: 1;
  display: flex;
  position: relative;
}

.danmaku-input {
  flex: 1;
  padding: 12px 50px 12px 100px;
  border-radius: 25px;
  border: none;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    background-color: rgba(0, 0, 0, 0.8);
    box-shadow: 0 0 15px rgba(255, 0, 80, 0.4);
  }
}

.danmaku-controls-left {
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 0;
}

.danmaku-toggle-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  backdrop-filter: none !important;
  filter: none !important;
  box-shadow: none;
  position: relative;
  .toggle-icon {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 10px;
    height: 10px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.separator {
  width: 2px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.5);
  margin: 0 8px;
  align-self: center;
}

.danmaku-settings-btn {
  width: 36px;
  height: 36px;
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
  font-size: 16px;
  font-weight: 500;

  .settings-icon {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 10px;
    height: 10px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.emoji-btn-container {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
}

.emoji-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;

  .iconify-icon {
    width: 20px;
    height: 20px;
    color: #fff;
  }
}
</style>
