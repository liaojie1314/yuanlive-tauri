import { CloseBxEnum, StoresEnum, ThemeEnum } from "@/enums";
import { isMac } from "@/utils/PlatformUtils";

// 获取平台对应的默认快捷键
const getDefaultShortcuts = () => {
  return {
    screenshot: isMac() ? "Cmd+Ctrl+H" : "Ctrl+Alt+H",
    openMainPanel: isMac() ? "Cmd+Ctrl+P" : "Ctrl+Alt+P",
    globalEnabled: false // 默认关闭全局快捷键
  };
};

export const useSettingStore = defineStore(StoresEnum.SETTING, {
  state: () => ({
    // 提示设置
    tips: {
      type: CloseBxEnum.HIDE,
      notTips: false
    },
    // 页面设置
    page: {
      // 页面阴影
      shadow: true,
      // 页面模糊
      blur: true,
      // 页面语言
      lang: "AUTO",
      // 页面字体
      fonts: "PingFang"
    },
    // 主题设置
    themes: {
      content: "",
      pattern: ""
    },
    // 登录设置
    login: {
      // 自动登录
      autoLogin: false,
      // 自动启动
      autoStartup: false
    },
    // 快捷键
    shortcuts: getDefaultShortcuts(),
    // 截图设置
    screenshot: {
      // 截图时是否隐藏窗口
      isConceal: false
    },
    // 聊天设置
    chat: {
      sendKey: "Enter"
    },
    // 是否通过esc关闭
    escClose: true,
    // 更新设置
    update: {
      // 忽略更新版本
      dismiss: ""
    }
  }),
  actions: {
    /**
     * 初始化主题
     * @param theme 主题
     */
    initTheme(theme: string) {
      this.themes.content = theme;
      document.documentElement.dataset.theme = theme;
      this.themes.pattern = theme;
    },

    /**
     * 切换主题
     * @param theme 主题
     */
    toggleTheme(theme: string) {
      if (theme === ThemeEnum.OS) {
        this.themes.pattern = theme;
        const os = matchMedia("(prefers-color-scheme: dark)").matches ? ThemeEnum.DARK : ThemeEnum.LIGHT;
        document.documentElement.dataset.theme = os;
        this.themes.content = os;
      } else {
        this.themes.content = theme;
        document.documentElement.dataset.theme = theme;
        this.themes.pattern = theme;
      }
    },

    /**
     * 切换登录设置
     * @param autoLogin 自动登录
     * @param autoStartup 自动启动
     */
    toggleLogin(autoLogin: boolean, autoStartup: boolean) {
      this.login.autoLogin = autoLogin;
      this.login.autoStartup = autoStartup;
    },

    /**
     * 设置自动登录
     * @param autoLogin 自动登录
     */
    setAutoLogin(autoLogin: boolean) {
      this.login.autoLogin = autoLogin;
    },

    /**
     * 设置自动启动
     * @param autoStartup 自动启动
     */
    setAutoStartup(autoStartup: boolean) {
      this.login.autoStartup = autoStartup;
    },

    /**
     * 设置截图快捷键
     * @param shortcut 截图快捷键
     */
    setScreenshotShortcut(shortcut: string) {
      if (!this.shortcuts) {
        this.shortcuts = getDefaultShortcuts();
      }
      this.shortcuts.screenshot = shortcut;
    },

    /**
     * 设置打开主面板快捷键
     * @param shortcut 打开主面板快捷键
     */
    setOpenMainPanelShortcut(shortcut: string) {
      if (!this.shortcuts) {
        this.shortcuts = getDefaultShortcuts();
      }
      this.shortcuts.openMainPanel = shortcut;
    },

    /**
     * 设置发送消息快捷键
     * @param shortcut 发送消息快捷键
     */
    setSendMessageShortcut(shortcut: string) {
      if (!this.chat) {
        this.chat = { sendKey: "Enter" };
      }
      this.chat.sendKey = shortcut;
    },

    /**
     * 设置全局快捷键开关
     * @param enabled 全局快捷键开关
     */
    setGlobalShortcutEnabled(enabled: boolean) {
      if (!this.shortcuts) {
        this.shortcuts = getDefaultShortcuts();
      }
      this.shortcuts.globalEnabled = enabled;
    }
  },
  share: {
    enable: true,
    initialize: true
  }
});
