<template>
  <div class="p-0 m-0 select-none">
    <user-info-card
      :name="userInfo.name"
      :avatar="userInfo.avatar"
      :verified="userInfo.verified"
      :following="userInfo.following"
      :followers="userInfo.followers"
      :likes="userInfo.likes"
      :live-users="userInfo.liveUsers"
      :yuanlive-id="userInfo.yuanliveId"
      v-model:save-login-info="saveLoginInfo" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import UserInfoCard from "@/components/home/UserInfoCard.vue";

interface UserInfo {
  name: string;
  avatar: string;
  verified: boolean;
  following: number;
  followers: number;
  likes: number;
  liveUsers: number;
  yuanliveId: string;
}

const userInfo = ref<UserInfo>({
  name: "元渊",
  avatar: "https://picsum.photos/200",
  verified: true,
  following: 94,
  followers: 2,
  likes: 0,
  liveUsers: 4,
  yuanliveId: "20682669069"
});

const saveLoginInfo = ref(true);
</script>

<style scoped></style>
