pub mod command;
mod configuration;
#[cfg(desktop)]
pub mod desktop;
mod error;
mod init;
#[cfg(mobile)]
mod mobile;
mod request_client;
#[cfg(desktop)]
mod tray;
pub mod utils;
pub mod websocket;
mod webview_helper;

use crate::configuration::{get_configuration, BackendSettings};
use crate::error::CommonError;
use crate::init::CustomInit;
use crate::utils::config_store::load_config;
use crate::utils::user_store::load_user_info;
#[cfg(mobile)]
use mobile::splash;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::{thread, time::Duration};
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Listener, Manager};
use tauri_plugin_fs::FsExt;
use tauri_plugin_shell::process::CommandChild;
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
    child: std::sync::Mutex<Option<CommandChild>>,
}

pub struct McpState {
    child: std::sync::Mutex<Option<CommandChild>>,
}

#[cfg(target_os = "windows")]
pub struct AudioStreamWrapper(pub cpal::Stream);
#[cfg(target_os = "windows")]
unsafe impl Send for AudioStreamWrapper {}
#[cfg(target_os = "windows")]
unsafe impl Sync for AudioStreamWrapper {}

#[cfg(target_os = "windows")]
pub struct AudioState(pub std::sync::Mutex<Option<AudioStreamWrapper>>);

#[cfg(not(target_os = "windows"))]
pub struct AudioState(pub std::sync::Mutex<Option<()>>);

pub(crate) static APP_STATE_READY: AtomicBool = AtomicBool::new(false);

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub uid: String,
    pub token: String,
    pub refresh_token: String,
}

pub fn run() {
    #[cfg(desktop)]
    {
        if let Err(e) = setup_desktop() {
            tracing::error!("Failed to setup desktop application: {}", e);
            std::process::exit(1);
        }
    }
    #[cfg(mobile)]
    {
        setup_mobile();
    }
}

#[cfg(desktop)]
fn setup_desktop() -> Result<(), CommonError> {
    use device_query::{DeviceQuery, DeviceState};
    tauri::Builder::default()
        .register_uri_scheme_protocol("plugin", |app, request| {
            let uri_path = request.uri().path();
            let data_dir = app.app_handle().path().app_local_data_dir().unwrap();
            let plugins_dir = data_dir.join("plugins");
            let asset_path = plugins_dir.join(&uri_path[1..]);
            match std::fs::read(&asset_path) {
                Ok(content) => {
                    let mime_type = match asset_path
                        .extension()
                        .and_then(|e: &std::ffi::OsStr| e.to_str())
                    {
                        Some("html") => "text/html",
                        Some("js") | Some("mjs") => "application/javascript",
                        Some("css") => "text/css",
                        Some("png") => "image/png",
                        Some("jpg") | Some("jpeg") => "image/jpeg",
                        Some("json") => "application/json",
                        _ => "application/octet-stream",
                    };
                    tauri::http::Response::builder()
                        .header("Access-Control-Allow-Origin", "*")
                        .header("Content-Type", mime_type)
                        .body(content)
                        .unwrap()
                }
                Err(_) => {
                    println!("插件资源加载失败 (404): {:?}", asset_path);
                    tauri::http::Response::builder()
                        .status(404)
                        .body(Vec::new())
                        .unwrap()
                }
            }
        })
        .init_plugin()
        .init_window_event()
        .setup(move |app| {
            common_setup(app.handle().clone())?;
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                let device_state = DeviceState::new();
                let mut last_pos = (0, 0);
                loop {
                    let mouse = device_state.get_mouse();
                    if mouse.coords != last_pos {
                        last_pos = mouse.coords;
                        // 发送坐标给前端。忽略报错，因为应用退出时 channel 会断开
                        let _ = app_handle.emit("global-mouse-move", [last_pos.0, last_pos.1]);
                    }
                    // 约 60FPS 的刷新率
                    thread::sleep(Duration::from_millis(16));
                }
            });
            Ok(())
        })
        .invoke_handler(get_invoke_handlers())
        .build(tauri::generate_context!())
        .map_err(|e| {
            CommonError::RequestError(format!("Failed to build tauri application: {}", e))
        })?
        .run(|app_handle, event| {
            #[cfg(target_os = "macos")]
            app_event::handle_app_event(&app_handle, event);
            #[cfg(not(target_os = "macos"))]
            {
                let _ = (app_handle, event);
            }
        });
    Ok(())
}

#[cfg(mobile)]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn setup_mobile() {
    splash::show();

    if let Err(e) = tauri::Builder::default()
        .init_plugin()
        .setup(move |app| {
            let app_handle = app.handle().clone();
            #[cfg(target_os = "ios")]
            {
                if let Some(webview_window) = app_handle.get_webview_window("mobile-home") {
                    webview_helper::initialize_keyboard_adjustment(&webview_window);
                } else {
                    tracing::warn!("Mobile home webview window not found during setup");
                }
            }
            common_setup(app_handle)?;
            tracing::info!("Mobile application setup completed successfully");
            Ok(())
        })
        .invoke_handler(get_invoke_handlers())
        .run(tauri::generate_context!())
    {
        tracing::log::error!("Failed to run mobile application: {}", e);
        std::process::exit(1);
    }
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
    // 获取底层默认配置
    let default_config = get_configuration(&app_handle)
        .map_err(|e| anyhow::anyhow!("Failed to load configuration: {}", e))?;
    // 尝试加载用户个人的配置覆盖它
    let final_config = load_config(&app_handle, default_config);
    // 将最终的配置存入全局状态
    let configuration = Arc::new(Mutex::new(final_config.clone()));
    // 初始化网络客户端
    let mut rc = request_client::RequestClient::new(final_config.base_url.clone())?;

    let loaded_user_info = load_user_info(&app_handle);

    if !loaded_user_info.token.is_empty() {
        rc.token = Some(loaded_user_info.token.clone());
        rc.refresh_token = Some(loaded_user_info.refresh_token.clone());
    }

    let user_info = Arc::new(Mutex::new(loaded_user_info));

    Ok((user_info, Arc::new(Mutex::new(rc)), configuration))
}

/// 处理退出登录时的窗口管理逻辑
///
/// 该函数会：
/// - 关闭除 login/tray 外的大部分窗口
/// - 隐藏但保留 capture/checkUpdate 窗口
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
            "capture" | "checkUpdate" | "live2d" => {
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
            app_handle.manage(McpState {
                child: std::sync::Mutex::new(None),
            });
            app_handle.manage(AudioState(std::sync::Mutex::new(None)));
            crate::command::telemetry::init(&app_handle);
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
    use crate::command::ai::{ai_message_cancel_stream, ai_message_send_stream};
    use crate::command::app_state::is_app_state_ready;
    use crate::command::fs::{
        fs_create_dir, fs_get_file_info, fs_list_dir, fs_move_file, fs_read_file,
        fs_read_file_lines, fs_search_file, fs_write_file, get_files_meta,
    };
    use crate::command::plugin::{download_plugin, uninstall_plugin};
    use crate::command::reader::{fetch_html_source, parse_comic_directory, scan_comic_library};
    use crate::command::request::{login_command, request_command};
    use crate::command::setting::{get_settings, update_settings};
    use crate::command::telemetry::track_event;
    use crate::command::token::{get_token, remove_token, update_token};
    use crate::command::tts::{
        check_file_exists, download_model_file, generate_piper_speech, get_models_dir,
    };
    use crate::command::upload::{
        check_uploaded_chunks_command, merge_chunks_command, upload_chunk_by_path_command,
        upload_chunk_bytes_command,
    };
    #[cfg(windows)]
    use crate::desktop::windows_mcp::{send_to_mcp, start_mcp};
    #[cfg(target_os = "ios")]
    use crate::mobile::keyboard::set_webview_keyboard_adjustment;
    #[cfg(mobile)]
    use crate::mobile::splash::hide_splash_screen;
    use crate::websocket::commands::{
        ws_disconnect, ws_force_reconnect, ws_get_state, ws_init_connection, ws_is_connected,
        ws_send_message,
    };
    #[cfg(desktop)]
    use desktop::cmd::set_height;
    #[cfg(desktop)]
    use desktop::cmd::{
        agent_mouse_action, agent_type_text, convert_file, screenshot, toggle_system_audio_listen,
    };
    #[cfg(desktop)]
    use desktop::directory_scanner::{
        cancel_directory_scan, get_directory_usage_info_with_progress,
    };
    #[cfg(windows)]
    use desktop::live_stream::{
        check_ffmpeg_installed, push_stream_chunk, start_stream_pipe, stop_stream_pipe,
    };
    #[cfg(desktop)]
    use desktop::tts::speak_system;
    #[cfg(desktop)]
    use desktop::video_cover::extract_video_cover;
    #[cfg(desktop)]
    use desktop::window_payload::{get_window_payload, push_window_payload};

    tauri::generate_handler![
        is_app_state_ready,
        get_settings,
        update_settings,
        get_token,
        remove_token,
        update_token,
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
        // 模型相关
        get_models_dir,
        download_model_file,
        check_file_exists,
        generate_piper_speech,
        // websocket
        ws_init_connection,
        ws_disconnect,
        ws_force_reconnect,
        ws_send_message,
        ws_is_connected,
        ws_get_state,
        // MCP 相关
        #[cfg(windows)]
        start_mcp,
        #[cfg(windows)]
        send_to_mcp,
        // fs-mcp
        fs_read_file_lines,
        fs_search_file,
        fs_read_file,
        fs_write_file,
        fs_list_dir,
        fs_create_dir,
        fs_move_file,
        fs_get_file_info,
        #[cfg(desktop)]
        push_window_payload,
        #[cfg(desktop)]
        get_window_payload,
        #[cfg(desktop)]
        screenshot,
        #[cfg(desktop)]
        set_height,
        uninstall_plugin,
        download_plugin,
        // 漫画目录解析
        parse_comic_directory,
        scan_comic_library,
        fetch_html_source,
        #[cfg(desktop)]
        toggle_system_audio_listen,
        #[cfg(desktop)]
        convert_file,
        #[cfg(desktop)]
        agent_mouse_action,
        #[cfg(desktop)]
        agent_type_text,
        #[cfg(windows)]
        check_ffmpeg_installed,
        #[cfg(windows)]
        start_stream_pipe,
        #[cfg(windows)]
        stop_stream_pipe,
        #[cfg(windows)]
        push_stream_chunk,
        #[cfg(desktop)]
        get_directory_usage_info_with_progress,
        #[cfg(desktop)]
        cancel_directory_scan,
        #[cfg(desktop)]
        speak_system,
        #[cfg(desktop)]
        extract_video_cover,
        #[cfg(mobile)]
        hide_splash_screen,
        #[cfg(target_os = "ios")]
        set_webview_keyboard_adjustment,
        track_event,
    ]
}
