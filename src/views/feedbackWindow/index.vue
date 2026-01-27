<template>
  <main class="h-screen w-full flex flex-col overflow-hidden bg-[#fdfdfd] dark:bg-[#101014] select-none">
    <action-bar title="问题反馈" :max-w="false" class="shrink-0" />
    <n-scrollbar class="flex-1" content-class="p-6">
      <n-flex vertical :size="24">
        <div
          class="text-(13px #666) leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
          {{ t("feedback.intro") }}
        </div>
        <n-form
          ref="formRef"
          :model="formModel"
          :rules="rules"
          label-placement="top"
          require-mark-placement="right-hanging">
          <n-form-item :label="t('feedback.type.title')" path="type">
            <n-radio-group v-model:value="formModel.type" name="feedbackType" class="w-full">
              <n-grid :cols="4" :x-gap="10">
                <n-grid-item v-for="item in ['bug', 'lag', 'suggestion', 'other']" :key="item">
                  <div
                    class="cursor-pointer border rounded-md text-center py-2 transition-all duration-200 text-12px select-none border-gray-200"
                    :class="[
                      formModel.type === item
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50 font-medium shadow-sm'
                        : 'text-gray-500 hover:border-gray-300 bg-white'
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
          <n-form-item :label="t('feedback.content')" path="content">
            <n-input
              v-model:value="formModel.content"
              type="textarea"
              :placeholder="t('feedback.placeholder')"
              :autosize="{ minRows: 4, maxRows: 6 }"
              maxlength="500"
              show-count
              class="w-full" />
          </n-form-item>
          <n-form-item :label="t('feedback.images', { count: imageCounts })" path="images">
            <n-upload
              v-model:file-list="fileList"
              list-type="image-card"
              :max="imageCounts"
              accept=".jpg,.png,.jpeg,.log"
              :custom-request="customUpload"
              @before-upload="beforeUpload" />
          </n-form-item>
          <n-form-item :label="t('feedback.contact')" path="contact">
            <n-input v-model:value="formModel.contact" :placeholder="t('feedback.contactPlaceholder')" />
          </n-form-item>
        </n-form>
        <n-collapse
          arrow-placement="right"
          class="bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
          <n-collapse-item name="1">
            <template #header>
              <span class="text-13px font-medium">{{ t("feedback.deviceInfo") }}</span>
            </template>
            <template #header-extra>
              <span class="text-(12px #999) mr-2">{{ t("feedback.deviceInfoDesc") }}</span>
            </template>
            <div class="px-4 pb-4 text-(12px #707070) grid gap-2 font-mono leading-tight">
              <div class="flex justify-between border-b border-gray-200 dark:border-white/10 pb-1">
                <span>App Version</span>
                <span class="text-gray-900 dark:text-gray-200">{{ deviceInfo.appVersion }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 dark:border-white/10 pb-1">
                <span>OS</span>
                <span class="text-gray-900 dark:text-gray-200 text-right">
                  {{ deviceInfo.osType }} {{ deviceInfo.osVersion }}
                </span>
              </div>
              <div class="flex flex-col gap-1 mt-1">
                <span>Webview / UserAgent</span>
                <div class="bg-gray-200 dark:bg-black/30 p-2 rounded text-[10px] break-all select-text">
                  {{ deviceInfo.webviewVersion }}
                </div>
              </div>
            </div>
          </n-collapse-item>
        </n-collapse>
      </n-flex>
    </n-scrollbar>

    <footer
      class="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-white/80 dark:bg-[#101014]/80 backdrop-blur flex justify-end gap-3 z-10">
      <n-button @click="closeWindow" ghost>
        {{ t("components.common.cancel") }}
      </n-button>
      <n-button type="primary" :loading="loading" @click="submitFeedback" class="px-6">
        {{ t("components.common.confirm") }}
      </n-button>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { arch, version, type as osTypeFn } from "@tauri-apps/plugin-os";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { FormInst, UploadCustomRequestOptions, UploadFileInfo } from "naive-ui";

import pkg from "~/package.json";
import { getOSType, isWindows } from "@/utils/PlatformUtils";

const { t } = useI18n();
const message = useMessage();
const appWindow = getCurrentWebviewWindow();
const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const fileList = ref<UploadFileInfo[]>([]);
const imageCounts = 3;

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

const rules = {
  content: {
    required: true,
    message: t("feedback.rule.content", "请描述您遇到的问题"),
    trigger: ["input", "blur"]
  }
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
const closeWindow = () => appWindow.close();
const customUpload = ({ onFinish }: UploadCustomRequestOptions) => {
  setTimeout(onFinish, 500);
};
const beforeUpload = () => true;
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
</script>

<style scoped>
/* 针对 Webkit 滚动条的微调，让它看起来更细腻 */
:deep(.n-scrollbar-rail) {
  width: 5px !important;
  right: 2px !important;
}
</style>
