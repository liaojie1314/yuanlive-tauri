pub mod command;
mod configuration;
mod error;
mod request_client;
mod tray;

use crate::configuration::{get_configuration, BackendSettings};
use crate::error::CommonError;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::async_runtime::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_fs::FsExt;

#[derive(Debug)]
pub struct AppData {
    user_info: Arc<Mutex<UserInfo>>,
    pub rc: Arc<Mutex<request_client::RequestClient>>,
    pub config: Arc<Mutex<BackendSettings>>,
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
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
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

// 功能 setup 函数
fn common_setup(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let scope = app_handle.fs_scope();
    scope.allow_directory("configuration", false)?;

    match tauri::async_runtime::block_on(initialize_app_data(app_handle.clone())) {
        Ok((user_info, rc, settings)) => {
            // 使用 manage 方法在运行时添加状态
            app_handle.manage(AppData {
                rc,
                user_info: user_info.clone(),
                config: settings,
            });
            APP_STATE_READY.store(true, Ordering::SeqCst);
            if let Err(e) = app_handle.emit("app-state-ready", ()) {
                tracing::warn!("Failed to emit app-state-ready event: {}", e);
            }
        }
        Err(e) => {
            tracing::error!("Failed to initialize application data: {}", e);
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
    use crate::command::ai_command::ai_message_send_stream;
    use crate::command::app_state_command::is_app_state_ready;
    use crate::command::request_command::{login_command, request_command};
    use crate::command::token_command::remove_token;
    tauri::generate_handler![
        is_app_state_ready,
        remove_token,
        ai_message_send_stream,
        login_command,
        request_command
    ]
}
