<template>
  <n-config-provider data-tauri-drag-region :theme="naiveTheme" class="remote-login-modal size-full select-none">
    <div class="w-350px h-310px border-rd-8px" data-tauri-drag-region>
      <div class="bg-[--bg-popover] size-full p-6px box-border flex flex-col" data-tauri-drag-region>
        <svg
          v-if="!isMac()"
          @click="handleConfirm"
          class="w-14px h-14px ml-a cursor-pointer select-none text-[--text-color]">
          <use href="#close"></use>
        </svg>
        <div class="flex flex-col p-10px select-none">
          <n-flex vertical align="center" :size="20">
            <span class="text-(14px [--text-color])">{{ t("auth.remoteLogin.notice") }}</span>
            <div class="relative">
              <img class="rounded-full size-72px" src="/vite.svg" alt="" />
              <div
                class="absolute inset-0 bg-[--avatar-hover-bg] backdrop-blur-[2px] rounded-full flex items-center justify-center">
                <svg class="size-34px text-white animate-pulse">
                  <use href="#cloudError"></use>
                </svg>
              </div>
            </div>
            <div class="text-(13px [--text-color]) px-12px leading-loose text-center mb-10px">
              <p>{{ t("auth.remoteLogin.otherDeviceLogin") }}</p>
              <span class="text-#13987f">{{ ip }}</span>
              <p>{{ t("auth.remoteLogin.needChangePassword") }}</p>
            </div>
          </n-flex>
          <n-button class="w-full color-#fff" color="#13987f" @click="handleConfirm">
            {{ t("auth.remoteLogin.confirm") }}
          </n-button>
        </div>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme } from "naive-ui";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useWindow } from "@/hooks/useWindow.ts";
import { useSettingStore } from "@/stores/setting";
import { isMac } from "@/utils/PlatformUtils";
import { useI18nGlobal } from "@/services/i18n";

const { getWindowPayload } = useWindow();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);
const { t } = useI18nGlobal();

const naiveTheme = computed(() => (themes.value.content === "dark" ? darkTheme : lightTheme));

const ip = ref(t("auth.remoteLogin.unknownIp"));
const showModal = ref(true);
let currentWindow: WebviewWindow | null = null;
let parentWindow: WebviewWindow | null = null;
let unlistenClose: (() => void) | undefined;

/**
 * 从窗口负载中获取异地登录IP
 */
const assignIpFromPayload = async () => {
  try {
    const payload = await getWindowPayload<{ ip?: string }>("modal-remoteLogin");
    if (payload?.ip) {
      ip.value = payload.ip;
    }
  } catch (error) {
    console.error("获取异地登录信息失败:", error);
  }
};

const handleConfirm = async () => {
  showModal.value = false;
  await parentWindow?.setEnabled(true);
  await currentWindow?.close();
};

onMounted(async () => {
  showModal.value = true;
  currentWindow = getCurrentWebviewWindow();
  parentWindow = await WebviewWindow.getByLabel("login");
  await assignIpFromPayload();
  await currentWindow.show();
  if (currentWindow) {
    unlistenClose = await currentWindow.onCloseRequested(async () => {
      showModal.value = false;
      await parentWindow?.setEnabled(true);
    });
  }
});

onUnmounted(async () => {
  showModal.value = false;
  if (unlistenClose) {
    unlistenClose();
    unlistenClose = undefined;
  }
  await parentWindow?.setEnabled(true);
  currentWindow = null;
  parentWindow = null;
});
</script>

<style scoped>
.remote-login-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}
</style>
