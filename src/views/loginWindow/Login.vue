<template>
  <n-config-provider data-tauri-drag-region class="login-box rounded-8px size-full select-none" :theme="naiveTheme">
    <!--顶部操作栏-->
    <action-bar proxy :max-w="false" />
    <!--  手动登录  -->
    <n-flex v-if="uiState === 'manual'" vertical :size="25">
      <!-- 头像 -->
      <n-flex justify="center" data-tauri-drag-region class="pt-35px w-full">
        <n-avatar
          fallback-src="/logo.webp"
          src="/logo.webp"
          class="welcome size-80px rounded-50% border-(2px solid #fff) dark:border-(2px solid #606060)"
          :color="themes.content === ThemeEnum.DARK ? '#282828' : '#fff'" />
      </n-flex>

      <!-- 登录菜单 -->
      <n-flex vertical class="ma w-260px h-full text-center" :size="16">
        <n-input
          size="large"
          type="text"
          autocorrect="off"
          autocapitalize="off"
          clearable
          v-model:value="userInfo.account"
          :placeholder="accountPH"
          :spellcheck="false"
          @focus="accountPH = ''"
          @blur="accountPH = t('auth.input.account.placeholder')" />
        <n-input
          maxlength="16"
          minlength="6"
          size="large"
          show-password-on="click"
          type="password"
          autocorrect="off"
          autocapitalize="off"
          clearable
          class="pl-16px"
          v-model:value="userInfo.password"
          :placeholder="passwordPH"
          :spellcheck="false"
          @focus="passwordPH = ''"
          @blur="passwordPH = t('auth.input.pass.placeholder')" />

        <!-- 协议 -->
        <n-flex align="center" justify="center" :size="6">
          <n-checkbox v-model:checked="protocol" />
          <div class="text-12px color-#909090 lh-14px agreement cursor-default">
            <span>{{ t("auth.agreement.text1") }}</span>
            <span class="color-#13987f cursor-pointer">
              {{ t("auth.agreement.text2") }}
            </span>
            <span>{{ t("auth.agreement.text3") }}</span>
            <span class="color-#13987f cursor-pointer">
              {{ t("auth.agreement.text4") }}
            </span>
          </div>
        </n-flex>
        <n-button
          tertiary
          class="gradient-button mt-8px mb-50px color-#fff w-full"
          :loading="loading"
          :disabled="loginDisabled"
          @click="normalLogin('desktop', false)">
          <span>{{ loginText }}</span>
        </n-button>
      </n-flex>
    </n-flex>
    <!-- 自动登录 -->
    <n-flex v-else-if="uiState === 'auto'" vertical data-tauri-drag-region :size="29">
      <n-flex justify="center" class="mt-15px">
        <img src="/logo.webp" alt="" class="w-140px h-60px" />
      </n-flex>
      <n-flex vertical :size="30">
        <!-- 头像 -->
        <n-flex justify="center">
          <n-avatar
            round
            fallback-src="/logo.webp"
            src="/logo.webp"
            :size="110"
            :color="themes.content === ThemeEnum.DARK ? '#282828' : '#fff'" />
        </n-flex>

        <n-flex justify="center">
          <n-ellipsis style="max-width: 200px" class="text-(18px [--user-text-color])">
            {{ userStore.userInfo?.username || "" }}
          </n-ellipsis>
        </n-flex>
      </n-flex>

      <n-flex justify="center">
        <n-button
          tertiary
          class="gradient-button w-200px mt-12px mb-40px color-#fff"
          :loading="loading"
          :disabled="loginDisabled"
          @click="normalLogin('desktop', true)">
          <span>{{ loginText }}</span>
        </n-button>
      </n-flex>
    </n-flex>
    <!-- 底部操作栏 -->
    <div class="text-14px gap-x-12px grid w-full grid-cols-[1fr_auto_1fr] items-center">
      <div
        class="color-#13987f cursor-pointer justify-self-end text-right"
        :title="qrCodeTitle"
        @click="router.push('/qrCode')">
        {{ qrCodeLabel }}
      </div>
      <div class="w-1px h-14px bg-#ccc dark:bg-#707070 justify-self-center"></div>
      <div
        v-if="uiState === 'auto'"
        class="color-#13987f cursor-pointer justify-self-start text-left"
        :title="removeAccountTitle"
        @click="userStore.userInfo = void 0">
        {{ removeAccountLabel }}
      </div>
      <div v-else class="justify-self-start text-left">
        <n-popover
          id="moreShow"
          trigger="click"
          class="bg-#fdfdfd98! dark:bg-#48484e98! backdrop-blur-sm"
          v-model:show="moreShow"
          :show-arrow="false">
          <template #trigger>
            <div class="color-#13987f cursor-pointer" :title="moreTitle">{{ moreLabel }}</div>
          </template>
          <n-flex vertical :size="2">
            <div
              class="register text-14px hover:bg-#90909030 hover:rounded-6px p-8px cursor-pointer"
              @click="createWebviewWindow('注册', 'register', 380, 520)">
              {{ t("auth.option.items.register") }}
            </div>
            <div
              class="text-14px hover:bg-#90909030 hover:rounded-6px p-8px cursor-pointer"
              @click="createWebviewWindow('忘记密码', 'forgetPassword', 600, 600)">
              {{ t("auth.option.items.forget") }}
            </div>
            <div
              v-if="!isCompatibility()"
              class="text-14px hover:bg-#90909030 hover:rounded-6px p-8px cursor-pointer"
              :class="{ network: isMac() }"
              @click="router.push('/network')">
              {{ t("auth.option.items.networkSetting") }}
            </div>
          </n-flex>
        </n-popover>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";
import { useNetwork } from "@vueuse/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { ThemeEnum } from "@/enums";
import { useUserStore } from "@/stores/user";
import { useGuideStore } from "@/stores/guide";
import { useGlobalStore } from "@/stores/global";
import { useSettingStore } from "@/stores/setting";
import { useLogin } from "@/hooks/useLogin";
import { useWindow } from "@/hooks/useWindow";
import { useCheckUpdate } from "@/hooks/useCheckUpdate";
import { type DriverStepConfig, useDriver } from "@/hooks/useDriver";
import { formatBottomText } from "@/utils/FormattingUtils";
import { isCompatibility, isDesktop, isMac } from "@/utils/PlatformUtils";

const { t } = useI18n();
const router = useRouter();
// 网络连接是否正常
const { isOnline } = useNetwork();
const { checkUpdate, CHECK_UPDATE_LOGIN_TIME } = useCheckUpdate();
const { createWebviewWindow, createModalWindow, getWindowPayload } = useWindow();
const { userInfo, uiState, loading, loginDisabled, loginText, normalLogin } = useLogin();
const userStore = useUserStore();
const guideStore = useGuideStore();
const globalStore = useGlobalStore();
const settingStore = useSettingStore();
const { isGuideCompleted } = storeToRefs(guideStore);
const { themes, login } = storeToRefs(settingStore);
const { showTray, firstEnter } = storeToRefs(globalStore);

const driverSteps = computed<DriverStepConfig[]>(() => [
  {
    element: ".welcome",
    popover: {
      title: t("auth.guide.welcome.title"),
      description: t("auth.guide.welcome.desc"),
      side: "bottom",
      align: "center"
    }
  },
  {
    element: ".agreement",
    popover: {
      title: t("auth.guide.privacy.title"),
      description: t("auth.guide.privacy.desc"),
      onNextClick: () => {
        if (isMac()) {
          moreShow.value = true;
        }
      }
    }
  },
  {
    element: ".network",
    popover: {
      title: t("auth.guide.network.title"),
      description: t("auth.guide.network.desc"),
      onNextClick: () => {
        moreShow.value = true;
      }
    }
  },
  {
    element: ".register",
    popover: {
      title: t("auth.guide.register.title"),
      description: t("auth.guide.register.desc")
    }
  }
]);

const driverConfig = computed(() => ({
  nextBtnText: t("auth.guide.actions.next"),
  prevBtnText: t("auth.guide.actions.prev"),
  doneBtnText: t("auth.guide.actions.done"),
  progressText: t("auth.guide.actions.progress", {
    current: "{{current}}",
    total: "{{total}}"
  })
}));
const { startTour, reinitialize } = useDriver(driverSteps.value, driverConfig.value);

// 底部操作栏多语言超过6个字符时显示省略号
const MAX_BOTTOM_TEXT_LEN = 6;
// 导入Web Worker
const timerWorker = new Worker(new URL("@/workers/timer.worker.ts", import.meta.url));

// 输入框占位符
const accountPH = computed(() => t("auth.input.account.placeholder"));
const passwordPH = computed(() => t("auth.input.pass.placeholder"));
// 协议
const protocol = ref(true);
const moreShow = ref(false);

const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));
const qrCodeText = computed(() => t("auth.button.qrCode"));
const moreText = computed(() => t("auth.option.more"));
const removeAccountText = computed(() => t("auth.button.removeAccount"));
const qrCodeLabel = computed(() => formatBottomText(qrCodeText.value, MAX_BOTTOM_TEXT_LEN));
const moreLabel = computed(() => formatBottomText(moreText.value, MAX_BOTTOM_TEXT_LEN));
const removeAccountLabel = computed(() => formatBottomText(removeAccountText.value, MAX_BOTTOM_TEXT_LEN));
const qrCodeTitle = computed(() => (qrCodeLabel.value !== qrCodeText.value ? qrCodeText.value : undefined));
const moreTitle = computed(() => (moreLabel.value !== moreText.value ? moreText.value : undefined));
const removeAccountTitle = computed(() =>
  removeAccountLabel.value !== removeAccountText.value ? removeAccountText.value : undefined
);

/**
 * 点击非更多按钮时关闭更多菜单
 * @param event 点击事件
 */
const closeMenu = (event: MouseEvent) => {
  const target = event.target as Element;
  if (!target.matches("#moreShow")) {
    moreShow.value = false;
  }
};

/**
 * 点击登录按钮时触发登录
 * @param event 键盘事件
 */
const enterKey = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !loginDisabled.value) {
    normalLogin("desktop", false);
  }
};

/** 处理登录窗口加载时的异地登录载荷 */
const handlePendingRemoteLoginPayload = async () => {
  if (!isDesktop()) {
    return;
  }
  try {
    const payload = await getWindowPayload<{ remoteLogin?: { ip?: string } }>("login");
    if (payload?.remoteLogin) {
      await openRemoteLoginModal(payload.remoteLogin.ip);
    }
  } catch (error) {
    console.error("处理异地登录载荷失败:", error);
  }
};

/**
 * 打开异地登录提醒模态窗口
 * @param ip 异地登录IP地址
 */
const openRemoteLoginModal = async (ip?: string) => {
  if (!isDesktop()) {
    return;
  }
  const payloadIp = ip ?? "未知IP";
  console.log("打开异地登录提醒模态窗口", payloadIp);
  await createModalWindow(
    "异地登录提醒",
    "modal-remoteLogin",
    350,
    310,
    "login",
    {
      ip: payloadIp
    },
    {
      minWidth: 350,
      minHeight: 310
    }
  );
};

watchEffect(
  () => (loginDisabled.value = !(userInfo.value.account && userInfo.value.password && protocol.value && isOnline.value))
);

watch([driverSteps, driverConfig], ([steps, config]) => {
  reinitialize(steps, config);
});

// 监听 Worker 消息
timerWorker.onmessage = (e) => {
  const { type } = e.data;
  if (type === "timeout") {
    checkUpdate("login");
  }
};

// 添加错误处理
timerWorker.onerror = (error) => {
  console.error("[Worker Error]", error);
};

onMounted(async () => {
  // 检查引导状态，只有未完成时才启动引导
  if (!isGuideCompleted.value) {
    startTour();
  }
  firstEnter.value = true;
  await handlePendingRemoteLoginPayload();
  // 始终初始化托盘菜单状态为false
  showTray.value = false;

  await getCurrentWebviewWindow().show();

  // 自动登录时显示自动登录界面并触发登录
  if (login.value.autoLogin) {
    uiState.value = "auto";
    await normalLogin("desktop", true);
  } else {
    // 手动登录模式，自动填充第一个历史账号
    uiState.value = "manual";
    // TODO: 获取历史登录账号
  }

  window.addEventListener("click", closeMenu, true);
  window.addEventListener("keyup", enterKey);
  // 检查更新
  await checkUpdate("login", true);
  timerWorker.postMessage({
    type: "startTimer",
    msgId: "checkUpdate",
    duration: CHECK_UPDATE_LOGIN_TIME
  });
});

onUnmounted(() => {
  window.removeEventListener("click", closeMenu, true);
  window.removeEventListener("keyup", enterKey);
  // 清除Web Worker计时器
  timerWorker.postMessage({
    type: "clearTimer",
    msgId: "checkUpdate"
  });
  timerWorker.terminate();
});
</script>

<style scoped lang="sass">
@use "@/styles/global/login-bg"
@use "@/styles/login"
</style>
