use std::io::Cursor;
use tauri::Manager;

#[tauri::command]
pub async fn download_plugin(
    app: tauri::AppHandle,
    plugin_url: String,   // 插件的唯一标识，比如 "dynamic"
    download_url: String, // 真实的 ZIP 下载地址
) -> Result<serde_json::Value, String> {
    let data_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let plugins_dir = data_dir.join("plugins");
    let target_dir = plugins_dir.join(&plugin_url);
    std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| e.to_string())?;
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let target_dir_clone = target_dir.clone();
    tauri::async_runtime::spawn_blocking(move || -> Result<(), String> {
        let reader = Cursor::new(bytes);
        let mut archive = zip::ZipArchive::new(reader).map_err(|e| e.to_string())?;
        archive
            .extract(&target_dir_clone)
            .map_err(|e| e.to_string())?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())??;
    let manifest_path = target_dir.join("manifest.json");
    let manifest_str = std::fs::read_to_string(&manifest_path)
        .map_err(|_| "解压成功，但未找到 manifest.json 配置文件".to_string())?;
    let manifest: serde_json::Value =
        serde_json::from_str(&manifest_str).map_err(|e| e.to_string())?;

    Ok(manifest)
}

#[tauri::command]
pub async fn uninstall_plugin(app: tauri::AppHandle, plugin_url: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&format!("plugin_{}", plugin_url)) {
        window.close().unwrap();
    }
    let data_dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?;
    let target_dir = data_dir.join("plugins").join(&plugin_url);
    if target_dir.exists() {
        println!("正在物理删除插件目录: {:?}", target_dir);
        std::fs::remove_dir_all(target_dir).map_err(|e| format!("无法删除插件文件: {}", e))?;
    }

    Ok(())
}
