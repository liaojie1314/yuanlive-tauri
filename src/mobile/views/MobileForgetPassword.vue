<template>
  <mobile-layout class="overflow-hidden">
    <mobile-header-bar
      :hidden-right="true"
      :enable-default-background="false"
      :enable-shadow="false"
      :name="t('mobileForgetCode.title')" />
    <n-flex vertical class="size-full">
      <!-- 步骤条 -->
      <n-steps size="small" class="w-full px-40px mt-20px" :current="currentStep" :status="stepStatus">
        <n-step description="" :title="t('mobileForgetCode.steps.verifyEmail')" />
        <n-step description="" :title="t('mobileForgetCode.steps.setNewPassword')" />
        <n-step description="" :title="t('mobileForgetCode.steps.done')" />
      </n-steps>

      <!-- 第一步：验证邮箱 -->
      <div v-if="currentStep === 1" class="w-full max-w-300px mx-auto mt-80px">
        <n-form ref="formRef" :model="formData" :rules="emailRules">
          <!-- 邮箱输入 -->
          <n-form-item path="email" :label="t('mobileForgetCode.input.label.email')">
            <n-input
              spellCheck="false"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              clearable
              class="border-(1px solid #90909080)"
              v-model:value="formData.email"
              :allow-input="noSideSpace"
              :placeholder="t('mobileForgetCode.input.email')" />
          </n-form-item>

          <!-- 邮箱验证码 -->
          <n-form-item path="emailCode" :label="t('mobileForgetCode.input.label.emailVerificationCode')">
            <n-flex :size="8">
              <div class="max-w-300px flex gap-1">
                <n-input
                  spellCheck="false"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  maxlength="6"
                  class="border-(1px solid #90909080)"
                  v-model:value="formData.emailCode"
                  :allow-input="noSideSpace"
                  :placeholder="t('mobileForgetCode.input.emailCode')" />
                <n-button
                  color="#13987f"
                  ghost
                  class="min-w-100px w-fit h-34px"
                  :disabled="sendBtnDisabled"
                  :loading="sendingEmailCode"
                  @click="sendEmailCode">
                  {{ emailCodeBtnText }}
                </n-button>
              </div>
            </n-flex>
          </n-form-item>

          <n-button
            tertiary
            style="color: #fff"
            class="mt-10px w-full gradient-button"
            :loading="verifyLoading"
            :disabled="nextDisabled"
            @click="verifyEmail">
            {{ t("mobileForgetCode.button.next") }}
          </n-button>
        </n-form>
      </div>

      <!-- 第二步：设置新密码 -->
      <div v-if="currentStep === 2" class="w-full max-w-300px mx-auto mt-30px">
        <n-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules">
          <!-- 新密码 -->
          <n-form-item path="password" :label="t('mobileForgetCode.input.label.newPassword')">
            <n-flex vertical class="w-full" :size="8">
              <n-input
                type="password"
                show-password-on="click"
                maxlength="16"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                minlength="6"
                class="border-(1px solid #90909080) w-full"
                v-model:value="passwordForm.password"
                :allow-input="noSideSpace"
                :placeholder="t('mobileForgetCode.input.newPassword', { len: '6-16' })" />
              <n-flex vertical class="space-y-4px" :size="4">
                <validation
                  :value="passwordForm.password"
                  :message="t('mobileForgetCode.validation.minLength', { len: '6-16' })"
                  :validator="validateMinLength" />
                <validation
                  :value="passwordForm.password"
                  :message="t('mobileForgetCode.validation.validCharacters')"
                  :validator="validateAlphaNumeric" />
                <validation
                  :value="passwordForm.password"
                  :message="t('mobileForgetCode.validation.mustSpecialChar')"
                  :validator="validateSpecialChar" />
              </n-flex>
            </n-flex>
          </n-form-item>

          <!-- 确认密码 -->
          <n-form-item path="confirmPassword" :label="t('mobileForgetCode.input.label.confirmPassword')">
            <n-flex vertical class="w-full" :size="8">
              <n-input
                type="password"
                show-password-on="click"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                maxlength="16"
                minlength="6"
                class="border-(1px solid #90909080) w-full"
                v-model:value="passwordForm.confirmPassword"
                :allow-input="noSideSpace"
                :placeholder="t('mobileForgetCode.input.confirmPassword')" />
              <n-flex vertical :size="4">
                <validation
                  :value="passwordForm.confirmPassword"
                  :message="t('mobileForgetCode.validation.passwordsMatch')"
                  :validator="(value: string) => value === passwordForm.password && value !== ''" />
              </n-flex>
            </n-flex>
          </n-form-item>

          <n-flex class="mt-30px" :size="16">
            <n-button class="flex-1" @click="goBack">{{ t("mobileForgetCode.button.goBackStep") }}</n-button>
            <n-button
              tertiary
              style="color: #fff"
              class="flex-1 gradient-button"
              :loading="submitLoading"
              @click="submitNewPassword">
              {{ t("mobileForgetCode.button.submit") }}
            </n-button>
          </n-flex>
        </n-form>
      </div>

      <!-- 第三步：完成 -->
      <div v-if="currentStep === 3" class="w-full max-w-300px mx-auto mt-100px text-center">
        <img src="/party-popper.webp" alt="" class="size-98px" />
        <div class="mt-16px text-18px">{{ t("mobileForgetCode.passwordResetSuccess") }}</div>
        <div class="mt-16px text-14px text-#666">{{ t("mobileForgetCode.passwordResetSuccessDesc") }}</div>
      </div>
    </n-flex>
  </mobile-layout>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { forgetPasswordApi, getCodeApi } from "@/api/auth";
import { validateAlphaNumeric, validateSpecialChar, noSideSpace, validateMinLength } from "@/utils/ValidateUtils";

const { t } = useI18n();
const router = useRouter();

// 验证码计时器的唯一ID
const EMAIL_TIMER_ID = "email_verification_timer";
// 邮箱校验规则
const emailRules = {
  email: [
    { required: true, message: t("mobileForgetCode.rules.emailRequire"), trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
      message: t("mobileForgetCode.rules.emailInvalid"),
      trigger: "blur"
    }
  ],
  emailCode: [
    { required: true, message: t("mobileForgetCode.rules.emailCodeRequire"), trigger: "input" },
    { min: 6, max: 6, message: t("mobileForgetCode.rules.codeLength", { len: 6 }), trigger: "blur" }
  ]
};
// 密码校验规则
const passwordRules = {
  password: [
    { required: true, message: t("mobileForgetCode.rules.newPasswordRequire"), trigger: "blur" },
    { min: 6, max: 16, message: t("mobileForgetCode.rules.newPasswordLength", { len: "6-16" }), trigger: "blur" }
  ],
  confirmPassword: [
    { required: true, message: t("mobileForgetCode.rules.confirmPasswordRequire"), trigger: "blur" },
    {
      validator: (_: any, value: string) => {
        return value === passwordForm.value.password;
      },
      message: t("mobileForgetCode.validation.passwordsMatch"),
      trigger: "blur"
    }
  ]
};
// 导入Web Worker
const timerWorker = new Worker(new URL("@/workers/timer.worker.ts", import.meta.url));

// 步骤状态
const currentStep = ref(1);
const stepStatus = ref<"error" | "finish" | "process" | "wait" | undefined>("process");
// 第一步表单数据
const formRef = ref(null);
const formData = ref({
  email: "",
  emailCode: "",
  uuid: "" // 图片验证码uuid
});
const sendBtnDisabled = ref(false);
const emailCodeBtnText = ref(t("mobileForgetCode.button.sendEmailCode"));
const countDown = ref(60);
const verifyLoading = ref(false);
// 发送验证码loading状态
const sendingEmailCode = ref(false);
// 第二步密码表单
const passwordFormRef = ref(null);
const passwordForm = ref({
  password: "",
  confirmPassword: ""
});
const submitLoading = ref(false);

// 下一步按钮禁用状态
const nextDisabled = computed(() => {
  return !(formData.value.email && formData.value.emailCode);
});

/** 发送邮箱验证码 */
const sendEmailCode = async () => {
  // 邮箱校验
  if (!formData.value.email) {
    window.$message.warning(t("mobileForgetCode.rules.emailRequire"));
    return;
  }
  if (!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(formData.value.email)) {
    window.$message.warning(t("mobileForgetCode.rules.emailInvalid"));
    return;
  }

  // 设置loading状态
  sendingEmailCode.value = true;

  try {
    await getCodeApi({
      email: formData.value.email,
      operationType: "FORGET"
    });

    window.$message.success(t("mobileForgetCode.codeSentEmail"));

    // 接口成功返回后才开始倒计时 - 使用 Web Worker
    sendBtnDisabled.value = true;
    countDown.value = 60;
    emailCodeBtnText.value = t("mobileForgetCode.emailResendIn", { seconds: countDown.value });

    // 发送消息给 Worker 开始计时
    timerWorker.postMessage({
      type: "startTimer",
      msgId: EMAIL_TIMER_ID,
      duration: 60 * 1000 // 60秒，单位毫秒
    });
  } catch (error) {
    console.error("发送验证码失败", error);
  } finally {
    // 无论成功或失败，都需要关闭loading状态
    sendingEmailCode.value = false;
  }
};

/** 验证邮箱 */
const verifyEmail = async () => {
  if (!formRef.value) return;

  try {
    await (formRef.value as any).validate();
    verifyLoading.value = true;

    // 这里只是验证表单，实际上不需要调用后端接口，直接进入下一步
    setTimeout(() => {
      currentStep.value = 2;
      verifyLoading.value = false;
    }, 500);
  } catch (error) {
    console.error("表单验证失败", error);
  }
};

/** 返回上一步 */
const goBack = () => {
  currentStep.value = 1;
};

/** 提交新密码 */
const submitNewPassword = async () => {
  if (!passwordFormRef.value) return;

  try {
    await (passwordFormRef.value as any).validate();
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

    setTimeout(() => {
      router.push("/mobile/login");
    }, 2000);
  } catch (error) {
    console.error("重置密码失败", error);
    submitLoading.value = false;
  }
};

// 监听 Worker 消息
timerWorker.onmessage = (e) => {
  const { type, msgId, remainingTime } = e.data;

  if (msgId === EMAIL_TIMER_ID) {
    // 邮箱验证码计时器消息处理
    if (type === "debug") {
      // 更新倒计时显示
      const secondsRemaining = Math.ceil(remainingTime / 1000);
      countDown.value = secondsRemaining;
      emailCodeBtnText.value = t("mobileForgetCode.emailResendIn", { seconds: secondsRemaining });
    } else if (type === "timeout") {
      // 计时结束
      sendBtnDisabled.value = false;
      emailCodeBtnText.value = t("mobileForgetCode.button.sendEmailCode");
    }
  }
};

// Worker 错误处理
timerWorker.onerror = (error) => {
  console.error("[Timer Worker Error]", error);
  // 发生错误时恢复按钮状态
  sendBtnDisabled.value = false;
  emailCodeBtnText.value = t("mobileForgetCode.button.sendEmailCode");
};

// 组件销毁时清除定时器
onBeforeUnmount(() => {
  // 清除Web Worker计时器
  timerWorker.postMessage({
    type: "clearTimer",
    msgId: EMAIL_TIMER_ID
  });
  timerWorker.terminate();
});
</script>

<style scoped lang="scss">
@use "@/styles/login";
</style>
