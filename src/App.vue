<template>
  <div class="h-100vh w-100vw">
    <naive-provider :message-max="3" :notify-max="3" class="h-full">
      <router-view></router-view>
    </naive-provider>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { listen } from "@tauri-apps/api/event";
import { exit } from "@tauri-apps/plugin-process";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { useUserStore } from "@/stores/user";
import { useSettingStore } from "@/stores/setting";
import { loadLanguage } from "@/services/i18n";
import { ConnectionState } from "@/services/webSocketRust";
import { useMitt } from "@/hooks/useMitt";
import { useWindow } from "@/hooks/useWindow";
import { useTauriListener } from "@/hooks/useTauriListener";
import { useGlobalShortcut } from "@/hooks/useGlobalShortcut";
import { isDesktop, isMobile, isWindows10 } from "@/utils/PlatformUtils";
import { EventEnum, MittEnum, ThemeEnum, WsResponseMessageEnum } from "@/enums";

const { t } = useI18n();
const settingStore = useSettingStore();
const userStore = useUserStore();
const { initTheme, normalizeThemeState, toggleTheme } = settingStore;
const { themes, page } = storeToRefs(settingStore);
const { addListener } = useTauriListener();
const { sendWindowPayload, createWebviewWindow } = useWindow();
const { initializeGlobalShortcut, cleanupGlobalShortcut } = useGlobalShortcut();
const appWindow = WebviewWindow.getCurrent();

let lastWsConnectionState: string | null = null;

const userUid = computed(() => userStore.userInfo!.uid);

/**
 * 禁止拖拽图片及输入框
 * @param e 鼠标事件
 */
const preventDefault = (e: MouseEvent) => {
  const event = e.target as HTMLElement;
  // 检查目标元素是否是<img>元素
  if (event.nodeName.toLowerCase() === "img" || event.nodeName.toLowerCase() === "input") {
    e.preventDefault();
  }
};

/**
 * 禁止右键菜单
 * @param event 鼠标事件
 */
const preventGlobalContextMenu = (event: MouseEvent) => event.preventDefault();

/**
 * 处理websocket事件
 * @param event 事件对象
 */
const handleWebsocketEvent = async (event: any) => {
  const payload = event.payload;
  if (!payload || payload.type !== "connectionStateChanged") return;
  const previousState = (lastWsConnectionState || "").toUpperCase() || null;
  const nextStateRaw = payload.state;
  const nextState = typeof nextStateRaw === "string" ? nextStateRaw.toUpperCase() : "";
  const isReconnectionFlag = payload.is_reconnection;
  const hasRecoveredFromDrop = Boolean(
    previousState && previousState !== ConnectionState.CONNECTED && nextState === ConnectionState.CONNECTED
  );
  const shouldHandleReconnect = nextState === ConnectionState.CONNECTED && (isReconnectionFlag || hasRecoveredFromDrop);
  console.log("[WS] state change", {
    prev: previousState,
    next: nextState,
    isReconnectionFlag,
    hasRecoveredFromDrop,
    shouldHandleReconnect,
    raw: payload
  });
  lastWsConnectionState = nextState || previousState;
  if (!shouldHandleReconnect) return;
};

useMitt.on(WsResponseMessageEnum.REMOTE_LOGIN, async (data: { uid: string; ip: string; device: string }) => {
  if (Number(userUid.value) === Number(data.uid) && userStore.userInfo!.device === data.device) {
    const { useLogin } = await import("@/hooks/useLogin");
    const { logout } = useLogin();
    if (!isMobile()) {
      // 桌面端处理：聚焦主窗口并显示远程登录弹窗
      const home = await WebviewWindow.getByLabel("home");
      await home?.setFocus();
      const remoteIp = data.ip || t("auth.remoteLogin.unknownIp");
      await sendWindowPayload("login", {
        remoteLogin: {
          ip: remoteIp,
          timestamp: Date.now()
        }
      });
      await logout();
    }
  }
});

// 控制阴影
watch(
  () => page.value.shadow,
  (val) => {
    // 移动端始终禁用阴影
    if (isMobile()) {
      document.documentElement.style.setProperty("--shadow-enabled", "1");
    } else {
      document.documentElement.style.setProperty("--shadow-enabled", val ? "0" : "1");
    }
  },
  { immediate: true }
);

// 控制高斯模糊
watch(
  () => page.value.blur,
  (val) => {
    document.documentElement.setAttribute("data-blur", val ? "1" : "0");
  },
  { immediate: true }
);

// 控制字体样式
watch(
  () => page.value.fonts,
  (val) => {
    document.documentElement.style.setProperty("--font-family", val);
  },
  { immediate: true }
);

// 监听语言变化
watch(
  () => page.value.lang,
  (lang) => {
    console.log(lang);
    lang = lang === "AUTO" ? navigator.language : lang;
    loadLanguage(lang);
  },
  { immediate: true }
);

// 监听主题变化
watch(
  () => themes.value.content,
  (theme) => {
    toggleTheme(theme);
  }
);

onMounted(async () => {
  // 全局监听深度链接唤醒
  await onOpenUrl((urls) => {
    console.log("被外部链接唤醒，URLs:", urls);
    // urls 通常是一个数组，取第一个触发唤醒的 URL
    const url = urls[0];
    if (url && url.startsWith("yuanlive://")) {
      // 假设你的分享链接是：yuanlive://video/10086
      // const path = url.replace('yuanlive://', ''); // 变成 "video/10086"
      // TODO: 业务逻辑
    }
  });
  if (isWindows10()) {
    appWindow.setShadow(false).catch((error) => {
      console.warn("禁用窗口阴影失败:", error);
    });
  }
  if (!themes.value.content) {
    // 首次运行使用跟随系统，保持既有体验
    initTheme(ThemeEnum.OS);
  } else {
    // 非首次运行时直接使用已恢复的主题信息，避免被强制改回“跟随系统”
    normalizeThemeState();
  }
  document.documentElement.dataset.theme = themes.value.content;
  toggleTheme(themes.value.content);
  window.addEventListener("dragstart", preventDefault);
  addListener(listen("websocket-event", handleWebsocketEvent), "websocket-event");
  // 只在桌面端的主窗口(home)中初始化全局快捷键
  if (isDesktop() && appWindow.label === "home") {
    initializeGlobalShortcut();
  }
  // 开发环境不禁止
  if (process.env.NODE_ENV !== "development") {
    // 禁用浏览器默认的快捷键
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "f" || e.key === "r" || e.key === "g" || e.key === "j")) {
        e.preventDefault();
      }
    });
    // 禁止右键菜单
    window.addEventListener("contextmenu", preventGlobalContextMenu, false);
  }
  if (isDesktop()) {
    useMitt.on(MittEnum.CHECK_UPDATE, async () => {
      const checkUpdateWindow = await WebviewWindow.getByLabel("checkUpdate");
      await checkUpdateWindow?.show();
    });
    useMitt.on(MittEnum.DO_UPDATE, async (event) => {
      await createWebviewWindow("更新", "update", 490, 335, "", false, 490, 335, void 0, void 0, false, true);
      const closeWindow = await WebviewWindow.getByLabel(event.close);
      closeWindow?.close();
    });
    addListener(
      appWindow.listen(EventEnum.EXIT, async () => {
        await exit(0);
      }),
      "app-exit"
    );
  }
});

onUnmounted(async () => {
  window.removeEventListener("contextmenu", preventGlobalContextMenu, false);
  window.removeEventListener("dragstart", preventDefault);
  // 清理全局快捷键
  if (isDesktop() && appWindow.label === "home") {
    await cleanupGlobalShortcut();
  }
});
</script>

<style lang="scss">
img {
  user-select: none;
  -webkit-user-select: none;
}

input,
button,
a {
  user-select: auto;
  cursor: auto;
}
</style>
