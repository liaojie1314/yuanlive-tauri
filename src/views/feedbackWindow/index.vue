<template>
  <n-config-provider :theme="naiveTheme">
    <main class="flex h-screen w-full flex-col overflow-hidden bg-[--right-bg-color] select-none">
      <action-bar class="shrink-0" :max-w="false" />
      <n-scrollbar content-class="p-6" class="flex-1">
        <n-flex vertical :size="24">
          <div
            class="text-(13px #666) rounded-lg border border-blue-100 bg-blue-50 p-3 leading-relaxed dark:border-blue-800 dark:bg-blue-900/20">
            {{ t("feedback.intro") }}
          </div>
          <n-form
            ref="formRef"
            label-placement="top"
            require-mark-placement="right-hanging"
            :model="formModel"
            :rules="rules">
            <n-form-item path="type" :label="t('feedback.type.title')">
              <n-radio-group name="feedbackType" class="w-full" v-model:value="formModel.type">
                <n-grid :cols="4" :x-gap="10">
                  <n-grid-item v-for="item in ['bug', 'lag', 'suggestion', 'other']" :key="item">
                    <div
                      class="text-12px cursor-pointer rounded-md bg-[var(--bg-setting-item)] py-2 text-center transition-all duration-200 select-none"
                      :class="[
                        formModel.type === item
                          ? 'font-medium text-emerald-600 shadow-sm'
                          : 'text-gray-500 hover:border-gray-300'
                      ]"
                      @click="formModel.type = item">
                      {{
                        {
                          bug: t("feedback.type.bug"),
                          lag: t("feedback.type.lag"),
                          suggestion: t("feedback.type.suggestion"),
                          other: t("feedback.type.other")
                        }[item]
                      }}
                    </div>
                  </n-grid-item>
                </n-grid>
              </n-radio-group>
            </n-form-item>
            <n-form-item path="content" :label="t('feedback.content')">
              <n-input
                type="textarea"
                maxlength="500"
                show-count
                class="border-(1px solid #90909080) w-full"
                v-model:value="formModel.content"
                :placeholder="t('feedback.placeholder')"
                :autosize="{ minRows: 4, maxRows: 6 }" />
            </n-form-item>
            <n-form-item path="images" :label="t('feedback.images', { count: imageCounts })">
              <n-upload
                list-type="image-card"
                accept=".jpg,.png,.jpeg,.log"
                v-model:file-list="fileList"
                :max="imageCounts"
                :custom-request="customUpload"
                @before-upload="beforeUpload" />
            </n-form-item>
            <n-form-item path="contact" :label="t('feedback.contact')">
              <n-input
                class="border-(1px solid #90909080)"
                v-model:value="formModel.contact"
                :placeholder="t('feedback.contactPlaceholder')" />
            </n-form-item>
          </n-form>
          <n-collapse arrow-placement="right" style="border: 1px solid var(--disabled-color)" class="rounded-md">
            <n-collapse-item name="1" class="p-1">
              <template #header>
                <span class="text-13px font-medium">{{ t("feedback.deviceInfo") }}</span>
              </template>
              <template #header-extra>
                <span class="text-(12px #999) mr-2">{{ t("feedback.deviceInfoDesc") }}</span>
              </template>
              <div class="grid gap-2 px-4 pb-4 font-mono leading-tight">
                <div class="flex justify-between border-b pb-1">
                  <span class="text-[var(--text-color)]">App Version</span>
                  <span class="text-[var(--left-text-color)]">{{ deviceInfo.appVersion }}</span>
                </div>
                <div class="flex justify-between pb-1">
                  <span class="text-[var(--text-color)]">OS</span>
                  <span class="text-right text-[var(--left-text-color)]">
                    {{ deviceInfo.osType }} {{ deviceInfo.osVersion }}
                  </span>
                </div>
                <div class="mt-1 flex flex-col gap-1">
                  <span class="text-[var(--text-color)]">Webview / UserAgent</span>
                  <div class="rounded p-1 text-[12px] break-all text-[var(--left-text-color)] select-text">
                    {{ deviceInfo.webviewVersion }}
                  </div>
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
        </n-flex>
      </n-scrollbar>

      <footer class="z-10 flex shrink-0 justify-end gap-3 border-t px-6 py-4 backdrop-blur">
        <n-button ghost @click="closeWindow">
          {{ t("components.common.cancel") }}
        </n-button>
        <n-button type="primary" class="px-6" :loading="loading" @click="submitFeedback">
          {{ t("components.common.confirm") }}
        </n-button>
      </footer>
    </main>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { arch, version, type as osTypeFn } from "@tauri-apps/plugin-os";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { darkTheme, lightTheme, type FormInst, type UploadCustomRequestOptions, type UploadFileInfo } from "naive-ui";

import pkg from "~/package.json";
import { ThemeEnum } from "@/enums";
import { useSettingStore } from "@/stores/setting";
import { getOSType, isWindows } from "@/utils/PlatformUtils";

const { t } = useI18n();
const message = useMessage();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);
const appWindow = getCurrentWebviewWindow();

const imageCounts = 3;
const rules = {
  content: {
    required: true,
    message: t("feedback.rule.content"),
    trigger: ["input", "blur"]
  }
};

const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const fileList = ref<UploadFileInfo[]>([]);

const formModel = reactive({
  type: "bug", // 默认选中bug
  content: "",
  contact: ""
});

const deviceInfo = reactive({
  appVersion: pkg.version,
  osType: "",
  osVersion: "",
  arch: "",
  webviewVersion: navigator.userAgent
});

const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));

/** 关闭反馈窗口 */
const closeWindow = () => appWindow.close();

/**
 * 自定义上传函数，模拟上传延迟
 * @param param0 上传选项，包含完成回调
 */
const customUpload = ({ onFinish }: UploadCustomRequestOptions) => {
  setTimeout(onFinish, 500);
};

/** 上传前校验，始终返回 true */
const beforeUpload = () => true;

/**
 * 提交反馈表单
 * @param e 事件对象，用于阻止默认提交行为
 */
const submitFeedback = async (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
        message.success("反馈成功");
        closeWindow();
      }, 1000);
    }
  });
};

onMounted(async () => {
  appWindow.show();

  // 采集信息逻辑
  deviceInfo.arch = arch();
  deviceInfo.osType = getOSType?.() || osTypeFn();
  let v = version();
  if (isWindows?.() || deviceInfo.osType === "Windows_NT") {
    const parts = v.split(".");
    const buildNumber = Number(parts[2]);
    v = buildNumber > 22000 ? `11 (${buildNumber})` : `10 (${buildNumber})`;
  }
  deviceInfo.osVersion = v;
});
</script>

<style scoped>
:deep(.n-scrollbar-rail) {
  width: 5px !important;
  right: 2px !important;
}
</style>
