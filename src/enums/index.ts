// 全局枚举文件

/** 上传场景 */
export enum UploadSceneEnum {
  /** 聊天 */
  CHAT = "chat",
  /** 头像 */
  AVATAR = "avatar",
  /** 视频封面 */
  VIDEO_COVER = "videoCover",
  /** 直播封面 */
  LIVE_COVER = "liveCover",
  /** 视频 */
  VIDEO = "video"
}

/** 事件key */
export enum MittEnum {
  /** 搜索 */
  SEARCH = "search",
  /** 填充消息输入框 */
  FILL_MESSAGE_INPUT = "fillMessageInput",
  /** 全局文件拖拽 */
  GLOBAL_FILES_DROP = "globalFilesDrop",
  /** 更新提示 */
  CHECK_UPDATE = "checkUpdate",
  /** 强制更新 */
  DO_UPDATE = "doUpdate",
  /** 上传视频弹窗状态 */
  TOGGLE_VIDEO_UPLOAD_MODAL = "toggleVideoUploadModal",
  /** 上传视频弹窗文件拖拽 */
  VIDEO_MODAL_FILE_DROP = "videoModalFileDrop"
}

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
  GET_USER_INFO = "getUserInfo",
  // 获取搜索结果
  GET_SEARCH_RESULT = "getSearchResult",
  // 获取5条热门搜索
  GET_HOT_SEARCH = "getHotSearch",
  // 推荐8条搜索内容（2条最推荐+6条推荐）
  GET_RECOMMEND_SEARCH = "getRecommendSearch",
  // 获取直播类别
  GET_LIVE_CATEGORY = "getLiveCategory",
  // 获取热门类别
  GET_HOT_CATEGORY = "getHotCategory",
  // 获取子类别
  GET_CHILD_CATEGORY = "getChildCategory",
  // 获取人气前5的直播列表
  GET_TOP_FIVE_LIVE = "getTopFiveLive",
  // 获取当前直播类别的所有直播列表
  GET_LIVE_LIST_BY_CATEGORY = "getLiveListByCategory",
  // 获取当前用户正在直播的关注列表
  GET_FOLLOWING_LIVE = "getFollowingLive",
  // 取消关注
  UNFOLLOW = "unfollow",
  // 获取用户关注列表
  GET_FOLLOWING = "getFollowing",
  // 获取关注的人的视频列表
  GET_VIDEO_LIST_BY_UID = "getVideoListByUid",
  // 视频推荐
  RECOMMEND_VIDEO = "recommendVideo",
  // 点赞视频
  LIKE_VIDEO = "likeVideo",
  // 取消点赞视频
  CANCEL_LIKE_VIDEO = "cancelLikeVideo",
  // 不喜欢视频
  UNLIKE_VIDEO = "unlikeVideo",
  // 生成登录二维码
  GENERATE_QR_CODE = "generateQRCode",
  // 检测二维码状态
  CHECK_QR_STATUS = "checkQRStatus",
  // 发送邮箱验证码
  GET_CODE = "getCode",
  // 获取AI历史会话
  GET_HISTORY_CONVERSATION = "getHistoryConversation",
  // 更新会话标题
  UPDATE_CONVERSATION_TITLE = "updateConversationTitle",
  // 固定会话
  PIN_CONVERSATION = "pinConversation",
  // 取消固定会话
  UNPIN_CONVERSATION = "unpinConversation",
  // 批量删除会话
  BATCH_DELETE_CONVERSATION = "batchDeleteConversation",
  // 删除所有会话
  DELETE_ALL_CONVERSATION = "deleteAllConversation",
  // 获取AI会话消息
  GET_CONVERSATION_MESSAGE = "getConversationMessage",
  // 获取3条AI推荐
  GET_AI_RECOMMENDATION = "getAiRecommendation",
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
  // 登录成功
  LOGIN_SUCCESS = "loginSuccess",
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
  UPLOAD_CHUNK_BYTES_COMMAND = "upload_chunk_bytes_command",
  UPLOAD_CHUNK_BY_PATH_COMMAND = "upload_chunk_by_path_command",
  // 检查已上传分片
  CHECK_UPLOADED_CHUNKS_COMMAND = "check_uploaded_chunks_command",
  // 合并分片
  MERGE_CHUNKS_COMMAND = "merge_chunks_command",
  // 更新 token
  UPDATE_TOKEN = "update_token",
  // 移除 token
  REMOVE_TOKEN = "remove_token",
  // 获取token
  GET_TOKEN = "get_token",
  // 更新设置
  UPDATE_SETTINGS = "update_settings",
  // 获取文件元数据
  GET_FILES_META = "get_files_meta",
  // 获取模型专属目录
  GET_MODELS_DIR = "get_models_dir",
  // 检查文件是否存在
  CHECK_FILE_EXISTS = "check_file_exists",
  // 边下载边推送进度
  DOWNLOAD_MODEL_FILE = "download_model_file",
  // 生成piper语音
  GENERATE_PIPER_SPEECH = "generate_piper_speech",
  // AI 消息流式发送
  AI_MESSAGE_SEND_STREAM = "ai_message_send_stream",
  // AI 取消流式消息
  AI_MESSAGE_CANCEL_STREAM = "ai_message_cancel_stream",
  // 初始化 ws
  WS_INIT_CONNECTION = "ws_init_connection",
  // 断开 ws
  WS_DISCONNECT = "ws_disconnect",
  // 强制重连
  WS_FORCE_RECONNECT = "ws_force_reconnect",
  // ws 是否连接
  WS_IS_CONNECTED = "ws_is_connected",
  // 发送消息
  WS_SEND_MESSAGE = "ws_send_message",
  // 解析漫画目录
  PARSE_COMIC_DIRECTORY = "parse_comic_directory",
  // 扫描漫画库
  SCAN_COMIC_LIBRARY = "scan_comic_library",
  // 获取在线漫画详情
  FETCH_HTML_SOURCE = "fetch_html_source",
  // 埋点事件
  TRACK_EVENT = "track_event",
  // 下载插件
  DOWNLOAD_PLUGIN = "download_plugin",
  // 卸载插件
  UNINSTALL_PLUGIN = "uninstall_plugin",
  /** desktop专属 */
  // 推送窗口数据
  PUSH_WINDOW_PAYLOAD = "push_window_payload",
  // 获取窗口数据
  GET_WINDOW_PAYLOAD = "get_window_payload",
  // 截图
  SCREENSHOT = "screenshot",
  // 设置窗口高度
  SET_HEIGHT = "set_height",
  // 获取目录占用信息
  GET_DIRECTORY_USAGE_INFO_WITH_PROGRESS = "get_directory_usage_info_with_progress",
  // 取消目录扫描
  CANCEL_DIRECTORY_SCAN = "cancel_directory_scan",
  // 系统tts发声
  SPEAK_SYSTEM = "speak_system",
  // 提取视频封面
  EXTRACT_VIDEO_COVER = "extract_video_cover",
  // 模拟鼠标移动并点击
  AGENT_MOUSE_ACTION = "agent_mouse_action",
  // 模拟键盘自动打字
  AGENT_TYPE_TEXT = "agent_type_text",
  // 转换文件
  CONVERT_FILE = "convert_file",
  /** windows专属 */
  // 检查ffmpeg是否安装
  CHECK_FFMPEG_INSTALLED = "check_ffmpeg_installed",
  // 启动流管道
  START_STREAM_PIPE = "start_stream_pipe",
  // 推送流数据
  PUSH_STREAM_CHUNK = "push_stream_chunk",
  // 停止流管道
  STOP_STREAM_PIPE = "stop_stream_pipe",
  // 启动 MCP
  START_MCP = "start_mcp",
  // 向 MCP 发送指令
  SEND_TO_MCP = "send_to_mcp",
  // 切换系统音内录
  TOGGLE_SYSTEM_AUDIO_LISTEN = "toggle_system_audio_listen",
  /** mobile 专属 */
  // 关闭splash
  HIDE_SPLASH_SCREEN = "hide_splash_screen",
  /** ios 专属 */
  SET_WEBVIEW_KEYBOARD_ADJUSTMENT = "set_webview_keyboard_adjustment"
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
  // 扫描器
  SCANNER = "scanner",
  // 弹幕
  DANMAKU = "danmaku",
  // 视频
  VIDEO = "video",
  // 礼物
  GIFT = "gift",
  // 播放列表
  PLAYLIST = "playlist",
  // AI
  AI = "ai",
  // agent
  AGENT = "agent",
  // 文件下载
  FILE_DOWNLOAD = "fileDownload",
  // 图片查看器
  IMAGE_VIEWER = "imageViewer",
  // 视频查看器
  VIDEO_VIEWER = "videoViewer",
  // 快捷键
  SHORTCUT = "shortcut",
  // 插件
  PLUGINS = "plugins",
  // 移动端
  MOBILE = "mobile"
}

/** 插件状态 */
export enum PluginEnum {
  /** 已内置 */
  BUILTIN,
  /** 已安装 */
  INSTALLED,
  /** 下载中 */
  DOWNLOADING,
  /** 未安装 */
  NOT_INSTALLED,
  /** 卸载中 */
  UNINSTALLING,
  /** 可更新 */
  CAN_UPDATE
}

/** 本地存储的key */
export enum StorageKeyEnum {
  DEVICE_ID = "deviceID",
  DEVICE_FINGERPRINT = "deviceFingerprint",
  PROXY_SETTINGS = "proxySettings",
  SETTING = "setting",
  SEARCH_HISTORY = "searchHistory",
  TARGET_SETTING_ROUTE = "targetSettingRoute"
}

/** WebSocket 响应消息类型 */
export enum WsResponseMessageEnum {
  /** 远程登录 */
  REMOTE_LOGIN = "remoteLogin"
}

/** MacOS键盘映射 */
export enum MacOsKeyEnum {
  "⌘" = "⌘",
  "⌥" = "⌥",
  "⇧" = "⇧",
  "^" = "^"
}

/** Windows键盘映射 */
export enum WinKeyEnum {
  CTRL = "Ctrl",
  WIN = "Win",
  ALT = "Alt",
  SHIFT = "Shift"
}
