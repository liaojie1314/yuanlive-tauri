<template>
  <n-config-provider
    :theme="naiveTheme"
    class="bg-[#d8eee2] dark:bg-[#0f2027] size-full rounded-8px select-none overflow-hidden">
    <!--顶部操作栏-->
    <action-bar :max-w="false" />

    <n-flex vertical class="w-full size-full mt-20px">
      <!-- 标题 -->
      <n-flex justify="center" class="w-full">
        <p class="text-(18px [--text-color]) select-none">{{ t("auth.forget.title") }}</p>
      </n-flex>

      <!-- 步骤条 -->
      <n-steps size="small" class="w-full px-40px mt-20px" :current="currentStep" :status="stepStatus">
        <n-step :title="t('auth.forget.steps.verify.title')" :description="t('auth.forget.steps.verify.desc')" />
        <n-step :title="t('auth.forget.steps.reset.title')" :description="t('auth.forget.steps.reset.desc')" />
        <n-step :title="t('auth.forget.steps.done.title')" :description="t('auth.forget.steps.done.desc')" />
      </n-steps>

      <!-- 第一步：验证邮箱 -->
      <div v-if="currentStep === 1" class="w-full max-w-300px mx-auto mt-80px">
        <n-form ref="formRef" :model="formData" :rules="emailRules">
          <!-- 邮箱输入 -->
          <n-form-item path="email" :label="t('auth.forget.form.emailLabel')">
            <n-input
              :allow-input="noSideSpace"
              class="border-(1px solid #90909080) no-indent-input w-300px!"
              v-model:value="formData.email"
              :placeholder="t('auth.forget.form.emailPlaceholder')"
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              clearable />
          </n-form-item>

          <!-- 邮箱验证码 -->
          <n-form-item path="emailCode" :label="t('auth.forget.form.codeLabel')">
            <n-flex :size="8">
              <div class="flex gap-1 max-w-300px">
                <n-input
                  :allow-input="noSideSpace"
                  class="border-(1px solid #90909080) no-indent-input max-w-200px"
                  v-model:value="formData.emailCode"
                  :placeholder="t('auth.forget.form.codePlaceholder')"
                  spellCheck="false"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  maxlength="6" />
                <n-button
                  color="#13987f"
                  ghost
                  :disabled="sendBtnDisabled"
                  :loading="sendingEmailCode"
                  @click="sendEmailCode"
                  class="min-w-80px w-fit h-34px">
                  {{ emailCodeBtnText }}
                </n-button>
              </div>
            </n-flex>
          </n-form-item>

          <n-button
            :loading="verifyLoading"
            :disabled="nextDisabled"
            tertiary
            style="color: #fff"
            @click="verifyEmail"
            class="mt-10px w-full gradient-button">
            {{ t("auth.forget.buttons.next") }}
          </n-button>
        </n-form>
      </div>

      <!-- 第二步：设置新密码 -->
      <div v-if="currentStep === 2" class="w-full max-w-300px mx-auto mt-30px">
        <n-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules">
          <!-- 新密码 -->
          <n-form-item path="password" :label="t('auth.forget.form.passwordLabel')">
            <n-flex vertical :size="8" class="w-full">
              <n-input
                :allow-input="noSideSpace"
                class="border-(1px solid #90909080) w-full no-indent-input"
                v-model:value="passwordForm.password"
                type="password"
                show-password-on="click"
                :placeholder="t('auth.forget.form.passwordPlaceholder')"
                maxlength="16"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                minlength="6" />
              <n-flex vertical :size="4" class="space-y-4px">
                <Validation
                  :value="passwordForm.password"
                  :message="t('auth.forget.passwordHints.length')"
                  :validator="validateMinLength" />
                <Validation
                  :value="passwordForm.password"
                  :message="t('auth.forget.passwordHints.alphaNumeric')"
                  :validator="validateAlphaNumeric" />
                <Validation
                  :value="passwordForm.password"
                  :message="t('auth.forget.passwordHints.specialChar')"
                  :validator="validateSpecialChar" />
              </n-flex>
            </n-flex>
          </n-form-item>

          <!-- 确认密码 -->
          <n-form-item path="confirmPassword" :label="t('auth.forget.form.confirmLabel')">
            <n-flex vertical :size="8" class="w-full">
              <n-input
                :allow-input="noSideSpace"
                class="border-(1px solid #90909080) w-full no-indent-input"
                v-model:value="passwordForm.confirmPassword"
                type="password"
                show-password-on="click"
                :placeholder="t('auth.forget.form.confirmPlaceholder')"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                maxlength="16"
                minlength="6" />
              <n-flex vertical :size="4">
                <Validation
                  :value="passwordForm.confirmPassword"
                  :message="t('auth.forget.passwordHints.confirmMatch')"
                  :validator="(value: string) => value === passwordForm.password && value !== ''" />
              </n-flex>
            </n-flex>
          </n-form-item>

          <n-flex :size="16" class="mt-30px">
            <n-button @click="goBack" class="flex-1">{{ t("auth.forget.buttons.prev") }}</n-button>
            <n-button
              :loading="submitLoading"
              tertiary
              style="color: #fff"
              @click="submitNewPassword"
              class="flex-1 gradient-button">
              {{ t("auth.forget.buttons.submit") }}
            </n-button>
          </n-flex>
        </n-form>
      </div>

      <!-- 第三步：完成 -->
      <div v-if="currentStep === 3" class="w-full max-w-300px mx-auto mt-100px text-center">
        <img class="size-98px" src="/party-popper.webp" alt="" />
        <div class="mt-16px text-18px">{{ t("auth.forget.success.title") }}</div>
        <div class="mt-16px text-14px text-#666">{{ t("auth.forget.success.desc") }}</div>
      </div>
    </n-flex>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { darkTheme, FormInst, lightTheme } from "naive-ui";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import { ThemeEnum } from "@/enums";
import { forgetPasswordApi, sendEmailCaptchaApi } from "@/api/auth";
import { noSideSpace, validateAlphaNumeric, validateMinLength, validateSpecialChar } from "@/utils/ValidateUtils";
import { useSettingStore } from "@/stores/setting";

const { t } = useI18n();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);
const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));
// 验证码计时器的唯一ID
const EMAIL_TIMER_ID = "email_verification_timer";
// 倒计时定时器 Worker
const timerWorker = new Worker(new URL("@/workers/timer.worker.ts", import.meta.url));

// 步骤状态
const currentStep = ref(1);
const stepStatus = ref<"error" | "finish" | "process" | "wait" | undefined>("process");

// 第一步表单数据
const formRef = ref<FormInst | null>(null);
const formData = ref({
  email: "",
  emailCode: ""
});

const sendBtnDisabled = ref(false);
const emailCodeBtnText = ref(t("auth.forget.actions.sendCode"));
const countDown = ref(60);
const verifyLoading = ref(false);
// 发送验证码loading状态
const sendingEmailCode = ref(false);

// 邮箱校验规则
const emailRules = {
  email: [
    { required: true, message: t("auth.forget.rules.emailRequired"), trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
      message: t("auth.forget.rules.emailFormat"),
      trigger: "blur"
    }
  ],
  emailCode: [
    { required: true, message: t("auth.forget.rules.codeRequired"), trigger: "input" },
    { min: 6, max: 6, message: t("auth.forget.rules.codeLength"), trigger: "blur" }
  ]
};

// 第二步密码表单
const passwordFormRef = ref<FormInst | null>(null);
const passwordForm = ref({
  password: "",
  confirmPassword: ""
});
const submitLoading = ref(false);

// 密码校验规则
const passwordRules = {
  password: [
    { required: true, message: t("auth.forget.rules.passwordRequired"), trigger: "blur" },
    { min: 6, max: 16, message: t("auth.forget.rules.passwordLength"), trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: t("auth.forget.rules.confirmRequired"), trigger: "blur" },
    {
      validator: (_: any, value: string) => {
        return value === passwordForm.value.password;
      },
      message: t("auth.forget.rules.confirmMismatch"),
      trigger: "blur"
    }
  ]
};

// 下一步按钮禁用状态
const nextDisabled = computed(() => {
  return !(formData.value.email && formData.value.emailCode);
});

/**
 * 上一步
 */
const goBack = () => {
  currentStep.value = 1;
};

/**
 * 发送邮箱验证码
 */
const sendEmailCode = async () => {
  // 邮箱校验
  if (!formData.value.email) {
    window.$message.warning(t("auth.forget.messages.enterEmail"));
    return;
  }

  if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(formData.value.email)) {
    window.$message.warning(t("auth.forget.messages.emailFormat"));
    return;
  }

  // 设置loading状态
  sendingEmailCode.value = true;

  try {
    await sendEmailCaptchaApi({
      email: formData.value.email,
      operationType: "FORGET_PASSWORD"
    });
    window.$message.success(t("auth.forget.messages.codeSent"));
    // 接口成功返回后才开始倒计时
    sendBtnDisabled.value = true;
    countDown.value = 60;
    emailCodeBtnText.value = t("auth.forget.actions.retryIn", { seconds: countDown.value });
    // 开启Worker日志功能，确保debug消息能发送
    // 关闭来减少性能开销
    // timerWorker.postMessage({
    //   type: "setLogging",
    //   logging: true
    // });
    // 发送消息给 Worker 开始计时
    timerWorker.postMessage({
      type: "startTimer",
      msgId: EMAIL_TIMER_ID,
      duration: 60 * 1000 // 60秒，单位毫秒
    });
  } catch (error) {
    console.error("发送邮箱验证码失败: ", error);
  } finally {
    // 重置loading状态
    sendingEmailCode.value = false;
  }
};

/**
 * 验证邮箱
 */
const verifyEmail = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value?.validate?.();
    verifyLoading.value = true;
    setTimeout(() => {
      currentStep.value = 2;
      verifyLoading.value = false;
    }, 500);
  } catch (error) {
    console.error("表单验证失败: ", error);
  }
};

/**
 * 提交新密码
 */
const submitNewPassword = async () => {
  if (!passwordFormRef.value) return;

  try {
    await passwordFormRef.value?.validate?.();
    submitLoading.value = true;

    // 调用忘记密码接口
    await forgetPasswordApi({
      email: formData.value.email,
      code: formData.value.emailCode,
      password: passwordForm.value.password,
      confirmPassword: passwordForm.value.confirmPassword
    });

    currentStep.value = 3;
    stepStatus.value = "finish";
    submitLoading.value = false;
  } catch (error) {
    console.error("重置密码失败", error);
    submitLoading.value = false;
  }
};

// 监听 Worker 消息
timerWorker.onmessage = (e) => {
  const { type, msgId, remainingTime } = e.data;
  if (msgId !== EMAIL_TIMER_ID) return;
  // 邮箱验证码计时器消息处理
  if (type === "debug") {
    // 更新倒计时显示
    const secondsRemaining = Math.ceil(remainingTime / 1000);
    countDown.value = secondsRemaining;
    emailCodeBtnText.value = t("auth.forget.actions.retryIn", { seconds: secondsRemaining });
  } else if (type === "timeout") {
    // 计时结束
    sendBtnDisabled.value = false;
    emailCodeBtnText.value = t("auth.forget.actions.resend");
  }
};

// Worker 错误处理
timerWorker.onerror = () => {
  // 发生错误时恢复按钮状态
  sendBtnDisabled.value = false;
  emailCodeBtnText.value = t("auth.forget.actions.resend");
  countDown.value = 0;
};

onMounted(async () => {
  await getCurrentWebviewWindow().show();
});

onUnmounted(() => {
  // 清除Web Worker计时器
  timerWorker.postMessage({
    type: "clearTimer",
    msgId: EMAIL_TIMER_ID
  });
  // 终止Worker
  timerWorker.terminate();
  countDown.value = 0;
});
</script>

<style scoped lang="scss">
@use "@/styles/login";

:deep(.no-indent-input.n-input .n-input__input),
:deep(.no-indent-input.n-input .n-input__textarea) {
  margin-left: 0 !important;
}
</style>
