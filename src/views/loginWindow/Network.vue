<template>
  <n-config-provider data-tauri-drag-region class="login-box rounded-8px size-full select-none" :theme="naiveTheme">
    <action-bar proxy data-tauri-drag-region :max-w="false" />

    <n-flex vertical align="center" class="pt-10px" :size="12">
      <span class="text-(16px #70938c) textFont">{{ t("auth.network.title") }}</span>

      <n-tabs type="line" animated justify-content="center" @update:value="handleTab">
        <n-tab-pane name="api" :tab="t('auth.network.tabs.api')">
          <n-flex vertical align="center" class="pt-10px" :size="10">
            <n-flex vertical justify="center" :size="8">
              <p class="text-12px">{{ t("auth.network.fields.type") }}</p>
              <n-select class="min-w-240px" v-model:value="savedProxy.apiType" :options="apiOptions" />

              <n-collapse-transition :show="savedProxy.apiType === 'http' || savedProxy.apiType === 'https'">
                <n-flex vertical justify="center" :size="10">
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.host") }}</p>
                  <n-input
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.apiIp"
                    :placeholder="t('auth.network.placeholder.host')" />

                  <p class="text-12px pt-6px">{{ t("auth.network.fields.port") }}</p>
                  <n-input
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.apiPort"
                    :placeholder="t('auth.network.placeholder.port')" />
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.suffix") }}</p>
                  <n-input
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.apiSuffix"
                    :placeholder="t('auth.network.placeholder.apiSuffix')" />
                </n-flex>
              </n-collapse-transition>
            </n-flex>
          </n-flex>
        </n-tab-pane>
        <n-tab-pane name="ws" :tab="t('auth.network.tabs.ws')">
          <n-flex vertical align="center" class="pt-10px" :size="10">
            <n-flex vertical justify="center" :size="8">
              <p class="text-12px">{{ t("auth.network.fields.type") }}</p>
              <n-select class="min-w-240px" v-model:value="savedProxy.wsType" :options="wsOptions" />

              <n-collapse-transition :show="savedProxy.wsType === 'ws' || savedProxy.wsType === 'wss'">
                <n-flex vertical justify="center" :size="10">
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.host") }}</p>
                  <n-input
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.wsIp"
                    :placeholder="t('auth.network.placeholder.host')" />

                  <p class="text-12px pt-6px">{{ t("auth.network.fields.port") }}</p>
                  <n-input
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.wsPort"
                    :placeholder="t('auth.network.placeholder.port')" />
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.suffix") }}</p>
                  <n-input
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.wsSuffix"
                    :placeholder="t('auth.network.placeholder.wsSuffix')" />
                </n-flex>
              </n-collapse-transition>
            </n-flex>
          </n-flex>
        </n-tab-pane>
      </n-tabs>

      <n-flex align="center" justify="center" class="pt-10px" :size="40">
        <p class="text-(14px #13987f) cursor-pointer" @click="handleSave">{{ t("auth.network.actions.save") }}</p>
        <p class="text-(14px #707070) cursor-pointer" @click="router.push('/login')">
          {{ t("auth.network.actions.back") }}
        </p>
      </n-flex>
    </n-flex>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";

import router from "@/router";
import { ThemeEnum } from "@/enums";
import { updateSettings, getSettings } from "@/utils/TauriCommand";
import { useSettingStore } from "@/stores/setting";

const { t } = useI18n();
const settingStore = useSettingStore();
const { themes } = storeToRefs(settingStore);

type ProxySettings = {
  apiType: string;
  apiIp: string;
  apiPort: string;
  apiSuffix: string;
  wsType: string;
  wsIp: string;
  wsPort: string;
  wsSuffix: string;
};

const proxy = ref<"api" | "ws">("api");
const savedProxy = reactive<ProxySettings>({
  apiType: "",
  apiIp: "",
  apiPort: "",
  apiSuffix: "",
  wsType: "",
  wsIp: "",
  wsPort: "",
  wsSuffix: ""
});

const naiveTheme = computed(() => (themes.value.content === ThemeEnum.DARK ? darkTheme : lightTheme));
// HTTP配置选项
const apiOptions = computed(() => [
  {
    label: t("auth.network.api.options.none"),
    value: ""
  },
  {
    label: t("auth.network.api.options.http"),
    value: "http"
  },
  {
    label: t("auth.network.api.options.https"),
    value: "https"
  }
]);
// WebSocket配置选项
const wsOptions = computed(() => [
  {
    label: t("auth.network.ws.options.none"),
    value: ""
  },
  {
    label: t("auth.network.ws.options.ws"),
    value: "ws"
  },
  {
    label: t("auth.network.ws.options.wss"),
    value: "wss"
  }
]);

/**
 * 切换代理类型
 * @param tab 代理类型
 */
const handleTab = async (tab: string) => {
  if (tab === "api") {
    proxy.value = "api";
  } else if (tab === "ws") {
    proxy.value = "ws";
  }
};

/**
 * 清理后缀
 * @param suffix 后缀
 * @returns 清理后的后缀
 */
const cleanSuffix = (suffix: string) => {
  if (!suffix) return "";
  // 匹配开头的一个或多个斜杠并替换为空
  return suffix.replace(/^\/+/, "");
};

/**
 * 将完整的 URL 拆解并回显到表单配置中
 * @param urlStr 完整的后端/WS地址
 * @param prefix 'api' 或 'ws'
 */
const parseUrlToProxy = (urlStr: string, prefix: "api" | "ws") => {
  if (!urlStr) {
    savedProxy[`${prefix}Type`] = "";
    savedProxy[`${prefix}Ip`] = "";
    savedProxy[`${prefix}Port`] = "";
    savedProxy[`${prefix}Suffix`] = "";
    return;
  }
  try {
    const url = new URL(urlStr);
    // url.protocol 包含冒号，例如 "http:"，需要去掉
    savedProxy[`${prefix}Type`] = url.protocol.replace(":", "");
    savedProxy[`${prefix}Ip`] = url.hostname;
    savedProxy[`${prefix}Port`] = url.port;
    // url.pathname 包含前导斜杠，例如 "/api"，需要去掉
    savedProxy[`${prefix}Suffix`] = url.pathname === "/" ? "" : url.pathname.replace(/^\/+/, "");
  } catch (error) {
    console.error(`解析 ${prefix} URL 失败:`, error);
  }
};

/** 保存代理配置 */
const handleSave = async () => {
  try {
    if (
      (savedProxy.apiType && (!savedProxy.apiIp || !savedProxy.apiPort)) ||
      (savedProxy.wsType && (!savedProxy.wsIp || !savedProxy.wsPort))
    ) {
      window.$message.warning(t("auth.network.messages.incomplete"));
      return;
    }
    const proxySettings: ProxySettings = {
      apiType: savedProxy.apiType,
      apiIp: savedProxy.apiIp,
      apiPort: savedProxy.apiPort,
      apiSuffix: cleanSuffix(savedProxy.apiSuffix),

      wsType: savedProxy.wsType,
      wsIp: savedProxy.wsIp,
      wsPort: savedProxy.wsPort,
      wsSuffix: cleanSuffix(savedProxy.wsSuffix)
    };
    Object.assign(savedProxy, proxySettings);
    await updateTauriSettings(proxySettings);
    window.$message.success(t("auth.network.messages.saveSuccess"));
  } catch (error) {
    window.$message.error(t("auth.network.messages.saveFailed", { error }));
  }
};

/**
 * 更新Tauri配置
 * @param proxySettings 代理配置
 */
const updateTauriSettings = async (proxySettings: ProxySettings) => {
  const baseUrl = proxySettings.apiType
    ? `${proxySettings.apiType}://${proxySettings.apiIp}:${proxySettings.apiPort}${proxySettings.apiSuffix ? "/" + proxySettings.apiSuffix : ""}`
    : "";

  const wsUrl = proxySettings.wsType
    ? `${proxySettings.wsType}://${proxySettings.wsIp}:${proxySettings.wsPort}${proxySettings.wsSuffix ? "/" + proxySettings.wsSuffix : ""}`
    : "";

  // 更新Tauri配置
  await updateSettings({ baseUrl, wsUrl }).catch((err) => {
    window.$message.error(t("auth.network.messages.saveFailed", { error: err }));
  });
};

onMounted(async () => {
  try {
    const settings = await getSettings();
    console.log(settings);
    if (settings) {
      parseUrlToProxy(settings.baseUrl, "api");
      parseUrlToProxy(settings.wsUrl, "ws");
    }
  } catch (error) {
    console.error("获取网络配置失败", error);
  }
});
</script>

<style scoped lang="scss">
@use "@/styles/global/login-bg";

:deep(.n-input .n-input__input-el) {
  padding: 0;
  height: 30px;
  line-height: 30px;
}

:deep(.n-tabs .n-tabs-nav.n-tabs-nav--line-type.n-tabs-nav--top .n-tabs-nav-scroll-content) {
  border-bottom: 1px solid transparent;
}
</style>
