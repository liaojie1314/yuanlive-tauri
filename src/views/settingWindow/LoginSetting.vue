<template>
  <!-- 登录设置 -->
  <n-flex vertical data-tauri-drag-region :size="20">
    <n-flex vertical class="item-box" :size="12">
      <n-flex align="center" justify="space-between">
        <span>{{ t("setting.login.autoLoginStartup") }}</span>
        <n-switch size="small" v-model:value="autoLogin" />
      </n-flex>

      <div class="h-1px w-full bg-[--line-color]"></div>

      <n-flex align="center" justify="space-between">
        <span>{{ t("setting.login.launchStartup") }}</span>
        <n-switch size="small" v-model:value="autoStartup" />
      </n-flex>
    </n-flex>
  </n-flex>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

import { useSettingStore } from "@/stores/setting.ts";

const { t } = useI18n();

const settingStore = useSettingStore();
const { login } = storeToRefs(settingStore);

const autoLogin = ref(login.value.autoLogin);
const autoStartup = ref(login.value.autoStartup);

watchEffect(() => {
  settingStore.toggleLogin(autoLogin.value, autoStartup.value);
});

// 监听开机启动状态变化
watch(autoStartup, async (val: boolean) => {
  await (val ? enable() : disable());
});

onMounted(async () => {
  // 检查是否开启了开机启动
  autoStartup.value = await isEnabled();
});
</script>

<style scoped lang="scss">
.item-box {
  @apply text-14px rounded-8px p-10px border-(solid 1px [--line-color]) custom-shadow bg-[--bg-setting-item] text-[--text-color];
}
</style>
