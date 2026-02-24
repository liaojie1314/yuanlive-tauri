<template>
  <n-config-provider :theme="naiveTheme" data-tauri-drag-region class="login-box size-full rounded-8px select-none">
    <action-bar :max-w="false" proxy data-tauri-drag-region />

    <n-flex vertical :size="12" align="center" class="pt-10px">
      <span class="text-(16px #70938c) textFont">{{ t("auth.network.title") }}</span>

      <n-tabs type="line" animated justify-content="center" @update:value="handleTab">
        <n-tab-pane name="api" :tab="t('auth.network.tabs.api')">
          <n-flex vertical :size="10" align="center" class="pt-10px">
            <n-flex vertical :size="8" justify="center">
              <p class="text-12px">{{ t("auth.network.fields.type") }}</p>
              <n-select class="min-w-240px" v-model:value="savedProxy.apiType" :options="apiOptions" />

              <n-collapse-transition :show="savedProxy.apiType === 'http' || savedProxy.apiType === 'https'">
                <n-flex vertical :size="10" justify="center">
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.host") }}</p>
                  <n-input
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.apiIp"
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    :placeholder="t('auth.network.placeholder.host')" />

                  <p class="text-12px pt-6px">{{ t("auth.network.fields.port") }}</p>
                  <n-input
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.apiPort"
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    :placeholder="t('auth.network.placeholder.port')" />
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.suffix") }}</p>
                  <n-input
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.apiSuffix"
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    :placeholder="t('auth.network.placeholder.apiSuffix')" />
                </n-flex>
              </n-collapse-transition>
            </n-flex>
          </n-flex>
        </n-tab-pane>
        <n-tab-pane name="ws" :tab="t('auth.network.tabs.ws')">
          <n-flex vertical :size="10" align="center" class="pt-10px">
            <n-flex vertical :size="8" justify="center">
              <p class="text-12px">{{ t("auth.network.fields.type") }}</p>
              <n-select class="min-w-240px" v-model:value="savedProxy.wsType" :options="wsOptions" />

              <n-collapse-transition :show="savedProxy.wsType === 'ws' || savedProxy.wsType === 'wss'">
                <n-flex vertical :size="10" justify="center">
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.host") }}</p>
                  <n-input
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.wsIp"
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    :placeholder="t('auth.network.placeholder.host')" />

                  <p class="text-12px pt-6px">{{ t("auth.network.fields.port") }}</p>
                  <n-input
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.wsPort"
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    :placeholder="t('auth.network.placeholder.port')" />
                  <p class="text-12px pt-6px">{{ t("auth.network.fields.suffix") }}</p>
                  <n-input
                    class="rounded-6px text-12px"
                    v-model:value="savedProxy.wsSuffix"
                    type="text"
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    :placeholder="t('auth.network.placeholder.wsSuffix')" />
                </n-flex>
              </n-collapse-transition>
            </n-flex>
          </n-flex>
        </n-tab-pane>
      </n-tabs>

      <n-flex align="center" justify="center" :size="40" class="pt-10px">
        <p @click="handleSave" class="text-(14px #13987f) cursor-pointer">{{ t("auth.network.actions.save") }}</p>
        <p @click="router.push('/login')" class="text-(14px #707070) cursor-pointer">
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
import { StorageKeyEnum, ThemeEnum } from "@/enums";
import { updateSettings } from "@/utils/TauriCommand";
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
    let proxySettings: ProxySettings;
    if (proxy.value === "api") {
      // 保存到本地
      proxySettings = {
        ...savedProxy,
        apiType: savedProxy.apiType,
        apiIp: savedProxy.apiIp,
        apiPort: savedProxy.apiPort,
        apiSuffix: savedProxy.apiSuffix ? "/" + savedProxy.apiSuffix : ""
      };
    } else {
      proxySettings = {
        ...savedProxy,
        wsType: savedProxy.wsType,
        wsIp: savedProxy.wsIp,
        wsPort: savedProxy.wsPort,
        wsSuffix: savedProxy.wsSuffix ? "/" + savedProxy.wsSuffix : ""
      };
    }
    const settings = JSON.stringify(proxySettings);
    localStorage.setItem(StorageKeyEnum.PROXY_SETTINGS, settings);
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
  const baseUrl =
    proxySettings.apiType + "://" + proxySettings.apiIp + ":" + proxySettings.apiPort + proxySettings.apiSuffix;
  const wsUrl = proxySettings.wsType + "://" + proxySettings.wsIp + ":" + proxySettings.wsPort + proxySettings.wsSuffix;
  // 更新Tauri配置
  await updateSettings({ baseUrl, wsUrl }).catch((err) => {
    window.$message.error(t("auth.network.messages.saveFailed", { error: err }));
  });
};

onMounted(() => {
  const proxySettings = localStorage.getItem(StorageKeyEnum.PROXY_SETTINGS);
  if (proxySettings) {
    const parsedProxySettings = JSON.parse(proxySettings) as ProxySettings;
    Object.assign(savedProxy, parsedProxySettings);
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
