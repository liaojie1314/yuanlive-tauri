import { isMac } from "@/utils/PlatformUtils";
import { StoresEnum, ThemeEnum } from "@/enums";

// 获取平台对应的默认快捷键
const getDefaultShortcuts = () => {
  return {
    screenshot: isMac() ? "Cmd+Ctrl+H" : "Ctrl+Alt+H",
    openMainPanel: isMac() ? "Cmd+Ctrl+P" : "Ctrl+Alt+P",
    globalEnabled: false // 默认关闭全局快捷键
  };
};

export const useSettingStore = defineStore(
  StoresEnum.SETTING,
  () => {
    const page = reactive({
      // 页面阴影
      shadow: true,
      // 页面模糊
      blur: true,
      // 页面语言
      lang: "AUTO"
    });
    const themes = reactive({
      content: "",
      pattern: ""
    });
    const login = reactive({
      // 自动登录
      autoLogin: false,
      // 自动启动
      autoStartup: false
    });
    // 快捷键
    const shortcuts = reactive(getDefaultShortcuts());
    // 截图设置
    const screenshot = reactive({
      // 截图时是否隐藏窗口
      isConceal: false
    });
    // TODO: 自动更新
    const autoUpdate = ref(false);

    /**
     * 初始化主题
     * @param theme 主题
     */
    const initTheme = (theme: ThemeEnum) => {
      themes.content = theme;
      document.documentElement.dataset.theme = theme;
      themes.pattern = theme;
    };

    /**
     * 切换主题
     * @param theme 主题
     */
    const toggleTheme = (theme: ThemeEnum) => {
      if (theme === ThemeEnum.OS) {
        themes.pattern = theme;
        const os = matchMedia("(prefers-color-scheme: dark)").matches ? ThemeEnum.DARK : ThemeEnum.LIGHT;
        document.documentElement.dataset.theme = os;
        themes.content = os;
      } else {
        themes.content = theme;
        document.documentElement.dataset.theme = theme;
        themes.pattern = theme;
      }
    };

    /**
     * 切换登录设置
     * @param autoLogin 自动登录
     * @param autoStartup 自动启动
     */
    const toggleLogin = (autoLogin: boolean, autoStartup: boolean) => {
      login.autoLogin = autoLogin;
      login.autoStartup = autoStartup;
    };

    /**
     * 设置自动登录
     * @param autoLogin 自动登录
     */
    const setAutoLogin = (autoLogin: boolean) => {
      login.autoLogin = autoLogin;
    };

    /**
     * 设置自动启动
     * @param autoStartup 自动启动
     */
    const setAutoStartup = (autoStartup: boolean) => {
      login.autoStartup = autoStartup;
    };

    return {
      page,
      themes,
      login,
      shortcuts,
      screenshot,
      autoUpdate,
      initTheme,
      toggleTheme,
      toggleLogin,
      setAutoLogin,
      setAutoStartup
    };
  },
  {
    share: {
      enable: true,
      initialize: true
    }
  }
);
