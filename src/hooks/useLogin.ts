import { useI18n } from "vue-i18n";
import { useNetwork } from "@vueuse/core";
import { emit } from "@tauri-apps/api/event";
import { info } from "@tauri-apps/plugin-log";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import webSocketRust from "@/services/webSocketRust.ts";
import { EventEnum, StorageKeyEnum, TauriCommandEnum } from "@/enums";
import { logoutApi } from "@/api/auth";
import { useUserStore } from "@/stores/user.ts";
import { useGlobalStore } from "@/stores/global.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { useWindow } from "@/hooks/useWindow.ts";
import { isDesktop } from "@/utils/PlatformUtils";
import { ensureAppStateReady } from "@/utils/AppStateReady.ts";
import { invokeSilently } from "@/utils/TauriInvokeHandler.ts";

export function useLogin() {
  const userStore = useUserStore();
  const globalStore = useGlobalStore();
  const settingStore = useSettingStore();
  const { createWebviewWindow, resizeWindow } = useWindow();
  const { t } = useI18n();
  const { showTray } = storeToRefs(globalStore);

  /**
   * 在 composable 初始化时获取 router 实例
   * 注意: useRouter() 必须在组件 setup 上下文中调用
   * 不能在异步回调中调用 useRouter(),因为那时已经失去了 Vue 组件上下文
   * 所以在这里提前获取并保存 router 实例,供后续异步操作使用
   */
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch (_e) {
    void info("[useLogin] 无法获取 router 实例,可能不在组件上下文中");
  }
  // 网络连接是否正常
  const { isOnline } = useNetwork();
  const loading = ref(false);

  const loginStatus = ref<"idle" | "loading" | "success">("idle");
  // 登录按钮的文本内容
  const loginText = computed(() => {
    if (loginStatus.value === "loading") {
      return t("auth.status.loggingIn");
    }
    if (loginStatus.value === "success") {
      return t("auth.status.successRedirect");
    }
    // idle 状态下，根据网络状态返回
    return isOnline.value ? t("auth.button.login.default") : t("auth.button.login.networkError");
  });
  const loginDisabled = ref(!isOnline.value);
  // 账号信息
  const userInfo = ref({
    account: "",
    password: "",
    avatar: "",
    uid: ""
  });
  const uiState = ref<"manual" | "auto">("manual");

  /**
   * 打开首页窗口
   */
  const openHomeWindow = async () => {
    if (isDesktop()) {
      const registerWindow = await WebviewWindow.getByLabel("register");
      if (registerWindow) {
        await registerWindow.close().catch((error) => {
          console.warn("关闭注册窗口失败:", error);
        });
      }
      await emit(EventEnum.LOGIN_SUCCESS);
      await createWebviewWindow("YuanLive", "home", 1200, 720, "login", true, 900, 520, 1680, void 0, void 0, false);
      // 只有在成功创建home窗口并且已登录的情况下才显示托盘菜单
      showTray.value = true;
      await resizeWindow("tray", 130, 138);
    } else {
      // 移动端使用路由跳转
      router?.push("/mobile/home");
    }
  };

  /**
   * 登录
   * @param device 设备类型
   * @param auto 是否自动登录
   */
  const normalLogin = async (device: "desktop" | "mobile", auto: boolean = settingStore.login.autoLogin) => {
    // TODO: 测试
    // await webSocketRust.initConnect();
    // await openHomeWindow();
    // return;
    loading.value = true;
    loginStatus.value = "loading";
    loginDisabled.value = true;
    const hasStoredUserInfo = !!(userStore.userInfo?.email || userStore.userInfo?.username);
    if (auto && !hasStoredUserInfo) {
      loading.value = false;
      loginDisabled.value = false;
      loginStatus.value = "idle";
      uiState.value = "manual";
      settingStore.setAutoLogin(false);
      info("自动登录信息已失效，请手动登录");
      return;
    }
    const account =
      auto && userStore.userInfo ? userStore.userInfo?.username || userStore.userInfo?.email : userInfo.value.account;
    const password = auto ? "" : userInfo.value.password;

    if (!account || (!auto && !password)) {
      loading.value = false;
      loginDisabled.value = false;
      loginStatus.value = "idle";
      if (auto) {
        uiState.value = "manual";
        settingStore.setAutoLogin(false);
      }
      info("账号信息缺失，请重新输入");
      return;
    }

    try {
      const deviceId = localStorage.getItem(StorageKeyEnum.DEVICE_ID);

      await ensureAppStateReady();

      await invoke(TauriCommandEnum.LOGIN_COMMAND, {
        data: {
          account,
          password,
          device,
          deviceID: deviceId,
          isAutoLogin: auto,
          uid: auto ? userStore.userInfo!.uid : null
        }
      });
      loginDisabled.value = true;
      loading.value = false;
      loginStatus.value = "success";
      await userStore.getUserDetail();
      await webSocketRust.initConnect();
      await openHomeWindow();
    } catch (e: any) {
      console.error("登录异常: ", e);
      window.$message.error(typeof e === "string" ? e : e.message);
      loading.value = false;
      loginStatus.value = "idle";
      // 如果是自动登录失败，切换到手动登录界面并重置按钮状态
      if (auto) {
        uiState.value = "manual";
        loginDisabled.value = false;
        settingStore.setAutoLogin(false);
        // 自动填充之前尝试登录的账号信息到手动登录表单
        if (userStore.userInfo) {
          userInfo.value.account = userStore.userInfo?.username || userStore.userInfo?.email || "";
          userInfo.value.avatar = userStore.userInfo?.avatar || "";
          userInfo.value.uid = userStore.userInfo?.uid;
        }
      } else {
        loginDisabled.value = !(userInfo.value.account && userInfo.value.password && isOnline.value);
      }
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    await logoutApi();
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
    normalLogin,
    logout
  };
}
