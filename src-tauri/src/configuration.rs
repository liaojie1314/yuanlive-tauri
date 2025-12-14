use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// 后端服务配置设置
#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct BackendSettings {
    pub base_url: String,
    pub ws_url: String,
}

/// 获取应用程序配置
/// 根据APP_ENVIRONMENT环境变量确定运行环境，按优先级加载配置：
/// 1. 桌面开发环境：文件系统配置文件
/// 2. 其他环境：资源目录配置文件
/// 3. 回退：编译时嵌入的配置文件
///
/// # 参数
/// * `app_handle` - Tauri应用句柄
///
/// # 返回值
/// * `Ok(BackendSettings)` - 成功时返回配置设置
/// * `Err(config::ConfigError)` - 失败时返回配置错误
pub fn get_configuration(app_handle: &AppHandle) -> Result<BackendSettings, config::ConfigError> {
    #[cfg(not(target_os = "android"))]
    {
        let is_desktop_dev = cfg!(debug_assertions) && cfg!(desktop);

        let config_path_buf = get_config_path_buf(app_handle, is_desktop_dev)?;

        let settings = config::Config::builder()
            .add_source(config::File::from(config_path_buf.0))
            .add_source(config::File::from(config_path_buf.1))
            .add_source(
                config::Environment::with_prefix("APP")
                    .prefix_separator("_")
                    .separator("__"),
            )
            .build()?;

        settings.try_deserialize::<BackendSettings>()
    }
}

fn get_config_path_buf(
    app_handle: &AppHandle,
    is_desktop_dev: bool,
) -> Result<(PathBuf, PathBuf), config::ConfigError> {
    let dir = if is_desktop_dev {
        let base_path = std::env::current_dir().map_err(|e| {
            config::ConfigError::Message(format!("Failed to get current dir: {}", e))
        })?;

        base_path.join("configuration")
    } else {
        app_handle
            .path()
            .resource_dir()
            .map_err(|e| config::ConfigError::NotFound(format!("resource not find: {}", e)))?
            .join("configuration")
    };

    let base_path = dir.join("base.yaml");

    #[cfg(not(target_os = "android"))]
    let base_config = config::Config::builder()
        .add_source(config::File::from(base_path.clone()))
        .build()?;

    let active_config = base_config.get_string("active_config")?;
    println!("active_config: {:?}", active_config);
    let active_config_path_buf = dir.clone().join(active_config);
    Ok((base_path, active_config_path_buf))
}
