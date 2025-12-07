// 全局枚举文件

/** 性别 */
export enum GenderEnum {
  // 男
  MAN = 1,
  // 女
  WOMAN = 2
}

/** 事件key */
export enum MittEnum {}

/** 主题类型 */
export enum ThemeEnum {
  // 亮色
  LIGHT = "light",
  // 暗色
  DARK = "dark",
  // 跟随系统
  OS = "os"
}

export enum UrlEnum {
  // 登出
  LOGOUT = "logout",
  //  注册
  REGISTER = "register",
  // 忘记密码
  FORGET_PASSWORD = "forgetPassword",
  // 获取用户信息详情
  GET_USER_INFO_DETAIL = "getUserInfoDetail"
}

/** 关闭窗口的行为 */
export enum CloseBxEnum {
  // 隐藏
  HIDE = "hide",
  // 关闭
  CLOSE = "close"
}

/** tauri原生跨窗口通信时传输的类型 */
export enum EventEnum {
  // 窗口关闭
  WIN_CLOSE = "winClose",
  // 窗口显示
  WIN_SHOW = "winShow",
  // 退出程序
  EXIT = "exit"
}

/** pinia存储的名称 */
export enum StoresEnum {
  // 置顶
  ALWAYS_ON_TOP = "alwaysOnTop",
  // 用户
  USER = "user"
}
