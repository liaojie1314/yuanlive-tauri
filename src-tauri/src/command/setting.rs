use crate::configuration::BackendSettings;
use crate::utils::config_store::save_config;
use crate::AppData;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tracing::info;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingsReq {
    base_url: String,
    ws_url: String,
}

/// 获取设置
#[tauri::command]
pub async fn get_settings(state: State<'_, AppData>) -> Result<BackendSettings, String> {
    Ok(state.config.lock().await.clone())
}

/// 更新设置
#[tauri::command]
pub async fn update_settings(
    state: State<'_, AppData>,
    settings: UpdateSettingsReq,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut config = state.config.lock().await;
    config.base_url = settings.base_url.clone();
    config.ws_url = settings.ws_url.clone();
    info!("updated settings: {:?}", config);
    if let Err(e) = save_config(&app_handle, &config) {
        tracing::error!("Failed to save config to disk: {}", e);
    }
    state
        .rc
        .lock()
        .await
        .set_base_url(settings.base_url.clone());
    Ok(())
}
