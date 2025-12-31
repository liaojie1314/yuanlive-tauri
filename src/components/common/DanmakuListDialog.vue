<template>
  <BaseDialog v-model:show="dialogVisible" title="弹幕列表">
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
  </BaseDialog>
</template>

<script setup lang="ts">
import { NScrollbar } from "naive-ui";
import BaseDialog from "./BaseDialog.vue";

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
  background-color: #fff;
}

.danmaku-header {
  display: flex;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}

.header-item {
  flex: 1;
  text-align: left;
  font-size: 15px;
}

.content-item {
  flex: 3;
}

.danmaku-scroll-container {
  flex: 1;
  overflow: hidden;
  :deep(.n-scrollbar-rail) {
    &.n-scrollbar-rail--vertical {
      width: 6px;
      margin-right: 4px;
    }
    .n-scrollbar-rail__thumb {
      background-color: #cbd5e1;
      border-radius: 3px;
      &:hover {
        background-color: #94a3b8;
      }
    }
  }
}

.danmaku-list {
  padding: 0;
}

.danmaku-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8fafc;
  }
}

.danmaku-time {
  width: 65px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.danmaku-content {
  flex: 1;
  color: #1e293b;
  font-size: 14px;
  margin: 0 16px;
  line-height: 1.5;
  word-break: break-word;
}

.danmaku-actions {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
}

.action-btn {
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;

  &:hover {
    background-color: rgba(148, 163, 184, 0.1);
  }
}

.like-btn {
  &:hover {
    color: #ef4444 !important;
    background-color: rgba(239, 68, 68, 0.1) !important;
  }
}

.report-btn {
  &:hover {
    color: #f59e0b !important;
    background-color: rgba(245, 158, 11, 0.1) !important;
  }
}

.filled {
  color: #ef4444;
}

.iconify-icon {
  width: 18px;
  height: 18px;
}
</style>
