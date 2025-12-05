// 全局枚举文件

/** 事件key */
export enum MittEnum {}

/** 主题类型 */
export enum ThemeEnum {
  /** 亮色 */
  LIGHT = "light",
  /** 暗色 */
  DARK = "dark",
  /** 跟随系统 */
  OS = "os"
}

export enum UrlEnum {
  LOGIN = "login",
  LOGOUT = "logout",
  REGISTER = "register",
  FORGET_PASSWORD = "forgetPassword"
}

/** 关闭窗口的行为 */
export enum CloseBxEnum {
  /** 隐藏 */
  HIDE = "hide",
  /** 关闭 */
  CLOSE = "close"
}

/** tauri原生跨窗口通信时传输的类型 */
export enum EventEnum {
  /** 窗口关闭 */
  WIN_CLOSE = "winClose",
  /** 窗口显示 */
  WIN_SHOW = "winShow",
  /** 退出程序 */
  EXIT = "exit"
}
