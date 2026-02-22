<template>
  <div class="video-side-panel" :class="{ 'is-open': show }">
    <div class="panel-inner">
      <div class="panel-header">
        <div class="tabs">
          <div class="tab-item" :class="{ active: activeTab === 'detail' }" @click="activeTab = 'detail'">
            详情
            <div v-if="activeTab === 'detail'" class="active-line"></div>
          </div>
          <div class="tab-item" :class="{ active: activeTab === 'comment' }" @click="activeTab = 'comment'">
            评论
            <div v-if="activeTab === 'comment'" class="active-line"></div>
          </div>
        </div>
        <div class="close-btn" @click="handleClose">
          <i-mdi-close class="w-5 h-5" />
        </div>
      </div>

      <div class="panel-content">
        <div v-show="activeTab === 'detail'" class="h-full w-full">
          <n-scrollbar class="h-full">
            <div class="p-4 text-[--text-color]">
              <div class="flex items-center gap-3 mb-4">
                <img src="https://picsum.photos/60/60" class="w-10 h-10 rounded-full" />
                <div>
                  <div class="font-medium">视频作者名称</div>
                  <div class="text-xs text-[--user-text-color]">刚刚发布 · 广东</div>
                </div>
              </div>
              <p class="text-sm">这里是视频的详情描述内容...</p>
            </div>
          </n-scrollbar>
        </div>

        <div v-show="activeTab === 'comment'" class="h-full w-full relative overflow-hidden">
          <n-scrollbar class="h-full">
            <div class="px-4 py-3 box-border">
              <div class="text-xs text-[--user-text-color] mb-4">全部评论({{ totalComments }})</div>

              <div v-for="comment in commentList" :key="comment.id" class="comment-item">
                <img :src="comment.user.avatar" class="avatar" />
                <div class="comment-main border-b border-[--line-color] pb-4">
                  <div class="user-info">
                    <span class="username">{{ comment.user.username }}</span>
                    <span v-if="comment.user.isAuthor" class="author-badge">作者</span>
                  </div>

                  <template v-if="!comment.isDisliked">
                    <div class="content-text">{{ comment.content }}</div>
                    <img v-if="comment.image" :src="comment.image" class="comment-image" />
                  </template>
                  <div v-else class="collapsed-message">
                    <i-mdi-information-outline class="collapse-icon" />
                    该评论被折叠
                  </div>
                  <div class="comment-actions">
                    <span class="time-loc">{{ comment.time }} · {{ comment.location }}</span>
                    <span class="action-btn">回复</span>

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
                    <span>{{ comment.showReplies ? "收起回复" : `展开${comment.replies.length}条回复` }}</span>
                    <i-mdi-chevron-down :class="{ 'rotate-180': comment.showReplies }" class="transition-transform" />
                  </div>

                  <div v-show="comment.showReplies" class="replies-container">
                    <div v-for="reply in comment.replies" :key="reply.id" class="comment-item reply-item">
                      <img :src="reply.user.avatar" class="avatar-small" />
                      <div class="comment-main">
                        <div class="user-info">
                          <span class="username">{{ reply.user.username }}</span>
                          <span v-if="reply.user.isAuthor" class="author-badge">作者</span>
                        </div>

                        <template v-if="!reply.isDisliked">
                          <div class="content-text">{{ reply.content }}</div>
                          <img v-if="reply.image" :src="reply.image" class="comment-image" />
                        </template>
                        <div v-else class="collapsed-message">
                          <i-mdi-information-outline class="collapse-icon" />
                          该评论被折叠
                        </div>
                        <div class="comment-actions">
                          <span class="time-loc">{{ reply.time }} · {{ reply.location }}</span>
                          <span class="action-btn">回复</span>
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
            placeholder="留下你的精彩评论吧"
            class="comment-input"
            @keyup.enter="submitComment" />
          <div class="action-icons">
            <i-ph-image class="icon" @click="handleImageUpload" title="上传图片" />
            <i-ph-smiley class="icon" @click.stop="showEmojiPicker = !showEmojiPicker" title="表情" />
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

const props = defineProps<{
  show: boolean;
  tab: "detail" | "comment";
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "update:tab": [value: "detail" | "comment"];
}>();

const activeTab = computed({
  get: () => props.tab,
  set: (val) => emit("update:tab", val)
});

const handleClose = () => {
  emit("update:show", false);
};

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

const totalComments = computed(() => {
  return commentList.value.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0);
});

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

const toggleDislike = (item: CommentData) => {
  item.isDisliked = !item.isDisliked;
  if (item.isDisliked && item.isLiked) {
    item.isLiked = false;
    item.likes--;
  }
};

const commentText = ref("");
const showEmojiPicker = ref(false);
const uploadImagePreview = ref(""); // 预览图片URL
let uploadImagePath = ""; // Tauri本地路径

// 点击页面其他区域关闭表情包
const closeEmojiPicker = () => {
  showEmojiPicker.value = false;
};

const onSelectEmoji = (emoji: string) => {
  commentText.value += emoji;
};

// 使用 Tauri API 选择图片
const handleImageUpload = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] }]
    });

    if (selected) {
      // 适配 Tauri v1 (string) 和 v2 (string | null) 的返回类型
      uploadImagePath = Array.isArray(selected) ? selected[0] : selected;
      // 将本地绝对路径转换为可在 webview 渲染的协议 url
      uploadImagePreview.value = convertFileSrc(uploadImagePath);
    }
  } catch (err) {
    console.error("图片上传失败:", err);
  }
};

const removeImage = () => {
  uploadImagePreview.value = "";
  uploadImagePath = "";
};

// 提交评论
const submitComment = () => {
  if (!commentText.value.trim() && !uploadImagePreview.value) return;

  const newComment: CommentData = {
    id: Date.now(),
    user: { username: "我", avatar: "https://picsum.photos/60/60" },
    content: commentText.value,
    image: uploadImagePreview.value, // 如果有图片
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

/* Emoji 弹出层定位 */
.emoji-picker-popup {
  position: absolute !important;
  bottom: calc(100% + 10px) !important;
  right: 0 !important;
  left: auto !important;
  transform: none !important;
}
</style>
