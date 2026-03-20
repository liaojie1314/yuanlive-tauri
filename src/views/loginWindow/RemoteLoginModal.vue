<template>
  <n-config-provider data-tauri-drag-region class="remote-login-modal size-full select-none" :theme="naiveTheme">
    <div data-tauri-drag-region class="w-350px h-310px border-rd-8px">
      <div data-tauri-drag-region class="p-6px box-border flex size-full flex-col bg-[--bg-popover]">
        <svg
          v-if="!isMac()"
          class="w-14px h-14px ml-a cursor-pointer text-[--text-color] select-none"
          @click="handleConfirm">
          <use href="#close"></use>
        </svg>
        <div class="p-10px flex flex-col select-none">
          <n-flex vertical align="center" :size="20">
            <span class="text-(14px [--text-color])">{{ t("auth.remoteLogin.notice") }}</span>
            <div class="relative">
              <img src="/vite.svg" alt="" class="size-72px rounded-full" />
              <div class="absolute inset-0 flex-center rounded-full bg-[--avatar-hover-bg] backdrop-blur-[2px]">
                <svg class="size-34px animate-pulse text-white">
                  <use href="#cloudError"></use>
                </svg>
              </div>
            </div>
            <div class="text-(13px [--text-color]) px-12px mb-10px text-center leading-loose">
              <p>{{ t("auth.remoteLogin.otherDeviceLogin") }}</p>
              <span class="text-#13987f">{{ ip }}</span>
              <p>{{ t("auth.remoteLogin.needChangePassword") }}</p>
            </div>
          </n-flex>
          <n-button color="#13987f" class="color-#fff w-full" @click="handleConfirm">
            {{ t("auth.remoteLogin.confirm") }}
          </n-button>
        </div>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useWindow } from "@/hooks/useWindow.ts";
import { useSettingStore } from "@/stores/setting";
import { isMac } from "@/utils/PlatformUtils";

const { t } = useI18n();
const { getWindowPayload } = useWindow();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);

let currentWindow: WebviewWindow | null = null;
let parentWindow: WebviewWindow | null = null;
let unlistenClose: (() => void) | undefined;

const ip = ref(t("auth.remoteLogin.unknownIp"));
const showModal = ref(true);

const naiveTheme = computed(() => (themes.value.content === "dark" ? darkTheme : lightTheme));

/** 从窗口负载中获取异地登录IP */
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

/** 处理确认按钮点击事件 */
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
