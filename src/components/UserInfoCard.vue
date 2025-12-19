<template>
  <div class="user-profile-container">
    <div class="user-profile-header">
      <div class="user-avatar-wrapper">
        <img :src="avatar" :alt="`${name}的头像`" class="user-avatar" />
      </div>
      <div class="user-info-wrapper">
        <div class="user-name-section">
          <span class="user-name">{{ name }}</span>
          <span v-if="verified" class="user-verified">✓</span>
        </div>
        <div class="user-stats">
          <span class="stat-item">
            关注
            <span class="stat-value">{{ following }}</span>
          </span>
          <span class="stat-divider">|</span>
          <span v-if="liveUsers > 0" class="stat-item live">{{ liveUsers }}人正在直播</span>
          <span v-if="liveUsers > 0" class="stat-divider">|</span>
          <span class="stat-item">
            粉丝
            <span class="stat-value">{{ followers }}</span>
          </span>
          <span class="stat-divider">|</span>
          <span class="stat-item">
            获赞
            <span class="stat-value">{{ likes }}</span>
          </span>
        </div>
        <div class="user-id">
          <span class="id-label">YuanLive号:</span>
          <span class="id-value">{{ yuanliveId }}</span>
        </div>
      </div>
      <div class="user-actions">
        <div class="save-login-info">
          <span class="info-label">保存登录信息</span>
          <n-switch :value="localSaveLoginInfo" @update:value="handleSaveLoginInfoChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { NSwitch } from "naive-ui";

interface Props {
  name: string;
  avatar: string;
  verified?: boolean;
  following: number;
  followers: number;
  likes: number;
  liveUsers: number;
  yuanliveId?: string;
  saveLoginInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  saveLoginInfo: false
});

const emit = defineEmits<{
  "update:saveLoginInfo": [value: boolean];
}>();

// 使用本地ref来处理双向绑定
const localSaveLoginInfo = ref(props.saveLoginInfo);

// 监听props变化，更新本地ref
watch(
  () => props.saveLoginInfo,
  (newVal) => {
    localSaveLoginInfo.value = newVal;
  }
);

// 处理开关变化，发射事件
const handleSaveLoginInfoChange = (value: boolean) => {
  localSaveLoginInfo.value = value;
  emit("update:saveLoginInfo", value);
};
</script>

<style scoped>
.user-profile-container {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 20px;
  border-radius: 12px;
}

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: space-between;
}

.user-avatar-wrapper {
  flex-shrink: 0;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.user-info-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.user-name-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.user-verified {
  color: #1890ff;
  font-size: 20px;
  font-weight: bold;
}

.user-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.stat-item {
  display: inline;
  white-space: nowrap;
}

.stat-item.live {
  color: #ff4d4f;
  white-space: nowrap;
}

.stat-value {
  color: #333;
  font-weight: 500;
}

.stat-divider {
  color: #e0e0e0;
  margin: 0 4px;
  white-space: nowrap;
}

.user-id {
  font-size: 14px;
  color: #666;
}

.id-label {
  margin-right: 8px;
}

.id-value {
  font-weight: 500;
  color: #333;
}

.user-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.save-login-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
}

.info-label {
  white-space: nowrap;
}
</style>
