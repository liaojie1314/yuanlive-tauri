// 全局枚举文件

/** 性别 */
export enum GenderEnum {
  // 男
  MAN = 1,
  // 女
  WOMAN = 2
}

/** 上传场景 */
export enum UploadSceneEnum {
  /** 聊天 */
  CHAT = "chat",
  /** 头像 */
  AVATAR = "avatar",
  /** 视频 */
  VIDEO = "video"
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
  GET_CODE = "getCode",
  // 地图坐标转换
  MAP_COORD_TRANSLATE = "mapCoordTranslate",
  // 地图逆地理编码
  MAP_REVERSE_GEOCODE = "mapReverseGeocode",
  // 地图静态图
  MAP_STATIC = "mapStatic"
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
  /** 独立窗口 */
  ALONE = "alone",
  /** 多窗口 */
  MULTI_MSG = "multiMsg",
  // 窗口关闭
  WIN_CLOSE = "winClose",
  // 窗口显示
  WIN_SHOW = "winShow",
  // 退出程序
  EXIT = "exit",
  // 退出账号
  LOGOUT = "logout"
}

/** tauri 命令 */
export enum TauriCommandEnum {
  // 基础请求命令
  REQUEST_COMMAND = "request_command",
  // 登录
  LOGIN_COMMAND = "login_command",
  // 上传分片
  UPLOAD_CHUNK_COMMAND = "upload_chunk_command",
  // 检查已上传分片
  CHECK_UPLOADED_CHUNKS_COMMAND = "check_uploaded_chunks_command",
  // 合并分片
  MERGE_CHUNKS_COMMAND = "merge_chunks_command",
  // 更新 token
  UPDATE_TOKEN = "update_token",
  // 移除 token
  REMOVE_TOKEN = "remove_token",
  // AI 消息流式发送
  AI_MESSAGE_SEND_STREAM = "ai_message_send_stream",
  // AI 取消流式消息
  AI_MESSAGE_CANCEL_STREAM = "ai_message_cancel_stream",
  /** desktop专属 */
  // 推送窗口数据
  PUSH_WINDOW_PAYLOAD = "push_window_payload",
  // 获取窗口数据
  GET_WINDOW_PAYLOAD = "get_window_payload",
  // 截图
  SCREENSHOT = "screenshot",
  // 检查ffmpeg是否安装
  CHECK_FFMPEG_INSTALLED = "check_ffmpeg_installed",
  // 启动流管道
  START_STREAM_PIPE = "start_stream_pipe",
  // 推送流数据
  PUSH_STREAM_CHUNK = "push_stream_chunk",
  // 停止流管道
  STOP_STREAM_PIPE = "stop_stream_pipe"
}

/** pinia存储的名称 */
export enum StoresEnum {
  // 置顶
  ALWAYS_ON_TOP = "alwaysOnTop",
  // 全局
  GLOBAL = "global",
  // 引导
  GUIDE = "guide",
  // 用户
  USER = "user",
  // 设置
  SETTING = "setting",
  // 弹幕
  DANMAKU = "danmaku",
  // 视频
  VIDEO = "video",
  // 图片查看器
  IMAGE_VIEWER = "imageViewer",
  // 视频查看器
  VIDEO_VIEWER = "videoViewer"
}

/** 本地存储的key */
export enum StorageKeyEnum {
  DEVICE_ID = "deviceID",
  DEVICE_FINGERPRINT = "deviceFingerprint",
  PROXY_SETTINGS = "proxySettings",
  SETTING = "setting",
  SEARCH_HISTORY = "searchHistory"
}

/** WebSocket 响应消息类型 */
export enum WsResponseMessageEnum {
  REMOTE_LOGIN = "remoteLogin"
}
