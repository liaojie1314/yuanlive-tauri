<template>
  <!-- 单独使用n-config-provider来包裹不需要主题切换的界面 -->
  <n-config-provider :theme="darkTheme" data-tauri-drag-region class="login-box size-full rounded-8px select-none">
    <!--顶部操作栏-->
    <action-bar :max-w="false" proxy />

    <div>{{ $t("auth.button.login") }}</div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme } from "naive-ui";
</script>

<style scoped></style>
