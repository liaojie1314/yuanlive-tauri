<template>
  <base-dialog v-model:show="dialogVisible" title="弹幕列表">
    <div class="danmaku-list-container">
      <div class="danmaku-header">
        <div class="header-item">时间</div>
        <div class="header-item content-item">弹幕内容</div>
      </div>
      <n-scrollbar class="danmaku-scroll-container">
        <div class="danmaku-list">
          <div v-for="(danmaku, index) in danmakuList" :key="index" class="danmaku-item">
            <div class="danmaku-time">{{ danmaku.time }}</div>
            <div class="danmaku-content">{{ danmaku.content }}</div>
            <div class="danmaku-actions">
              <div class="action-btn like-btn" @click="handleLike(index)">
                <i-fluent-heart-16-regular v-if="!danmaku.isLiked" class="iconify-icon" />
                <i-fluent-heart-16-filled v-else class="iconify-icon filled" />
              </div>
              <div class="action-btn report-btn" @click="handleReport(index)">
                <i-mdi-alert-outline class="iconify-icon" />
              </div>
            </div>
          </div>
        </div>
      </n-scrollbar>
    </div>
  </base-dialog>
</template>

<script setup lang="ts">
interface Danmaku {
  time: string;
  content: string;
  isLiked: boolean;
}

interface Props {
  show: boolean;
  danmakuList?: Danmaku[];
}

const props = withDefaults(defineProps<Props>(), {
  danmakuList: () => []
});

const emit = defineEmits<{
  "update:show": [value: boolean];
  "open-report": [index: number];
}>();

// 双向绑定
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value)
});

const handleLike = (index: number) => {
  // 这里可以添加点赞逻辑
  console.log("Like danmaku at index:", index);
};

const handleReport = (index: number) => {
  emit("open-report", index);
};
</script>

<style scoped lang="scss">
.danmaku-list-container {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-modal);
}

.danmaku-header {
  display: flex;
  padding: 12px 20px;
  background-color: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08); /* 更柔和的边框 */
  color: var(--user-text-color);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.header-item {
  flex: 1;
  text-align: left;
}

.content-item {
  flex: 3;
}

/* 滚动区域 */
.danmaku-scroll-container {
  flex: 1;
  overflow: hidden;

  :deep(.n-scrollbar-rail) {
    right: 4px;
    width: 5px;
    .n-scrollbar-rail__thumb {
      background-color: rgba(255, 255, 255, 0.2);
      &:hover {
        background-color: rgba(255, 255, 255, 0.4);
      }
    }
  }
}

.danmaku-list {
  padding: 4px 0; /* 列表上下留白 */
}

.danmaku-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: var(--bg-left-menu-hover);

    .danmaku-actions {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

.danmaku-time {
  width: 70px;
  color: var(--user-text-color);
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  opacity: 0.8;
}

.danmaku-content {
  flex: 1;
  color: var(--text-color);
  font-size: 14px;
  margin-right: 16px;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.danmaku-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  opacity: 0.4;
  transition: all 0.2s ease;
}

.action-btn {
  cursor: pointer;
  color: var(--action-bar-icon-color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }
}

.like-btn:hover {
  color: #ef4444 !important;
  background-color: rgba(239, 68, 68, 0.15) !important;
}

.report-btn:hover {
  color: #f59e0b !important;
  background-color: rgba(245, 158, 11, 0.15) !important;
}

.filled {
  color: #ef4444;
  filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.5)); /* 发光效果 */
}
</style>
