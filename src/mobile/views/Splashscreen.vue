<template>
  <!-- 🚀 加载页 DOM -->
  <div id="loading-page" class="h-100vh"></div>
</template>

<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";

import { TauriCommandEnum } from "@/enums";
import { useLogin } from "@/hooks/useLogin.ts";
import { useSettingStore } from "@/stores/setting.ts";

const settingStore = useSettingStore();
const router = useRouter();
const { normalLogin } = useLogin();

/** 初始化加载页 */
const init = async () => {
  if (settingStore.login.autoLogin) {
    normalLogin("mobile", true);
  } else {
    router.push("/mobile/login");
    await invoke(TauriCommandEnum.HIDE_SPLASH_SCREEN);
  }
};

onMounted(() => {
  init();
});
</script>

<style scoped lang="scss">
#loading-page {
  z-index: 9999;
  background-image: url("/mobile/splash.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 1;
}
</style>
