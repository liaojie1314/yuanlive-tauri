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

/** url枚举 */
export enum UrlEnum {
  // 登出
  LOGOUT = "logout",
  //  注册
  REGISTER = "register",
  // 忘记密码
  FORGET_PASSWORD = "forgetPassword",
  // 获取用户信息详情
  GET_USER_INFO_DETAIL = "getUserInfoDetail",
  // 生成登录二维码
  GENERATE_QR_CODE = "generateQRCode",
  // 检测二维码状态
  CHECK_QR_STATUS = "checkQRStatus",
  // 发送邮箱验证码
  SEND_EMAIL_CAPTCHA = "sendEmailCaptcha"
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

/** tauri 命令 */
export enum TauriCommandEnum {
  // 更新 token
  UPDATE_TOKEN = "update_token",
  // 移除 token
  REMOVE_TOKEN = "remove_token",
  // AI 消息流式发送
  AI_MESSAGE_SEND_STREAM = "ai_message_send_stream"
}

/** pinia存储的名称 */
export enum StoresEnum {
  // 置顶
  ALWAYS_ON_TOP = "alwaysOnTop",
  // 用户
  USER = "user",
  // 设置
  SETTING = "setting"
}

/** 本地存储的key */
export enum StorageKeyEnum {
  CLIENT_ID = "clientId",
  DEVICE_FINGERPRINT = "deviceFingerprint",
  PROXY_SETTINGS = "proxySettings",
  SETTING = "setting"
}
