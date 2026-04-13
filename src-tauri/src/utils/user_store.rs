use std::path::PathBuf;
use tauri::Manager;

use crate::UserInfo;

/// 获取 user_info 的本地存储路径
pub fn get_user_info_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_local_data_dir()
        .map(|dir| dir.join("user_info.json"))
        .map_err(|e| e.to_string())
}

/// 从本地磁盘加载 UserInfo
pub fn load_user_info(app_handle: &tauri::AppHandle) -> UserInfo {
    if let Ok(path) = get_user_info_path(app_handle) {
        if let Ok(content) = std::fs::read_to_string(path) {
            if let Ok(info) = serde_json::from_str::<UserInfo>(&content) {
                tracing::info!("Loaded local user_info for uid: {}", info.uid);
                return info;
            }
        }
    }
    // 如果没有文件或解析失败，返回默认空数据
    UserInfo {
        token: String::new(),
        refresh_token: String::new(),
        uid: String::new(),
    }
}

/// 将 UserInfo 保存到本地磁盘
pub fn save_user_info(app_handle: &tauri::AppHandle, user_info: &UserInfo) -> Result<(), String> {
    let path = get_user_info_path(app_handle)?;
    // 确保父目录存在
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string(user_info).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}
