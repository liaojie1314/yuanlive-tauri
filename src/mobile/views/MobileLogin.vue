<template>
  <mobile-layout>
    <mobile-scaffold background="/login-bg.png" :safe-area="false">
      <template #container>
        <div class="h-full flex-col-center gap-40px">
          <div class="flex-center absolute top-13vh left-36px">
            <p class="text-(20px #333) dark:text-gray-400">{{ t("mobileLogin.welcome") }}</p>
            <img src="@/assets/mobile/name.svg" alt="" class="w-80px h-20px" />
          </div>

          <!-- 选项卡导航 -->
          <div class="w-80% h-40px absolute top-20vh flex-center">
            <div class="flex w-200px relative">
              <div
                :class="[
                  'z-999 w-100px text-center transition-all duration-300 ease-out',
                  activeTab === 'login' ? 'text-(18px #000) dark:text-white' : 'text-(16px #666) dark:text-gray-400'
                ]"
                @click="activeTab = 'login'">
                {{ t("mobileLogin.tabs.login") }}
              </div>
              <div
                :class="[
                  'z-999 w-100px text-center transition-all duration-300 ease-out',
                  activeTab === 'register' ? 'text-(18px #000) dark:text-white' : 'text-(16px #666) dark:text-gray-400'
                ]"
                @click="activeTab = 'register'">
                {{ t("mobileLogin.tabs.register") }}
              </div>
              <!-- 选中条 -->
              <div
                style="border-radius: 24px 42px 4px 24px"
                :class="[
                  'z-10 absolute bottom--4px h-6px w-34px bg-#13987f transition-all duration-300 ease-out',
                  activeTab === 'login' ? 'left-[33px]' : 'left-[133px]'
                ]"></div>
            </div>
          </div>

          <!-- 头像 -->
          <img v-if="activeTab === 'login'" alt="logo" class="size-86px rounded-full" :src="userInfo.avatar" />

          <!-- 登录表单 -->
          <n-flex v-if="activeTab === 'login'" vertical class="text-center w-80%" :size="16">
            <n-input
              size="large"
              type="text"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              clearable
              v-model:value="userInfo.account"
              :placeholder="accountPH"
              @focus="accountPH = ''"
              @blur="accountPH = t('mobileLogin.input.accountPlaceholder')"></n-input>

            <n-input
              size="large"
              show-password-on="click"
              type="password"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              clearable
              class="pl-22px mt-8px"
              v-model:value="userInfo.password"
              :placeholder="passwordPH"
              @focus="passwordPH = ''"
              @blur="passwordPH = t('mobileLogin.input.codePlaceholder')"></n-input>

            <n-flex justify="flex-end" :size="6">
              <n-button text color="#13987f" @click="handleForgetPassword">
                {{ t("mobileLogin.forgetCode") }}
              </n-button>
            </n-flex>

            <n-button
              tertiary
              style="color: #fff"
              class="w-full mt-8px mb-50px gradient-button"
              :loading="loading"
              :disabled="loginDisabled"
              @click="normalLogin('mobile', false)">
              <span>{{ loginText }}</span>
            </n-button>

            <!-- 协议 -->
            <n-flex align="center" justify="center" class="absolute bottom-0 w-[80%]" :style="agreementStyle" :size="6">
              <n-checkbox v-model:checked="protocol" />
              <div class="text-12px color-#909090 cursor-default lh-14px">
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
          </n-flex>

          <!-- 注册表单 - 第一步：昵称和密码 -->
          <n-flex v-if="activeTab === 'register' && currentStep === 1" vertical class="text-center w-80%" :size="16">
            <n-input
              size="large"
              maxlength="8"
              minlength="1"
              type="text"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              clearable
              v-model:value="registerInfo.username"
              :allow-input="noSideSpace"
              :placeholder="registerNamePH"
              @focus="registerNamePH = ''"
              @blur="registerNamePH = t('mobileLogin.register.input.nickname')" />

            <n-input
              size="large"
              minlength="6"
              show-password-on="click"
              type="password"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              clearable
              class="pl-16px"
              v-model:value="registerInfo.password"
              :allow-input="noSideSpace"
              :placeholder="registerPasswordPH"
              @focus="registerPasswordPH = ''"
              @blur="registerPasswordPH = t('mobileLogin.register.input.password')" />

            <n-input
              size="large"
              minlength="6"
              show-password-on="click"
              type="password"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              clearable
              class="pl-16px"
              v-model:value="registerInfo.confirmPassword"
              :allow-input="noSideSpace"
              :placeholder="confirmPasswordPH"
              @focus="confirmPasswordPH = ''"
              @blur="confirmPasswordPH = t('mobileLogin.register.input.confirmPassword')" />

            <!-- 密码提示信息 -->
            <n-flex vertical v-if="registerInfo.password" class="mt-8px" :size="10">
              <Validation
                :value="registerInfo.password"
                :message="t('mobileLogin.register.passValidateInfo.minLength', { len: 6 })"
                :validator="validateMinLength" />
              <Validation
                :value="registerInfo.password"
                :message="t('mobileLogin.register.passValidateInfo.validCharacters')"
                :validator="validateAlphaNumeric" />
              <Validation
                :value="registerInfo.password"
                :message="t('mobileLogin.register.passValidateInfo.mustSpecialChar')"
                :validator="validateSpecialChar" />
            </n-flex>

            <!-- 协议 -->
            <n-flex align="center" justify="center" class="mt-10px" :size="6">
              <n-checkbox v-model:checked="registerProtocol" />
              <div class="text-12px color-#909090 cursor-default lh-14px">
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
              style="color: #fff"
              class="w-full mt-8px mb-50px gradient-button"
              :loading="registerLoading"
              :disabled="!isStep1Valid"
              @click="handleRegisterStep">
              <span>{{ t("mobileLogin.register.btn.next") }}</span>
            </n-button>
          </n-flex>

          <!-- 注册表单 - 第二步：邮箱和图片验证码 -->
          <n-flex v-if="activeTab === 'register' && currentStep === 2" vertical class="text-center w-80%" :size="16">
            <n-auto-complete
              size="large"
              clearable
              type="text"
              v-model:value="registerInfo.email"
              :placeholder="registerEmailPH"
              :options="commonEmailDomains"
              :get-show="getShow"
              @focus="registerEmailPH = ''"
              @blur="registerEmailPH = t('mobileLogin.register.input.email')" />

            <!-- 邮箱验证码 -->
            <div class="flex justify-between items-center gap-10px">
              <n-input
                size="large"
                maxlength="6"
                type="text"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                clearable
                v-model:value="registerInfo.code"
                :allow-input="noSideSpace"
                :placeholder="registerCodePH"
                @focus="registerCodePH = ''"
                @blur="registerCodePH = t('mobileLogin.register.input.emailVerificationCode')" />

              <n-button
                tertiary
                style="color: #fff"
                class="flex-shrink-0 gradient-button"
                :loading="sendCodeLoading"
                :disabled="sendCodeDisabled"
                @click="handleSendEmailCode">
                <span>{{ sendCodeButtonText }}</span>
              </n-button>
            </div>

            <n-button
              tertiary
              style="color: #fff"
              class="w-full mt-8px mb-50px gradient-button"
              :loading="registerLoading"
              :disabled="!isStep2Valid"
              @click="handleRegisterStep">
              <span>{{ t("mobileLogin.register.btn.register") }}</span>
            </n-button>
          </n-flex>
        </div>
      </template>
    </mobile-scaffold>
  </mobile-layout>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import Validation from "@/components/common/Validation.vue";

import { TauriCommandEnum } from "@/enums";
import { useLogin } from "@/hooks/useLogin";
import type { RegisterUserReq } from "@/api/types";
import { registerApi, getCodeApi } from "@/api/auth";
import { useMobileStore } from "@/stores/mobile";
import { useSettingStore } from "@/stores/setting";
import { isAndroid, isIOS } from "@/utils/PlatformUtils";
import { validateAlphaNumeric, validateSpecialChar, noSideSpace, validateMinLength } from "@/utils/ValidateUtils";

// 本地注册信息类型，扩展API类型以包含确认密码
interface LocalRegisterInfo extends RegisterUserReq {}

const { t } = useI18n();
const router = useRouter();
const mobileStore = useMobileStore();
const safeArea = computed(() => mobileStore.safeArea);
const settingStore = useSettingStore();
const { login } = storeToRefs(settingStore);
const { normalLogin, loading, loginText, loginDisabled, userInfo } = useLogin();

const MOBILE_EMAIL_TIMER_ID = "mobile_register_email_timer";
const timerWorker = new Worker(new URL("@/workers/timer.worker.ts", import.meta.url));

/** 当前激活的选项卡 */
const activeTab = ref<"login" | "register">("login");
/** 当前注册步骤 */
const currentStep = ref(1);
/** 注册账号信息 */
const registerInfo = ref<LocalRegisterInfo>({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  code: ""
});
// 登录相关的占位符和状态
const accountPH = ref(t("mobileLogin.input.accountPlaceholder"));
const passwordPH = ref(t("mobileLogin.input.codePlaceholder"));
const protocol = ref(true);
const arrowStatus = ref(false);
// 注册相关的占位符和状态
const registerNamePH = ref(t("mobileLogin.register.input.nickname"));
const registerEmailPH = ref(t("mobileLogin.register.input.email"));
const registerPasswordPH = ref(t("mobileLogin.register.input.password"));
const confirmPasswordPH = ref(t("mobileLogin.register.input.confirmPassword"));
const registerCodePH = ref(t("mobileLogin.register.input.emailVerificationCode"));
const registerProtocol = ref(true);
const registerLoading = ref(false);
const sendCodeLoading = ref(false);
const sendCodeCountdown = ref(0);

const sendCodeButtonText = computed(() => {
  if (sendCodeCountdown.value > 0) {
    const s = sendCodeCountdown.value;
    return t("mobileLogin.register.btn.resendIn", { seconds: s });
  }
  return t("mobileLogin.register.btn.sendEmailCode");
});
const sendCodeDisabled = computed(() => {
  return sendCodeLoading.value || sendCodeCountdown.value > 0 || !registerInfo.value.email || !isEmailValid.value;
});
// 常用邮箱后缀
const commonEmailDomains = computed(() => {
  return ["@gmail.com", "@163.com", "@qq.com"].map((suffix) => {
    const prefix = registerInfo.value.email.split("@")[0];
    return {
      label: prefix + suffix,
      value: prefix + suffix
    };
  });
});
const agreementStyle = computed(() => {
  const inset = safeArea.value.bottom || 0;
  if (isAndroid()) {
    return { bottom: `${inset + 10}px` };
  }
  if (inset > 0) {
    return { bottom: `${inset}px` };
  }
  return { bottom: "var(--safe-area-inset-bottom)" };
});
// 检查邮箱格式
const isEmailValid = computed(() => {
  const email = registerInfo.value.email.trim();
  if (!email) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
});
/** 检查密码是否满足所有条件 */
const isPasswordValid = computed(() => {
  const password = registerInfo.value.password;
  return validateMinLength(password) && validateAlphaNumeric(password) && validateSpecialChar(password);
});
/** 检查第一步是否可以继续 */
const isStep1Valid = computed(() => {
  return (
    registerInfo.value.username &&
    isPasswordValid.value &&
    registerInfo.value.confirmPassword === registerInfo.value.password &&
    registerProtocol.value
  );
});
/** 检查第二步是否可以继续 */
const isStep2Valid = computed(() => {
  return isEmailValid.value && !!registerInfo.value.code.trim();
});

/** 停止发送验证码倒计时 */
const stopSendCodeCountdown = () => {
  timerWorker.postMessage({
    type: "clearTimer",
    msgId: MOBILE_EMAIL_TIMER_ID
  });
  sendCodeCountdown.value = 0;
};

/** 开始发送验证码倒计时 */
const startSendCodeCountdown = () => {
  sendCodeCountdown.value = 60;
  timerWorker.postMessage({
    type: "startTimer",
    msgId: MOBILE_EMAIL_TIMER_ID,
    duration: 60 * 1000
  });
};

/**
 * 检查输入是否包含@符号
 * @param value 输入字符串
 * @returns 输入是否包含@符号
 */
const getShow = (value: string) => {
  if (value.endsWith("@")) {
    return true;
  }
  return false;
};

/** 重置登录表单 */
const resetLoginForm = () => {
  userInfo.value = {
    account: "",
    password: "",
    avatar: "",
    uid: ""
  };
  accountPH.value = t("mobileLogin.input.accountPlaceholder");
  passwordPH.value = t("mobileLogin.input.codePlaceholder");
  arrowStatus.value = false;
};

/** 重置注册表单 */
const resetRegisterForm = () => {
  registerInfo.value = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    code: ""
  } as LocalRegisterInfo;
  currentStep.value = 1;
  registerNamePH.value = t("mobileLogin.register.input.nickname");
  registerEmailPH.value = t("mobileLogin.register.input.email");
  registerPasswordPH.value = t("mobileLogin.register.input.password");
  confirmPasswordPH.value = t("mobileLogin.register.input.confirmPassword");
  registerCodePH.value = t("mobileLogin.register.input.emailVerificationCode");

  sendCodeLoading.value = false;
  stopSendCodeCountdown();
};

/** 处理注册步骤 */
const handleRegisterStep = async () => {
  if (currentStep.value === 1) {
    // 进入第二步
    currentStep.value = 2;
    return;
  }
  await handleRegisterComplete();
};

/** 发送邮箱验证码 */
const handleSendEmailCode = async () => {
  if (!isEmailValid.value) {
    window.$message.warning(t("mobileLogin.emailInvalid"));
    return;
  }

  if (sendCodeCountdown.value > 0 || sendCodeLoading.value) {
    return;
  }

  sendCodeLoading.value = true;
  try {
    await getCodeApi({
      email: registerInfo.value.email,
      operationType: "REGISTER"
    });
    window.$message.success(t("mobileLogin.codeSentEmail"));
    startSendCodeCountdown();
  } catch (error) {
    console.error(t("mobileLogin.codeSendFailedWithReason", { reason: error }));
    window.$message.error(t("mobileLogin.codeSendFailedRetry"));
  } finally {
    sendCodeLoading.value = false;
  }
};

/** 完成注册 */
const handleRegisterComplete = async () => {
  if (!isStep2Valid.value) {
    window.$message.warning(t("mobileLogin.completeInfoBeforeRegister"));
    return;
  }

  try {
    registerLoading.value = true;
    registerInfo.value.email = registerInfo.value.email.trim();
    registerInfo.value.code = registerInfo.value.code.trim();
    await registerApi(registerInfo.value);
    // 关闭弹窗并切换到登录页面
    activeTab.value = "login";
    userInfo.value.account = registerInfo.value.username || registerInfo.value.email;
    window.$message.success(t("mobileLogin.registerSuccess"));

    // 重置注册表单
    resetRegisterForm();
  } catch (error) {
    // 处理注册失败
    window.$message.error((error as any) || t("mobileLogin.registerFail"));
    console.error(error);
  } finally {
    registerLoading.value = false;
  }
};

/** 忘记密码 */
const handleForgetPassword = () => {
  router.push({
    name: "mobileForgetPassword"
  });
};

/**
 * 关闭账号列表菜单
 * @param event 点击事件
 */
const closeMenu = (event: MouseEvent) => {
  const target = event.target as Element;
  if (!target.matches(".account-box, .account-box *, .down")) {
    arrowStatus.value = false;
  }
};

watch(activeTab, () => {
  stopSendCodeCountdown();
  sendCodeLoading.value = false;
});

// 监听选项卡切换，重置状态
watch(activeTab, (newTab) => {
  if (newTab === "login") {
    // 切换到登录时重置注册状态
    resetRegisterForm();
  } else {
    // 切换到注册时重置登录表单
    resetLoginForm();
  }
});

// 监听登录表单变化
watchEffect(() => {
  loginDisabled.value = !(userInfo.value.account && userInfo.value.password && protocol.value);
  // 清空账号的时候设置默认头像
  if (!userInfo.value.account) {
    userInfo.value.avatar = "/logo.png";
  }
});

timerWorker.onmessage = (e) => {
  const { type, msgId, remainingTime } = e.data;
  if (msgId !== MOBILE_EMAIL_TIMER_ID) return;

  if (type === "debug") {
    sendCodeCountdown.value = Math.max(0, Math.ceil(remainingTime / 1000));
  } else if (type === "timeout") {
    sendCodeCountdown.value = 0;
  }
};

timerWorker.onerror = () => {
  sendCodeCountdown.value = 0;
};

onMounted(async () => {
  window.addEventListener("click", closeMenu, true);
  if (isIOS()) {
    invoke("set_webview_keyboard_adjustment", { enabled: false });
  }

  // 进入登录页面时立即隐藏首屏，确保无论登录成功或失败都能看到登录界面
  await invoke(TauriCommandEnum.HIDE_SPLASH_SCREEN);

  if (login.value.autoLogin) {
    normalLogin("mobile", true);
  }
});

onUnmounted(() => {
  window.removeEventListener("click", closeMenu, true);
  stopSendCodeCountdown();
  timerWorker.terminate();
  if (isIOS()) {
    invoke("set_webview_keyboard_adjustment", { enabled: false });
  }
});
</script>

<style scoped lang="scss">
@use "@/styles/login";
</style>
