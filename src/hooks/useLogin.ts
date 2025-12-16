import { useNetwork } from "@vueuse/core";
import { emit } from "@tauri-apps/api/event";
import { info } from "@tauri-apps/plugin-log";
import { invoke } from "@tauri-apps/api/core";

import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { UserInfoType } from "@/api/types.ts";

import { EventEnum, StorageKeyEnum, TauriCommandEnum } from "@/enums";
import { useUserStore } from "@/stores/user.ts";
import { useGlobalStore } from "@/stores/global.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { useI18nGlobal } from "@/services/i18n.ts";
import { useWindow } from "@/hooks/useWindow.ts";
import { ensureAppStateReady } from "@/utils/AppStateReady.ts";
import { invokeSilently } from "@/utils/TauriInvokeHandler.ts";
import webSocketRust from "@/services/webSocketRust.ts";
import { getEnhancedFingerprint } from "@/services/fingerprint.ts";

export function useLogin() {
  const userStore = useUserStore();
  const globalStore = useGlobalStore();
  const settingStore = useSettingStore();
  const { createWebviewWindow, resizeWindow } = useWindow();
  const { t } = useI18nGlobal();
  const { showTray } = storeToRefs(globalStore);

  // 网络连接是否正常
  const { isOnline } = useNetwork();
  const loading = ref(false);

  // 登录按钮的文本内容
  const loginText = ref(isOnline.value ? t("auth.button.login.default") : t("auth.button.login.networkError"));
  const loginDisabled = ref(!isOnline.value);
  // 账号信息
  const userInfo = ref({
    account: "",
    password: "",
    avatar: "",
    userName: "",
    uid: ""
  });
  const uiState = ref<"manual" | "auto">("manual");

  /**
   * 打开首页窗口
   */
  const openHomeWindow = async () => {
    const registerWindow = await WebviewWindow.getByLabel("register");
    if (registerWindow) {
      await registerWindow.close().catch((error) => {
        console.warn("关闭注册窗口失败:", error);
      });
    }
    await createWebviewWindow("YuanLive", "home", 960, 720, "login", true, 330, 480, undefined, false);
    // 只有在成功创建home窗口并且已登录的情况下才显示托盘菜单
    showTray.value = true;
    await resizeWindow("tray", 130, 138);
  };

  /**
   * 登录
   * @param deviceType 设备类型
   * @param auto 是否自动登录
   */
  const login = async (deviceType: "PC" | "MOBILE", auto: boolean = settingStore.login.autoLogin) => {
    //TODO: 测试
    // await webSocketRust.initConnect();
    // await openHomeWindow();
    // return;
    loading.value = true;
    loginText.value = t("auth.status.loggingIn");
    loginDisabled.value = true;
    const hasStoredUserInfo = !!userStore.userInfo && !!userStore.userInfo.account;
    if (auto && !hasStoredUserInfo) {
      loading.value = false;
      loginDisabled.value = false;
      loginText.value = isOnline.value ? t("auth.button.login.default") : t("auth.button.login.networkError");
      uiState.value = "manual";
      settingStore.setAutoLogin(false);
      await info("自动登录信息已失效，请手动登录");
      return;
    }
    const loginInfo = auto && userStore.userInfo ? (userStore.userInfo as UserInfoType) : userInfo.value;
    const account = loginInfo?.account;
    const password = loginInfo?.password ?? userInfo.value.password;
    if (!account) {
      loading.value = false;
      loginDisabled.value = false;
      loginText.value = isOnline.value ? t("auth.button.login.default") : t("auth.button.login.networkError");
      if (auto) {
        uiState.value = "manual";
        settingStore.setAutoLogin(false);
      }
      await info("账号信息缺失，请重新输入");
      return;
    }

    // 存储此次登陆设备指纹
    const clientId = await getEnhancedFingerprint();
    localStorage.setItem(StorageKeyEnum.CLIENT_ID, clientId);

    await ensureAppStateReady();

    invoke("login_command", {
      data: {
        account,
        password,
        deviceType,
        clientId,
        grantType: "PASSWORD",
        isAutoLogin: auto,
        uid: auto ? userStore.userInfo!.uid : null
      }
    })
      .then(async (_) => {
        loginDisabled.value = true;
        loading.value = false;
        loginText.value = t("auth.status.successRedirect");
        await webSocketRust.initConnect();
        await openHomeWindow();
      })
      .catch((e) => {
        console.error("登录异常: ", e);
        window.$message.error(e);
        loading.value = false;
        loginDisabled.value = false;
        loginText.value = t("auth.button.login.default");
        // 如果是自动登录失败，切换到手动登录界面并重置按钮状态
        if (auto) {
          uiState.value = "manual";
          loginDisabled.value = false;
          loginText.value = t("auth.button.login.default");
          settingStore.setAutoLogin(false);
          // 自动填充之前尝试登录的账号信息到手动登录表单
          if (userStore.userInfo) {
            userInfo.value.account = userStore.userInfo.account || userStore.userInfo.email || "";
            userInfo.value.avatar = userStore.userInfo.avatar;
            userInfo.value.userName = userStore.userInfo.userName;
            userInfo.value.uid = userStore.userInfo.uid;
          }
        }
      });
  };

  /**
   * 登出
   */
  const logout = async () => {
    showTray.value = false;
    try {
      // 创建登录窗口
      await invokeSilently(TauriCommandEnum.REMOVE_TOKEN);
      await createWebviewWindow("登录", "login", 320, 448, void 0, false, 320, 448);
      // 发送登出事件
      await emit(EventEnum.LOGOUT);
      // 调整托盘大小
      await resizeWindow("tray", 130, 48);
    } catch (e) {
      console.error("创建登录窗口失败:", e);
    }
  };

  return {
    uiState,
    userInfo,
    loading,
    loginText,
    loginDisabled,
    login,
    logout
  };
}
