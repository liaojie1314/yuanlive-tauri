import { useNetwork } from "@vueuse/core";
import { useI18nGlobal } from "@/services/i18n.ts";
import { useUserStore } from "@/stores/user.ts";
import type { UserInfoType } from "@/api/types.ts";
import { info } from "@tauri-apps/plugin-log";
import { ensureAppStateReady } from "@/utils/AppStateReady.ts";
import { invoke } from "@tauri-apps/api/core";
import { useWindow } from "@/hooks/useWindow.ts";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export function useLogin() {
  const userStore = useUserStore();
  const { createWebviewWindow } = useWindow();
  const { t } = useI18nGlobal();

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

  const routerOrOpenHomeWindow = async () => {
    const registerWindow = await WebviewWindow.getByLabel("register");
    if (registerWindow) {
      await registerWindow.close().catch((error) => {
        console.warn("关闭注册窗口失败:", error);
      });
    }
    await createWebviewWindow("YuanLive", "home", 960, 720, "login", true, 330, 480, undefined, false);
  };

  /**
   * 登录
   * @param deviceType 设备类型
   * @param auto 是否自动登录
   */
  const login = async (deviceType: "PC" | "MOBILE", auto: boolean = false) => {
    loading.value = true;
    loginText.value = t("auth.status.loggingIn");
    loginDisabled.value = true;
    const hasStoredUserInfo = !!userStore.userInfo && !!userStore.userInfo.account;
    if (auto && !hasStoredUserInfo) {
      loading.value = false;
      loginDisabled.value = false;
      loginText.value = isOnline.value ? t("auth.button.login.default") : t("auth.button.login.networkError");
      uiState.value = "manual";
      // TODO: setting
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
        // TODO: setting
      }
      await info("账号信息缺失，请重新输入");
      return;
    }

    // TODO: 存储此次登陆设备指纹

    await ensureAppStateReady();

    invoke("login_command", {
      data: {
        account,
        password,
        deviceType,
        systemType: "2",
        grantType: "PASSWORD",
        isAutoLogin: auto,
        uid: auto ? userStore.userInfo!.uid : null
      }
    })
      .then(async (_) => {
        loginDisabled.value = true;
        loading.value = false;
        loginText.value = t("auth.status.successRedirect");
        await routerOrOpenHomeWindow();
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
          // TODO: setting
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
    const { createWebviewWindow } = useWindow();
    try {
      // 创建登录窗口
      await createWebviewWindow("登录", "login", 320, 448, void 0, false, 320, 448);
    } catch (e) {
      console.error("创建登录窗口失败:", e);
    }
  };

  return {
    userInfo,
    loading,
    loginText,
    loginDisabled,
    login,
    logout
  };
}
