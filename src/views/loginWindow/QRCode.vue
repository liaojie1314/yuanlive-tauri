<template>
  <n-config-provider :theme="naiveTheme" data-tauri-drag-region class="login-box size-full rounded-8px select-none">
    <!--顶部操作栏-->
    <action-bar :max-w="false" :shrink="false" proxy data-tauri-drag-region />

    <n-flex justify="center" class="mt-15px" data-tauri-drag-region>
      <img src="/vite.svg" class="w-140px h-60px drop-shadow-xl" alt="" data-tauri-drag-region />
    </n-flex>

    <!-- 二维码 -->
    <n-flex justify="center" class="mt-25px" data-tauri-drag-region>
      <n-skeleton v-if="loading" style="border-radius: 12px" :width="204" :height="204" :sharp="false" size="medium" />
      <div v-else class="relative">
        <n-qr-code
          :size="180"
          class="rounded-12px"
          :class="{ blur: scanStatus.show || refreshing }"
          :value="qrCodeValue"
          :color="qrCodeColor"
          :bg-color="qrCodeBgColor"
          :type="qrCodeType"
          :icon-src="qrCodeIcon"
          :icon-size="36"
          :icon-margin="2"
          :error-correction-level="qrErrorCorrectionLevel"
          @click="refreshQRCode" />
        <!-- 二维码状态 -->
        <n-flex
          v-if="scanStatus.show"
          vertical
          :size="12"
          align="center"
          class="w-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style="pointer-events: none">
          <svg class="size-42px animate-pulse">
            <use :href="`#${scanStatus.icon}`"></use>
          </svg>
          <span class="text-(14px #e3e3e3)">{{ scanStatusText }}</span>
        </n-flex>

        <n-flex
          v-if="refreshing"
          vertical
          :size="12"
          align="center"
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style="pointer-events: none">
          <n-spin size="small" />
          <span class="text-(16px #e3e3e3)">{{ t("auth.qr.overlay.refreshing") }}</span>
        </n-flex>
      </div>
    </n-flex>

    <n-flex justify="center" class="mt-15px text-(14px #808080)">
      {{ loadText }}
    </n-flex>

    <!-- 底部操作栏 -->
    <n-flex justify="center" class="text-14px mt-48px" data-tauri-drag-region>
      <div class="color-#13987f cursor-pointer" @click="router.push('/login')">
        {{ t("auth.qr.actions.accountLogin") }}
      </div>
      <div class="w-1px h-14px bg-#ccc dark:bg-#707070"></div>
      <div
        class="color-#13987f cursor-pointer"
        @click="createWebviewWindow(t('auth.qr.actions.registerTitle'), 'register', 380, 520)">
        {{ t("auth.qr.actions.register") }}
      </div>
    </n-flex>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";

import router from "@/router";
import { StorageKeyEnum, TauriCommandEnum, ThemeEnum } from "@/enums";
import { generateQRCodeApi, checkQRStatusApi } from "@/api/auth";
import { useI18nGlobal } from "@/services/i18n";
import { useWindow } from "@/hooks/useWindow";
import { useGlobalStore } from "@/stores/global";
import { useSettingStore } from "@/stores/setting";
import { getEnhancedFingerprint } from "@/services/fingerprint";

const { t } = useI18nGlobal();
const { createWebviewWindow } = useWindow();
const globalStore = useGlobalStore();
const settingStore = useSettingStore();
const { showTray } = storeToRefs(globalStore);
const { themes } = storeToRefs(settingStore);
const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));

type LoadTextKey = "loading" | "refreshing" | "scanHint" | "login" | "retry" | "authPending";
type ScanStatusTextKey = "success" | "error" | "auth" | "expired" | "fetchFailed" | "generateFail" | "generalError";
const loadTextKey = ref<LoadTextKey>("loading");
const loadText = computed(() => t(`auth.qr.loadText.${loadTextKey.value}`));
const loading = ref(true);
const refreshing = ref(false); // 是否正在刷新
const qrCodeValue = ref("");
const qrCodeResp = ref();
const qrCodeColor = ref("#000000");
const qrCodeBgColor = ref("#FFFFFF");
const qrCodeType = ref("canvas" as const);
const qrCodeIcon = ref("/vite.svg");
const qrErrorCorrectionLevel = ref("H" as const);
// 轮训相关
const pollInterval = ref<NodeJS.Timeout | null>(null);
const pollStartAt = ref<number | null>(null);
const MAX_POLL_DURATION = 5 * 60 * 1000; // 5分钟超时，防止长时间占用内存
const pollingRequesting = ref(false);
const confirmedHandled = ref(false);
const scanStatus = ref<{
  status: "error" | "success" | "auth";
  icon: "cloudError" | "success" | "Security";
  textKey: ScanStatusTextKey | "";
  show: boolean;
}>({ status: "success", icon: "success", textKey: "", show: false });

const scanStatusText = computed(() =>
  scanStatus.value.textKey ? t(`auth.qr.overlay.${scanStatus.value.textKey}`) : ""
);

// 刷新二维码
const refreshQRCode = async () => {
  if (scanStatus.value.textKey !== "error" && scanStatus.value.textKey !== "auth") return;
  refreshing.value = true;
  loadTextKey.value = "refreshing";

  scanStatus.value = {
    status: "success",
    icon: "success",
    textKey: "",
    show: false
  };

  // 先清除之前的轮询
  clearPolling();
  pollingRequesting.value = false;
  confirmedHandled.value = false;
  // 重新生成二维码
  await handleQRCode();
};

const startPolling = () => {
  if (pollInterval.value) clearInterval(pollInterval.value);
  pollStartAt.value = Date.now();
  pollInterval.value = setInterval(async () => {
    // 超时保护：超过 5 分钟自动停止并提示
    if (pollStartAt.value && Date.now() - pollStartAt.value > MAX_POLL_DURATION) {
      clearPolling;
      handleError("expired");
      return;
    }

    if (pollingRequesting.value || confirmedHandled.value) return;
    pollingRequesting.value = true;

    try {
      const res = await checkQRStatusApi({
        qrId: qrCodeResp.value.qrId,
        clientId: localStorage.getItem(StorageKeyEnum.CLIENT_ID) as string,
        deviceHash: qrCodeResp.value.deviceHash,
        deviceType: "PC"
      });
      switch (res.status) {
        case "PENDING":
          // 等待中
          break;
        case "SCANNED":
          // 已扫描, 等待确认
          handleAuth();
          break;
        case "CONFIRMED":
          // 已确认
          handleConfirmed(res);
          break;
        case "EXPIRED":
          // 已过期
          clearPolling();
          handleError("expired");
          break;
        default:
          break;
      }
    } catch (error) {
      if (!confirmedHandled.value) await handleQRCode();
    } finally {
      if (!confirmedHandled.value) pollingRequesting.value = false;
    }
  }, 2000);
};

/**
 * 清除轮询
 */
const clearPolling = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
    pollInterval.value = null;
  }
  pollStartAt.value = null;
};

/**
 * 处理确认登录
 * @param res 确认登录响应
 */
const handleConfirmed = async (res: any) => {
  if (confirmedHandled.value) return;
  confirmedHandled.value = true;
  clearPolling();
  try {
    await invoke(TauriCommandEnum.UPDATE_TOKEN, {
      req: {
        uid: res.data.uid,
        token: res.data.token,
        refresh_token: res.data.refresh_token || ""
      }
    });
    // TODO:登录
  } catch (error) {
    console.error("获取用户详情失败: ", error);
    confirmedHandled.value = false;
    handleError("fetchFailed");
  }
};

/**
 * 处理二维码显示和刷新
 */
const handleQRCode = async () => {
  try {
    qrCodeResp.value = await generateQRCodeApi();
    qrCodeValue.value = JSON.stringify({ type: "login", qrId: qrCodeResp.value.qrId });
    loadTextKey.value = "scanHint";
    loading.value = false;
    refreshing.value = false;

    if (scanStatus.value.show) {
      scanStatus.value.show = false;
      scanStatus.value.textKey = "";
    }

    // 开始轮训
    confirmedHandled.value = false;
    pollingRequesting.value = false;
    startPolling();
  } catch (error) {
    handleError("generateFail");
  }
};

/**
 * 处理认证中状态
 */
const handleAuth = () => {
  loading.value = false;
  scanStatus.value = {
    status: "auth",
    icon: "Security",
    textKey: "auth",
    show: true
  };
  loadTextKey.value = "authPending";
};

/**
 * 处理失败场景
 * @param key 错误类型
 */
const handleError = (key: ScanStatusTextKey = "generalError") => {
  loading.value = false;
  scanStatus.value = {
    status: "error",
    icon: "cloudError",
    textKey: key,
    show: true
  };
  loadTextKey.value = "retry";
};

onMounted(async () => {
  showTray.value = false;
  // 存储此次登陆设备指纹
  const clientId = await getEnhancedFingerprint();
  localStorage.setItem(StorageKeyEnum.CLIENT_ID, clientId);
  await handleQRCode();
});

onUnmounted(() => {
  // 组件卸载时清除轮询
  clearPolling();
});
</script>

<style scoped lang="scss">
@use "@/styles/global/login-bg";
</style>
