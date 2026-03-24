<template>
  <van-config-provider class="h-full" :theme="settingStore.themes.content === ThemeEnum.DARK ? 'dark' : 'light'">
    <slot></slot>
  </van-config-provider>
</template>

<script setup lang="ts">
import { ThemeEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting";

const settingStore = useSettingStore();
</script>

<style>
:root {
  background-color: var(--tray-bg-color);
}
</style>
<style scoped lang="scss">
.safe-area-bottom {
  padding-bottom: var(--safe-area-inset-bottom);
}
</style>
