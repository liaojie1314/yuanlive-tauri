<template>
  <div class="video-side-panel" :class="{ 'is-open': show }">
    <div class="panel-inner">
      <div class="panel-header">
        <div class="tabs">
          <div class="tab-item" :class="{ active: activeTab === 'detail' }" @click="activeTab = 'detail'">
            {{ $t("components.videoSidePanel.detail") }}
            <div v-if="activeTab === 'detail'" class="active-line"></div>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'comment' }" @click="activeTab = 'comment'">
            {{ $t("components.videoSidePanel.comment") }}
            <div v-if="activeTab === 'comment'" class="active-line"></div>
          </div>
        </div>
        <div class="close-btn" @click="handleClose">
          <i-mdi-close class="w-5 h-5" />
        </div>
      </div>

      <div class="panel-content">
        <div v-show="activeTab === 'detail'" class="h-full w-full">
          <n-scrollbar class="h-full" @scroll="handleDetailScroll">
            <div class="p-4 text-[--text-color]">
              <div class="flex items-center justify-between mb-4">
                <div class="font-medium text-[15px]">{{ userName }}</div>

                <button class="follow-btn" :class="{ 'is-followed': isFollowed }" @click="toggleFollow">
                  {{ isFollowed ? $t("components.videoSidePanel.followed") : $t("components.videoSidePanel.follow") }}
                </button>
              </div>

              <p class="text-sm mb-6 leading-relaxed">
                {{ videoDesc }}
              </p>

              <div class="video-grid">
                <div
                  v-for="(video, index) in playlistStore.videoList"
                  :key="video.id"
                  class="video-card group"
                  @click="playlistStore.playSpecificVideo(video)">
                  <img :src="video.coverUrl" class="video-cover" />

                  <div v-if="index !== playlistStore.currentVideoIndex" class="video-mask"></div>

                  <div v-if="index !== playlistStore.currentVideoIndex" class="like-info">
                    <i-ph-heart-fill class="text-white w-3 h-3" />
                    <span>{{ video.likeCount }}</span>
                  </div>

                  <div v-if="index === playlistStore.currentVideoIndex" class="playing-status">
                    <div class="playing-bars">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span class="playing-text">{{ $t("components.videoSidePanel.playing") }}</span>
                  </div>
                </div>
              </div>
              <div v-if="playlistStore.isLoading" class="loading-more">
                <i-mdi-loading class="animate-spin" />
                {{ $t("components.videoSidePanel.loading") }}
              </div>
            </div>
          </n-scrollbar>
        </div>

        <div v-show="activeTab === 'comment'" class="h-full w-full relative overflow-hidden">
          <n-scrollbar class="h-full">
            <div class="px-4 py-3 box-border">
              <div class="text-xs text-[--user-text-color] mb-4">
                {{ $t("components.videoSidePanel.totalComments", { total: totalComments }) }}
              </div>

              <div v-for="comment in commentList" :key="comment.id" class="comment-item">
                <img :src="comment.user.avatar" class="avatar" />
                <div class="comment-main border-b border-[--line-color] pb-4">
                  <div class="user-info">
                    <span class="username">{{ comment.user.username }}</span>
                    <span v-if="comment.user.isAuthor" class="author-badge">
                      {{ $t("components.videoSidePanel.author") }}
                    </span>
                  </div>

                  <template v-if="!comment.isDisliked">
                    <div class="content-text">{{ comment.content }}</div>
                    <img v-if="comment.image" :src="comment.image" class="comment-image" />
                  </template>
                  <div v-else class="collapsed-message">
                    <i-mdi-information-outline class="collapse-icon" />
                    {{ $t("components.videoSidePanel.collapsedComment") }}
                  </div>
                  <div class="comment-actions">
                    <span class="time-loc">{{ comment.time }} · {{ comment.location }}</span>
                    <span class="action-btn">{{ $t("components.videoSidePanel.reply") }}</span>

                    <div class="action-right">
                      <div class="action-icon" :class="{ 'is-active': comment.isLiked }" @click="toggleLike(comment)">
                        <i-ph-heart-fill v-if="comment.isLiked" />
                        <i-ph-heart v-else />
                        <span v-if="comment.likes > 0">{{ comment.likes }}</span>
                      </div>
                      <div
                        class="action-icon"
                        :class="{ 'is-active': comment.isDisliked }"
                        @click="toggleDislike(comment)">
                        <i-ph-heart-break-fill v-if="comment.isDisliked" />
                        <i-ph-heart-break v-else />
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="comment.replies && comment.replies.length > 0"
                    class="expand-replies"
                    @click="comment.showReplies = !comment.showReplies">
                    <div class="dash-line"></div>
                    <span>
                      {{
                        comment.showReplies
                          ? $t("components.videoSidePanel.collapseReplies")
                          : $t("components.videoSidePanel.expandReplies", { count: comment.replies.length })
                      }}
                    </span>
                    <i-mdi-chevron-down :class="{ 'rotate-180': comment.showReplies }" class="transition-transform" />
                  </div>

                  <div v-show="comment.showReplies" class="replies-container">
                    <div v-for="reply in comment.replies" :key="reply.id" class="comment-item reply-item">
                      <img :src="reply.user.avatar" class="avatar-small" />
                      <div class="comment-main">
                        <div class="user-info">
                          <span class="username">{{ reply.user.username }}</span>
                          <span v-if="reply.user.isAuthor" class="author-badge">
                            {{ $t("components.videoSidePanel.author") }}
                          </span>
                        </div>

                        <template v-if="!reply.isDisliked">
                          <div class="content-text">{{ reply.content }}</div>
                          <img v-if="reply.image" :src="reply.image" class="comment-image" />
                        </template>
                        <div v-else class="collapsed-message">
                          <i-mdi-information-outline class="collapse-icon" />
                          {{ $t("components.videoSidePanel.collapsedComment") }}
                        </div>
                        <div class="comment-actions">
                          <span class="time-loc">{{ reply.time }} · {{ reply.location }}</span>
                          <span class="action-btn">{{ $t("components.videoSidePanel.reply") }}</span>
                          <div class="action-right">
                            <div class="action-icon" :class="{ 'is-active': reply.isLiked }" @click="toggleLike(reply)">
                              <i-ph-heart-fill v-if="reply.isLiked" />
                              <i-ph-heart v-else />
                              <span v-if="reply.likes > 0">{{ reply.likes }}</span>
                            </div>
                            <div
                              class="action-icon"
                              :class="{ 'is-active': reply.isDisliked }"
                              @click="toggleDislike(reply)">
                              <i-ph-heart-break-fill v-if="reply.isDisliked" />
                              <i-ph-heart-break v-else />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>

      <div v-show="activeTab === 'comment'" class="comment-input-area relative">
        <div v-if="uploadImagePreview" class="upload-preview">
          <img :src="uploadImagePreview" />
          <div class="remove-btn" @click="removeImage">
            <i-mdi-close />
          </div>
        </div>

        <div class="input-wrapper">
          <input
            v-model="commentText"
            type="text"
            :placeholder="$t('components.videoSidePanel.placeholder')"
            class="comment-input"
            @keyup.enter="submitComment" />
          <div class="action-icons">
            <i-ph-image class="icon" @click="handleImageUpload" :title="$t('components.videoSidePanel.uploadImage')" />
            <i-ph-smiley
              class="icon"
              @click.stop="showEmojiPicker = !showEmojiPicker"
              :title="$t('components.videoSidePanel.emoji')" />
          </div>
        </div>

        <emoji-picker v-if="showEmojiPicker" class="emoji-picker-popup" @select-emoji="onSelectEmoji" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";

import { usePlaylistStore } from "@/stores/playlist";
import { unfollowApi } from "@/api/follow";

const playlistStore = usePlaylistStore();

const props = defineProps<{
  show: boolean;
  userId: number | null;
  userName: string;
  tab: "detail" | "comment";
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "update:tab": [value: "detail" | "comment"];
}>();

interface CommentUser {
  username: string;
  avatar: string;
  isAuthor?: boolean;
}

interface CommentData {
  id: number;
  user: CommentUser;
  content: string;
  image?: string;
  time: string;
  location: string;
  likes: number;
  isLiked: boolean;
  isDisliked: boolean;
  showReplies?: boolean;
  replies?: CommentData[];
}

let uploadImagePath = ""; // Tauri本地路径

const isFollowed = ref(true);
const commentText = ref("");
const showEmojiPicker = ref(false);
const uploadImagePreview = ref(""); // 预览图片URL
const videoDesc = ref("");
// 模拟图中数据
const commentList = ref<CommentData[]>([
  {
    id: 1,
    user: { username: "走路摇zly", avatar: "https://picsum.photos/100/100", isAuthor: true },
    content: "漂子来这里躺躺 🪂",
    time: "1小时前",
    location: "上海",
    likes: 38,
    isLiked: false,
    isDisliked: false,
    showReplies: false,
    replies: [
      {
        id: 101,
        user: { username: "灰太狼大王", avatar: "https://picsum.photos/101/101" },
        content: "摇姐真牛逼不怕冷 😅😅",
        time: "38分钟前",
        location: "广东",
        likes: 0,
        isLiked: false,
        isDisliked: false
      },
      {
        id: 102,
        user: { username: "新生 ☀️", avatar: "https://picsum.photos/102/102" },
        content: "跟走路摇的话过程就行了",
        time: "50分钟前",
        location: "河南",
        likes: 0,
        isLiked: false,
        isDisliked: false
      }
    ]
  },
  {
    id: 2,
    user: { username: "林幻墨", avatar: "https://picsum.photos/103/103" },
    content: "第一个摇姐，看我",
    image: "https://picsum.photos/200/300", // 模拟带图评论
    time: "2小时前",
    location: "海南",
    likes: 18,
    isLiked: false,
    isDisliked: false,
    showReplies: false,
    replies: []
  }
]);

const activeTab = computed({
  get: () => props.tab,
  set: (val) => emit("update:tab", val)
});
const totalComments = computed(() => {
  return commentList.value.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0);
});

/** 关闭侧边栏 */
const handleClose = () => {
  emit("update:show", false);
};

/** 切换关注状态 */
const toggleFollow = async () => {
  if (isFollowed.value) {
    isFollowed.value = (await unfollowApi(playlistStore.currentUserId as number)) ?? false;
    return;
  }
};

/**
 * 监听详情页滚动到底部加载更多视频
 * @param e 滚动事件
 */
const handleDetailScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
    // 侧边栏触底，直接叫 Store 加载下一页
    playlistStore.fetchVideos(props.userId as number, true);
  }
};

/**
 * 切换评论点赞状态
 * @param item 评论项
 */
const toggleLike = (item: CommentData) => {
  if (item.isLiked) {
    item.isLiked = false;
    item.likes--;
  } else {
    item.isLiked = true;
    item.likes++;
    if (item.isDisliked) item.isDisliked = false;
  }
};

/**
 * 切换评论点踩状态
 * @param item 评论项
 */
const toggleDislike = (item: CommentData) => {
  item.isDisliked = !item.isDisliked;
  if (item.isDisliked && item.isLiked) {
    item.isLiked = false;
    item.likes--;
  }
};

/** 点击页面其他区域关闭表情包 */
const closeEmojiPicker = () => {
  showEmojiPicker.value = false;
};

/**
 * 处理选择表情包事件
 * @param emoji 选中的表情包
 */
const onSelectEmoji = (emoji: string) => {
  commentText.value += emoji;
};

/** 点击图片上传按钮触发图片选择 */
const handleImageUpload = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }]
    });

    if (selected) {
      uploadImagePath = Array.isArray(selected) ? selected[0] : selected;
      // 将本地绝对路径转换为可在 webview 渲染的协议 url
      uploadImagePreview.value = convertFileSrc(uploadImagePath);
    }
  } catch (err) {
    console.error("图片上传失败:", err);
  }
};

/** 点击删除图片按钮移除图片 */
const removeImage = () => {
  uploadImagePreview.value = "";
  uploadImagePath = "";
};

/** 提交评论 */
const submitComment = () => {
  if (!commentText.value.trim() && !uploadImagePreview.value) return;

  const newComment: CommentData = {
    id: Date.now(),
    user: { username: "我", avatar: "https://picsum.photos/60/60" },
    content: commentText.value,
    image: uploadImagePreview.value,
    time: "刚刚",
    location: "本地",
    likes: 0,
    isLiked: false,
    isDisliked: false
  };

  commentList.value.unshift(newComment);
  commentText.value = "";
  removeImage();
  showEmojiPicker.value = false;
};

onMounted(() => {
  document.addEventListener("click", closeEmojiPicker);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeEmojiPicker);
});
</script>

<style scoped lang="scss">
@use "sass:list";

.video-side-panel {
  --panel-width: 320px;
  width: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
  background-color: var(--bg-popover);
  border-radius: 0 8px 8px 0;
  border: 1px solid transparent;
  border-left: none;
  flex-shrink: 0;

  &.is-open {
    width: var(--panel-width);
    opacity: 1;
    border-color: var(--line-color);
    border-left: 1px solid var(--line-color);
  }
}

.panel-inner {
  width: var(--panel-width);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  border-bottom: 1px solid var(--line-color);
  flex-shrink: 0;
}

.tabs {
  display: flex;
  gap: 20px;
  height: 100%;
}

.tab-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 15px;
  color: var(--user-text-color);
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s ease;

  &.active {
    color: var(--text-color);
  }

  &:hover {
    color: var(--text-color);
  }
}

.active-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: #ff0050;
  border-radius: 3px 3px 0 0;
}

.close-btn {
  cursor: pointer;
  color: var(--action-bar-icon-color);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--bg-left-menu-hover);
    color: var(--text-color);
  }
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

.follow-btn {
  padding: 4px 16px;
  background-color: #ff0050;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #ff3366;
  }

  &.is-followed {
    background-color: var(--bg-setting-item);
    color: var(--user-text-color);
    border: 1px solid var(--line-color);
    padding: 3px 15px; /* 减去边框的宽度保持视觉一致 */

    &:hover {
      background-color: var(--bg-left-menu-hover);
    }
  }
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-bottom: 20px;
}

.video-card {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4; /* 保持类似手机视频的竖屏比例 */
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--bg-setting-item);

  .video-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover .video-cover {
    transform: scale(1.05);
  }

  .video-mask {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
    pointer-events: none;
  }

  .like-info {
    position: absolute;
    bottom: 6px;
    left: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

/* 播放中动画样式与模糊蒙层 */
.playing-status {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 加深黑色蒙层 */
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.5);
  /* 添加毛玻璃模糊效果，让背景封面虚化，质感拉满 */
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;

  .playing-text {
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 1px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }
}

.playing-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;

  span {
    display: block;
    width: 3px;
    background-color: #fff;
    border-radius: 2px;
    animation: bounce 0.8s infinite ease-in-out alternate;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  $bars-heights: 12px, 16px, 10px;
  @for $i from 1 through list.length($bars-heights) {
    span:nth-child(#{$i}) {
      height: list.nth($bars-heights, $i);
      animation-delay: ($i - 1) * 0.3s;
    }
  }
}

@keyframes bounce {
  0% {
    transform: scaleY(0.4);
  }
  100% {
    transform: scaleY(1);
  }
}

.loading-more {
  text-align: center;
  padding: 10px 0;
  color: var(--user-text-color);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.reply-item {
  margin-bottom: 12px;
  margin-top: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.comment-main {
  flex: 1;
  min-width: 0;
  padding-right: 6px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;

  .username {
    font-size: 13px;
    color: var(--user-text-color);
  }

  .author-badge {
    background-color: #ff0050;
    color: #fff;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 4px;
    line-height: 1;
  }
}

.collapsed-message {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--user-text-color);
  font-size: 13px;
  margin-bottom: 6px;
  padding: 4px 0;
  opacity: 0.8;

  .collapse-icon {
    font-size: 15px;
  }
}

.content-text {
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.5;
  margin-bottom: 6px;
  word-break: break-word;
}

.comment-image {
  max-width: 140px;
  max-height: 180px;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 6px;
  border: 1px solid var(--line-color);
}

.comment-actions {
  display: flex;
  align-items: center;
  color: var(--user-text-color);
  font-size: 12px;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;

  .time-loc {
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
    min-width: 0;
  }

  .action-btn {
    cursor: pointer;
    flex-shrink: 0;
    &:hover {
      color: var(--text-color);
    }
  }

  .action-right {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    .action-icon {
      display: flex;
      align-items: center;
      gap: 3px;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        color: var(--text-color);
      }
      &.is-active {
        color: #ff0050;
      }
    }
  }
}

.expand-replies {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  color: var(--user-text-color);
  font-size: 12px;
  cursor: pointer;
  width: fit-content;

  &:hover {
    color: var(--text-color);
  }

  .dash-line {
    width: 24px;
    height: 1px;
    background-color: var(--line-color);
  }
}

.comment-input-area {
  padding: 12px 16px;
  border-top: 1px solid var(--line-color);
  background-color: var(--bg-popover);
}

.upload-preview {
  position: absolute;
  bottom: 100%;
  left: 16px;
  margin-bottom: 8px;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 1px solid var(--line-color);
  background-color: var(--bg-setting-item);
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }

  .remove-btn {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background-color: #ff0050;
    }
  }
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--bg-setting-item);
  border: 1px solid var(--line-color);
  border-radius: 20px;
  padding: 6px 12px;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #ff0050;
  }
}

.comment-input {
  flex: 1;
  background: transparent;
  color: var(--text-color);
  font-size: 13px;
  outline: none;
  border: none;

  &::placeholder {
    color: var(--user-text-color);
  }
}

.action-icons {
  display: flex;
  gap: 12px;
  color: var(--action-bar-icon-color);
  margin-left: 8px;

  .icon {
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--text-color);
    }
  }
}

.emoji-picker-popup {
  position: absolute !important;
  bottom: calc(100% + 10px) !important;
  right: 0 !important;
  left: auto !important;
  transform: none !important;
}
</style>
