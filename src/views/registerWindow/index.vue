<template>
  <n-config-provider
    data-tauri-drag-region
    class="login-box rounded-8px flex size-full flex-col select-none"
    :theme="naiveTheme">
    <!--顶部操作栏-->
    <action-bar :max-w="false" />

    <n-flex vertical justify="center" class="mt--40px pointer-events-none w-full flex-1" :size="25">
      <!-- 注册菜单 -->
      <n-flex vertical class="ma w-260px pointer-events-auto text-center" :size="16">
        <n-flex justify="center" align="center">
          <span class="text-(24px #70938c) textFont">{{ t("auth.register.title") }}</span>
          <img src="/logo.webp" alt="" class="w-40px h-40px" />
        </n-flex>
        <n-form ref="registerForm" :model="info" :rules="rules">
          <!-- 注册信息 -->
          <div>
            <n-form-item path="name">
              <n-input
                maxlength="8"
                minlength="1"
                size="large"
                type="text"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                clearable
                v-model:value="info.username"
                :class="[{ 'pr-20px': info.username }, { 'pr-16px': showNamePrefix && !info.username }]"
                :allow-input="noSideSpace"
                :placeholder="showNamePrefix ? '' : t('auth.register.placeholders.nickname')"
                @focus="handleInputState($event, 'nickName')"
                @blur="handleInputState($event, 'nickName')" />
            </n-form-item>

            <n-form-item path="password">
              <n-input
                maxlength="16"
                minlength="6"
                size="large"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                show-password-on="click"
                type="password"
                clearable
                v-model:value="info.password"
                :class="{ 'pl-16px': !showPasswordPrefix && !info.password }"
                :allow-input="noSideSpace"
                :placeholder="showPasswordPrefix ? '' : t('auth.register.placeholders.password')"
                @focus="handleInputState($event, 'password')"
                @blur="handleInputState($event, 'password')" />
            </n-form-item>

            <n-form-item path="confirmPassword">
              <n-input
                maxlength="16"
                minlength="6"
                size="large"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                show-password-on="click"
                type="password"
                clearable
                v-model:value="confirmPassword"
                :class="{ 'pl-16px': !showConfirmPasswordPrefix && !confirmPassword }"
                :allow-input="noSideSpace"
                :placeholder="showConfirmPasswordPrefix ? '' : t('auth.register.placeholders.confirmPassword')"
                @focus="handleInputState($event, 'confirmPassword')"
                @blur="handleInputState($event, 'confirmPassword')" />
            </n-form-item>

            <n-form-item path="email">
              <n-auto-complete
                size="large"
                clearable
                type="text"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                v-model:value="info.email"
                :placeholder="showEmailPrefix ? '' : t('auth.register.placeholders.email')"
                :options="commonEmailDomains"
                :get-show="getShow"
                :append="true"
                @focus="handleInputState($event, 'email')"
                @blur="handleInputState($event, 'email')" />
            </n-form-item>

            <!-- 密码提示信息 -->
            <n-flex vertical v-if="info.password">
              <n-flex vertical :size="4">
                <validation
                  :value="info.password"
                  :message="t('auth.register.passwordHints.minLength')"
                  :validator="validateMinLength" />
                <validation
                  :value="info.password"
                  :message="t('auth.register.passwordHints.alphaNumeric')"
                  :validator="validateAlphaNumeric" />
                <validation
                  :value="info.password"
                  :message="t('auth.register.passwordHints.specialChar')"
                  :validator="validateSpecialChar" />
              </n-flex>
            </n-flex>

            <!-- 协议 -->
            <n-flex align="center" justify="center" class="mt-10px" :size="6">
              <n-checkbox v-model:checked="protocol" />
              <div class="text-12px color-#909090 lh-14px cursor-default">
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
          </div>
        </n-form>

        <n-button
          tertiary
          style="color: #fff"
          class="mt-8px gradient-button w-full"
          :loading="loading"
          :disabled="btnDisabled"
          @click="handleStepAction">
          {{ btnText }}
        </n-button>
        <p v-if="sendCodeCountDown > 0" class="text-(12px #13987f) ml--8px mt-6px whitespace-nowrap">
          {{ t("auth.register.tips.reopenCode") }}
        </p>
      </n-flex>
    </n-flex>

    <!-- 底部栏 -->
    <n-flex
      justify="center"
      class="text-(12px #909090) bottom-20px absolute left-1/2 w-full -translate-x-1/2 transform"
      :size="8">
      <span>Copyright {{ currentYear - 1 }}-{{ currentYear }} YuanLive All Rights Reserved.</span>
    </n-flex>

    <!-- 邮箱验证码输入弹窗 -->
    <n-modal transform-origin="center" class="rounded-8px" v-model:show="emailCodeModal" :mask-closable="false">
      <div class="bg-#f0f0f0 w-380px box-border flex h-fit flex-col">
        <svg class="w-12px h-12px ml-a mr-4px mt-4px cursor-pointer select-none" @click="emailCodeModal = false">
          <use href="#close"></use>
        </svg>
        <n-flex vertical class="h-fit w-full">
          <n-flex vertical class="p-24px" :size="10">
            <p class="text-(16px #303030) mb-10px">{{ t("auth.register.emailModal.title") }}</p>
            <p class="text-(12px #808080) mb-10px leading-5">
              {{ t("auth.register.emailModal.desc", { email: info.email }) }}
            </p>

            <!-- PIN 输入框 -->
            <div class="mb-20px">
              <pin-input ref="pinInputRef" v-model="emailCode" @complete="register" />
            </div>

            <n-button
              tertiary
              style="color: #fff"
              class="gradient-button w-full"
              :loading="registerLoading"
              :disabled="!isEmailCodeComplete"
              @click="register">
              {{ t("auth.register.actions.submit") }}
            </n-button>
          </n-flex>
        </n-flex>
      </div>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { useI18n } from "vue-i18n";
import { darkTheme, type FormInst, lightTheme } from "naive-ui";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { ThemeEnum } from "@/enums";
import type { RegisterUserReq } from "@/api/types";
import { registerApi, getCodeApi } from "@/api/auth";
import { useSettingStore } from "@/stores/setting";
import { noSideSpace, validateAlphaNumeric, validateMinLength, validateSpecialChar } from "@/utils/ValidateUtils";

const { t } = useI18n();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);

// 输入框类型定义
type InputType = "nickName" | "email" | "password" | "confirmPassword";

// 验证码倒计时消息ID
const EMAIL_TIMER_ID = "register_window_email_timer";
// 使用day.js获取当前年份
const currentYear = dayjs().year();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 校验规则
const rules = {
  nickName: {
    required: true,
    message: t("auth.register.form.rules.nicknameRequired"),
    trigger: "blur"
  },
  email: {
    required: true,
    trigger: ["blur", "input"],
    validator(_: unknown, value: string) {
      const email = (value || "").trim();
      if (!email) {
        return new Error(t("auth.register.form.rules.emailRequired"));
      }
      if (!emailPattern.test(email)) {
        return new Error(t("auth.register.form.rules.emailInvalid"));
      }
      return true;
    }
  },
  password: {
    required: true,
    message: t("auth.register.form.rules.passwordRequired"),
    trigger: ["blur", "input"]
  },
  confirmPassword: {
    required: true,
    message: t("auth.register.form.rules.confirmMismatch"),
    trigger: "blur",
    validator() {
      if (confirmPassword.value !== info.password) {
        return false;
      }
      return true;
    }
  }
};
// 倒计时定时器 Worker
const timerWorker = new Worker(new URL("@/workers/timer.worker.ts", import.meta.url));

// 注册信息
const info = unref(
  ref<RegisterUserReq>({
    email: "",
    password: "",
    username: "",
    code: "",
    confirmPassword: ""
  })
);

// 确认密码
const confirmPassword = ref("");
// 协议
const protocol = ref(true);
const btnDisabled = ref(false);
const loading = ref(false);
const registerLoading = ref(false);
// 前缀显示状态
const showNamePrefix = ref(false);
const showEmailPrefix = ref(false);
const showPasswordPrefix = ref(false);
const showConfirmPasswordPrefix = ref(false);
// 发送验证码冷却时间(秒)
const sendCodeCountDown = ref(0);
const registerForm = ref<FormInst | null>(null);
const emailCodeModal = ref(false);
// 邮箱验证码PIN输入
const emailCode = ref("");
const pinInputRef = ref();

const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));
// 常用邮箱后缀
const commonEmailDomains = computed(() => {
  return ["gmail.com", "163.com", "qq.com"].map((suffix) => {
    return {
      label: suffix,
      value: suffix
    };
  });
});

// 发送验证码按钮文本
const btnText = computed(() => {
  if (loading.value) {
    return t("auth.register.actions.sending");
  }
  if (sendCodeCountDown.value > 0) {
    return t("auth.register.actions.retryIn", { seconds: sendCodeCountDown.value });
  }
  return t("auth.register.actions.sendCode");
});
const isEmailCodeComplete = computed(() => emailCode.value.length === 6);
const isEmailValid = computed(() => emailPattern.test(info.email.trim()));

// 检查密码是否满足所有条件
const isPasswordValid = computed(() => {
  const password = info.password;
  return validateMinLength(password) && validateAlphaNumeric(password) && validateSpecialChar(password);
});

// 检查是否可以发送邮箱验证码
const canSendCode = computed(() => {
  return (
    !!info.username &&
    isPasswordValid.value &&
    confirmPassword.value === info.password &&
    protocol.value &&
    isEmailValid.value
  );
});

/**
 * 检查邮箱是否以 "@" 结尾
 * @param value 邮箱值
 * @returns 是否以 "@" 结尾
 */
const getShow = (value: string) => value.endsWith("@");

/**
 * 处理输入框状态变化
 * @param type 输入框类型：name-昵称 / email-邮箱 / password-密码 / confirmPassword-确认密码
 * @param event 事件对象
 */
const handleInputState = (event: FocusEvent, type: InputType): void => {
  const prefixMap: Record<InputType, Ref<boolean>> = {
    nickName: showNamePrefix,
    email: showEmailPrefix,
    password: showPasswordPrefix,
    confirmPassword: showConfirmPasswordPrefix
  };
  prefixMap[type].value = event.type === "focus";
};

/** 处理注册步骤操作 */
const handleStepAction = async () => {
  if (btnDisabled.value || loading.value) return;

  try {
    await registerForm.value?.validate?.();
  } catch (error) {
    console.error("表单验证失败: ", error);
    return;
  }

  if (sendCodeCountDown.value > 0) {
    emailCodeModal.value = true;
    await nextTick(() => {
      pinInputRef.value?.focus();
    });
    return;
  }

  loading.value = true;
  try {
    const email = info.email.trim();
    info.email = email;
    // 发送邮箱验证码
    await getCodeApi({ email, operationType: "REGISTER" });
    startSendCodeCountdown();
    window.$message.success(t("auth.register.messages.codeSent"));
    emailCodeModal.value = true;
    emailCode.value = "";
    await nextTick(() => {
      pinInputRef.value?.focus();
    });
  } catch (error) {
    console.error("发送邮箱验证码失败: ", error);
  } finally {
    loading.value = false;
  }
};

/** 启动发送邮箱验证码倒计时 */
const startSendCodeCountdown = () => {
  sendCodeCountDown.value = 60;
  timerWorker.postMessage({
    type: "startTimer",
    msgId: EMAIL_TIMER_ID,
    duration: 60 * 1000
  });
};

/** 处理注册操作 */
const register = async () => {
  registerLoading.value = true;
  info.code = emailCode.value;
  info.email = info.email.trim();
  info.confirmPassword = confirmPassword.value;

  try {
    // 注册
    await registerApi({ ...info });
    window.$message.success(t("auth.register.messages.registerSuccess"));
    // 关闭弹窗并跳转到登录页
    emailCodeModal.value = false;
    setTimeout(() => {
      WebviewWindow.getByLabel("login").then((win) => win?.setFocus());
      WebviewWindow.getCurrent().close();
    }, 1200);
  } catch (error) {
    window.$message.error(t("auth.register.messages.registerFail"));
  } finally {
    registerLoading.value = false;
  }
};

watchEffect(() => {
  btnDisabled.value = loading.value || !canSendCode.value;
});

timerWorker.onmessage = (e) => {
  const { type, msgId, remainingTime } = e.data;
  if (msgId !== EMAIL_TIMER_ID) return;

  if (type === "debug") {
    sendCodeCountDown.value = Math.max(0, Math.ceil(remainingTime / 1000));
  } else if (type === "timeout") {
    sendCodeCountDown.value = 0;
  }
};

timerWorker.onerror = () => {
  sendCodeCountDown.value = 0;
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
});

onUnmounted(() => {
  timerWorker.postMessage({
    type: "clearTimer",
    msgId: EMAIL_TIMER_ID
  });
  timerWorker.terminate();
  sendCodeCountDown.value = 0;
});
</script>

<style scoped lang="scss">
@use "@/styles/global/login-bg";
@use "@/styles/login";

:deep(.n-form-item.n-form-item--top-labelled) {
  grid-template-rows: none;
}
</style>
