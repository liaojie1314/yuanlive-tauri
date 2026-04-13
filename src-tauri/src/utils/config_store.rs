use crate::configuration::BackendSettings;
use std::path::PathBuf;
use tauri::Manager;

/// 获取配置文件的本地存储路径
pub fn get_config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_local_data_dir()
        .map(|dir| dir.join("app_config.json"))
        .map_err(|e| e.to_string())
}

/// 将配置保存到本地磁盘
pub fn save_config(app_handle: &tauri::AppHandle, config: &BackendSettings) -> Result<(), String> {
    let path = get_config_path(app_handle)?;
    // 确保父目录存在
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    // 使用 to_string_pretty 让生成的 json 文件格式化，方便调试查看
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

/// 从本地磁盘加载配置，如果失败或不存在，则返回默认配置
pub fn load_config(
    app_handle: &tauri::AppHandle,
    default_config: BackendSettings,
) -> BackendSettings {
    if let Ok(path) = get_config_path(app_handle) {
        if let Ok(content) = std::fs::read_to_string(path) {
            if let Ok(config) = serde_json::from_str::<BackendSettings>(&content) {
                tracing::info!("Loaded local app_config.json");
                return config;
            }
        }
    }
    tracing::info!("Using default configuration");
    default_config
}
