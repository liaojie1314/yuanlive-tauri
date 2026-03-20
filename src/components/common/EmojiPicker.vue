<template>
  <div class="emoji-picker-container">
    <n-scrollbar class="emoji-picker-content">
      <div class="emoji-items">
        <div v-for="(emoji, index) in emojis" class="emoji-item" :key="index" @click="handleEmojiClick(emoji)">
          {{ emoji }}
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { emojis } from "@/utils/EmojiUtils";

defineOptions({
  name: "EmojiPicker"
});

const emit = defineEmits<(e: "select-emoji", emoji: string) => void>();

/**
 * 处理点击表情事件
 * @param emoji 点击的表情
 */
const handleEmojiClick = (emoji: string) => {
  emit("select-emoji", emoji);
};
</script>

<style scoped lang="scss">
.emoji-picker-container {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 200px;
  background-color: var(--bg-popover);
  border: 1px solid var(--line-color);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.emoji-picker-content {
  height: 100%;
  padding: 8px;
  :deep(.n-scrollbar-rail) {
    width: 6px;
    background-color: transparent;
  }

  :deep(.n-scrollbar-rail__scrollbar) {
    background-color: var(--disabled-color) !important;
    border-radius: 3px;
    &:hover {
      background-color: var(--user-text-color) !important;
    }
  }
}

.emoji-items {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px;
}

.emoji-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: var(--text-color);

  &:hover {
    background-color: var(--bg-left-menu-hover);
    transform: scale(1.2);
  }
}
</style>
