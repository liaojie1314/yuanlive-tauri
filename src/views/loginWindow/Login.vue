<template>
  <!-- 单独使用n-config-provider来包裹不需要主题切换的界面 -->
  <n-config-provider :theme="naiveTheme" data-tauri-drag-region class="login-box size-full rounded-8px select-none">
    <!--顶部操作栏-->
    <action-bar :max-w="false" proxy />

    <!--  手动登录  -->
    <n-flex v-if="uiState === 'manual'" vertical :size="25">
      <!-- 头像 -->
      <n-flex justify="center" class="w-full pt-35px" data-tauri-drag-region>
        <n-avatar
          class="size-80px rounded-50% border-(2px solid #fff) dark:border-(2px solid #606060)"
          :color="themes.content === ThemeEnum.DARK ? '#282828' : '#fff'"
          fallback-src="/vite.svg"
          src="/vite.svg" />
      </n-flex>

      <!-- 登录菜单 -->
      <n-flex class="ma text-center h-full w-260px" vertical :size="16">
        <n-input
          v-model:value="userInfo.account"
          size="large"
          type="text"
          :placeholder="accountPH"
          :spellcheck="false"
          autocorrect="off"
          autocapitalize="off"
          @focus="accountPH = ''"
          @blur="accountPH = t('auth.input.account.placeholder')"
          clearable />
        <n-input
          v-model:value="userInfo.password"
          class="pl-16px"
          maxlength="16"
          minlength="6"
          size="large"
          show-password-on="click"
          type="password"
          :placeholder="passwordPH"
          :spellcheck="false"
          autocorrect="off"
          autocapitalize="off"
          @focus="passwordPH = ''"
          @blur="passwordPH = t('auth.input.pass.placeholder')"
          clearable />

        <!-- 协议 -->
        <n-flex align="center" justify="center" :size="6">
          <n-checkbox v-model:checked="protocol" />
          <div class="text-12px color-#909090 cursor-default lh-14px agreement">
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
          class="gradient-button w-full mt-8px mb-50px color-#fff"
          :loading="loading"
          :disabled="loginDisabled"
          tertiary
          @click="login('PC', false)">
          <span>{{ loginText }}</span>
        </n-button>
      </n-flex>
    </n-flex>
    <!-- 自动登录 -->
    <n-flex v-else-if="uiState === 'auto'" vertical :size="29" data-tauri-drag-region>
      <n-flex justify="center" class="mt-15px">
        <img src="/vite.svg" class="w-140px h-60px" alt="" />
      </n-flex>
      <n-flex :size="30" vertical>
        <!-- 头像 -->
        <n-flex justify="center">
          <n-avatar
            round
            :size="110"
            :color="themes.content === ThemeEnum.DARK ? '#282828' : '#fff'"
            fallback-src="/vite.svg"
            src="/vite.svg" />
        </n-flex>

        <n-flex justify="center">
          <n-ellipsis style="max-width: 200px" class="text-(18px [--user-text-color])">
            {{ userStore.userInfo?.userName || "" }}
          </n-ellipsis>
        </n-flex>
      </n-flex>

      <n-flex justify="center">
        <n-button
          :loading="loading"
          :disabled="loginDisabled"
          tertiary
          class="gradient-button w-200px mt-12px mb-40px color-#fff"
          @click="login('PC', true)">
          <span>{{ loginText }}</span>
        </n-button>
      </n-flex>
    </n-flex>
    <!-- 底部操作栏 -->
    <div class="text-14px grid grid-cols-[1fr_auto_1fr] items-center gap-x-12px w-full">
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
          v-model:show="moreShow"
          trigger="click"
          class="bg-#fdfdfd98! dark:bg-#48484e98! backdrop-blur-sm"
          :show-arrow="false">
          <template #trigger>
            <div class="color-#13987f cursor-pointer" :title="moreTitle">{{ moreLabel }}</div>
          </template>
          <n-flex vertical :size="2">
            <div
              class="register text-14px cursor-pointer hover:bg-#90909030 hover:rounded-6px p-8px"
              @click="createWebviewWindow('注册', 'register', 380, 520)">
              {{ t("auth.option.items.register") }}
            </div>
            <div
              class="text-14px cursor-pointer hover:bg-#90909030 hover:rounded-6px p-8px"
              @click="createWebviewWindow('忘记密码', 'forgetPassword', 600, 600)">
              {{ t("auth.option.items.forget") }}
            </div>
          </n-flex>
        </n-popover>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme } from "naive-ui";
import { useNetwork } from "@vueuse/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import router from "@/router";
import { ThemeEnum } from "@/enums";
import { useUserStore } from "@/stores/user";
import { useGlobalStore } from "@/stores/global";
import { useSettingStore } from "@/stores/setting";
import { useWindow } from "@/hooks/useWindow";
import { useLogin } from "@/hooks/useLogin";
import { useI18nGlobal } from "@/services/i18n";
import { formatBottomText } from "@/utils/FormattingUtils";

const { t } = useI18nGlobal();
// 网络连接是否正常
const { isOnline } = useNetwork();
const { createWebviewWindow } = useWindow();
const { userInfo, uiState, loading, loginDisabled, loginText, login } = useLogin();
const userStore = useUserStore();
const globalStore = useGlobalStore();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);
const { showTray } = storeToRefs(globalStore);
const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));

// 输入框占位符
const accountPH = ref(t("auth.input.account.placeholder"));
const passwordPH = ref(t("auth.input.pass.placeholder"));
// 协议
const protocol = ref(true);
const moreShow = ref(false);
// 底部操作栏多语言超过6个字符时显示省略号
const MAX_BOTTOM_TEXT_LEN = 6;
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

// 是否直接跳转
const isJumpDirectly = ref(true);

watchEffect(
  () => (loginDisabled.value = !(userInfo.value.account && userInfo.value.password && protocol.value && isOnline.value))
);

// 网络连接状态变化时，更新登录按钮状态
watch(
  () => isOnline,
  (newVal) => {
    loginDisabled.value = !newVal;
    loginText.value = newVal ? t("auth.button.login.default") : t("auth.button.login.networkError");
  }
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
    login("PC", false);
  }
};

onMounted(async () => {
  showTray.value = false;
  // 只有在需要登录的情况下才显示登录窗口
  if (!isJumpDirectly.value) {
    await getCurrentWebviewWindow().show();
  }

  // TODO: 自动登录时显示自动登录界面并触发登录
  uiState.value = "manual";

  window.addEventListener("click", closeMenu, true);
  window.addEventListener("keyup", enterKey);
});

onUnmounted(() => {
  window.removeEventListener("click", closeMenu, true);
  window.removeEventListener("keyup", enterKey);
});
</script>

<style scoped lang="sass">
@use "@/styles/global/login-bg"
@use "@/styles/login"
</style>
