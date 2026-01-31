pub mod command;
mod configuration;
pub mod desktop;
mod error;
mod init;
mod request_client;
mod tray;
pub mod websocket;

use crate::configuration::{get_configuration, BackendSettings};
use crate::error::CommonError;
use crate::init::CustomInit;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Child;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Listener, Manager};
use tauri_plugin_fs::FsExt;
use tracing::{error, info, warn};

#[derive(Debug)]
pub struct AppData {
    pub user_info: Arc<Mutex<UserInfo>>,
    pub rc: Arc<Mutex<request_client::RequestClient>>,
    pub config: Arc<Mutex<BackendSettings>>,
    /// 记录正在进行的 AI 流式任务
    pub stream_tasks: Arc<Mutex<HashMap<String, tokio::task::JoinHandle<()>>>>,
}

/// Ffmpeg状态管理
pub struct FfmpegState {
    child: std::sync::Mutex<Option<Child>>,
}

pub(crate) static APP_STATE_READY: AtomicBool = AtomicBool::new(false);

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub uid: String,
    pub token: String,
    pub refresh_token: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .init_plugin()
        .init_window_event()
        .setup(move |app| {
            common_setup(app.handle().clone())?;
            Ok(())
        })
        .invoke_handler(get_invoke_handlers())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 异步初始化应用数据
async fn initialize_app_data(
    app_handle: AppHandle,
) -> Result<
    (
        Arc<Mutex<UserInfo>>,
        Arc<Mutex<request_client::RequestClient>>,
        Arc<Mutex<BackendSettings>>,
    ),
    CommonError,
> {
    // 加载配置
    let configuration =
        Arc::new(Mutex::new(get_configuration(&app_handle).map_err(|e| {
            anyhow::anyhow!("Failed to load configuration: {}", e)
        })?));

    let rc: request_client::RequestClient =
        request_client::RequestClient::new(configuration.lock().await.base_url.clone())?;

    // 创建用户信息
    let user_info = UserInfo {
        token: Default::default(),
        refresh_token: Default::default(),
        uid: Default::default(),
    };
    let user_info = Arc::new(Mutex::new(user_info));

    Ok((user_info, Arc::new(Mutex::new(rc)), configuration))
}

/// 处理退出登录时的窗口管理逻辑
///
/// 该函数会：
/// - 关闭除 login/tray 外的大部分窗口
/// - 隐藏但保留 capture 窗口
/// - 优雅地处理窗口关闭过程中的错误
#[cfg(desktop)]
pub async fn handle_logout_windows(app_handle: &AppHandle) {
    info!("[LOGOUT] Starting to close windows and preserve capture windows");
    let all_windows = app_handle.webview_windows();
    info!("[LOGOUT] Found {} windows", all_windows.len());
    // 收集需要关闭的窗口
    let mut windows_to_close = Vec::new();
    let mut windows_to_hide = Vec::new();

    for (label, window) in all_windows {
        match label.as_str() {
            // login 和 tray 窗口不处理
            "login" | "tray" => {
                info!("[LOGOUT] Skipping window: {}", label);
            }
            // 这些窗口只隐藏，不销毁
            "capture" => {
                info!("[LOGOUT] Marking window for preservation: {}", label);
                windows_to_hide.push((label, window));
            }
            // 其他窗口需要关闭
            _ => {
                info!("[LOGOUT] Marking window for closure: {}", label);
                windows_to_close.push((label, window));
            }
        }
    }

    // 先隐藏需要保持的窗口
    for (label, window) in windows_to_hide {
        info!("[LOGOUT] Hiding window (preserving): {}", label);
        if let Err(e) = window.hide() {
            warn!("[LOGOUT] Failed to hide window {}: {}", label, e);
        }
    }

    // 逐个关闭窗口，添加小延迟以避免并发关闭导致的错误
    for (label, window) in windows_to_close {
        info!("[LOGOUT] Closing window: {}", label);
        // 先隐藏窗口，减少用户感知的延迟
        let _ = window.hide();
        match window.destroy() {
            Ok(_) => {
                info!("[LOGOUT] Successfully closed window: {}", label);
            }
            Err(error) => {
                // 检查窗口是否还存在
                if app_handle.get_webview_window(&label).is_none() {
                    info!(
                        "[LOGOUT] Window {} no longer exists, skipping closure",
                        label
                    );
                } else {
                    warn!(
                        "[LOGOUT] Warning when closing window {}: {} (this is usually normal)",
                        label, error
                    );
                }
            }
        }
    }
    info!("[LOGOUT] Logout completed");
}

// 设置登出事件监听器
#[cfg(desktop)]
fn setup_logout_listener(app_handle: AppHandle) {
    let app_handle_clone = app_handle.clone();
    app_handle.listen("logout", move |_| {
        let app_handle = app_handle_clone.clone();
        tauri::async_runtime::spawn(async move {
            handle_logout_windows(&app_handle).await;
        });
    });
}

// 功能 setup 函数
fn common_setup(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let scope = app_handle.fs_scope();
    scope.allow_directory("configuration", false)?;

    #[cfg(desktop)]
    setup_logout_listener(app_handle.clone());

    match tauri::async_runtime::block_on(initialize_app_data(app_handle.clone())) {
        Ok((user_info, rc, settings)) => {
            // 使用 manage 方法在运行时添加状态
            app_handle.manage(AppData {
                rc,
                user_info: user_info.clone(),
                config: settings,
                stream_tasks: Arc::new(Mutex::new(HashMap::new())),
            });
            app_handle.manage(FfmpegState {
                child: std::sync::Mutex::new(None),
            });
            APP_STATE_READY.store(true, Ordering::SeqCst);
            if let Err(e) = app_handle.emit("app-state-ready", ()) {
                warn!("Failed to emit app-state-ready event: {}", e);
            }
        }
        Err(e) => {
            error!("Failed to initialize application data: {}", e);
            return Err(format!("Failed to initialize app data: {}", e).into());
        }
    }

    #[cfg(desktop)]
    tray::create_tray(&app_handle)?;
    Ok(())
}

// 公共的命令处理器函数
fn get_invoke_handlers() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync + 'static
{
    use crate::command::ai_command::{ai_message_cancel_stream, ai_message_send_stream};
    use crate::command::app_state_command::is_app_state_ready;
    use crate::command::file_command::get_files_meta;
    use crate::command::request_command::{login_command, request_command};
    use crate::command::setting_command::{get_settings, update_settings};
    use crate::command::token_command::remove_token;
    use crate::command::upload_command::{
        check_uploaded_chunks_command, merge_chunks_command, upload_chunk_by_path_command,
        upload_chunk_bytes_command,
    };
    use crate::websocket::commands::{
        ws_disconnect, ws_force_reconnect, ws_get_state, ws_init_connection, ws_is_connected,
        ws_send_message,
    };
    #[cfg(desktop)]
    use desktop::cmd::screenshot;
    #[cfg(desktop)]
    use desktop::live_stream::{
        check_ffmpeg_installed, push_stream_chunk, start_stream_pipe, stop_stream_pipe,
    };
    #[cfg(desktop)]
    use desktop::tts::speak_system;
    #[cfg(desktop)]
    use desktop::window_payload::{get_window_payload, push_window_payload};

    tauri::generate_handler![
        is_app_state_ready,
        get_settings,
        update_settings,
        remove_token,
        ai_message_send_stream,
        ai_message_cancel_stream,
        login_command,
        request_command,
        get_files_meta,
        // 文件上传相关
        upload_chunk_bytes_command,
        upload_chunk_by_path_command,
        check_uploaded_chunks_command,
        merge_chunks_command,
        // websocket
        ws_init_connection,
        ws_disconnect,
        ws_force_reconnect,
        ws_send_message,
        ws_is_connected,
        ws_get_state,
        #[cfg(desktop)]
        push_window_payload,
        #[cfg(desktop)]
        get_window_payload,
        #[cfg(desktop)]
        screenshot,
        #[cfg(desktop)]
        check_ffmpeg_installed,
        #[cfg(desktop)]
        start_stream_pipe,
        #[cfg(desktop)]
        stop_stream_pipe,
        #[cfg(desktop)]
        push_stream_chunk,
        #[cfg(desktop)]
        speak_system,
    ]
}
