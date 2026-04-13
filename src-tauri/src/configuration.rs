use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// 后端服务配置设置
#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BackendSettings {
    #[serde(alias = "base_url")]
    pub base_url: String,
    #[serde(alias = "ws_url")]
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
    #[cfg(target_os = "android")]
    {
        let _ = app_handle;
        // 读取 base.yaml 内容
        let base_content = std::str::from_utf8(include_bytes!("../configuration/base.yaml"))
            .map_err(|e| config::ConfigError::Message(e.to_string()))?;

        // 构建 base 配置对象
        let base_config = config::Config::builder()
            .add_source(config::File::from_str(
                base_content,
                config::FileFormat::Yaml,
            ))
            .build()?;

        // 获取 active_config 字段
        let active_config = base_config.get_string("active_config").map_err(|_| {
            config::ConfigError::Message(
                "Missing or invalid 'active_config' in base.yaml".to_string(),
            )
        })?;

        // 校验 active_config 合法性
        if active_config != "local" && active_config != "production" {
            return Err(config::ConfigError::Message(
                "Only \"local\" or \"production\" can be specified in active_config".to_string(),
            ));
        }

        // 加载对应的配置文件内容
        let config_file_bytes: &[u8] = match active_config.as_str() {
            "local" => include_bytes!("../configuration/local.yaml").as_ref(),
            "production" => include_bytes!("../configuration/production.yaml").as_ref(),
            _ => return Err(config::ConfigError::Message("Invalid active_config".into())), // 这里可以支持更多的环境配置
        };

        let active_content = std::str::from_utf8(config_file_bytes)
            .map_err(|e| config::ConfigError::Message(e.to_string()))?;

        // 构建最终配置对象
        config::Config::builder()
            .add_source(config::File::from_str(
                base_content,
                config::FileFormat::Yaml,
            ))
            .add_source(config::File::from_str(
                active_content,
                config::FileFormat::Yaml,
            ))
            .add_source(
                config::Environment::with_prefix("APP")
                    .prefix_separator("_")
                    .separator("__"),
            )
            .build()?
            .try_deserialize::<BackendSettings>()
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
    #[cfg(target_os = "android")]
    let base_config = {
        let content = std::str::from_utf8(include_bytes!("../configuration/base.yaml"))
            .map_err(|e| config::ConfigError::Message(e.to_string()))?;

        config::Config::builder()
            .add_source(config::File::from_str(content, config::FileFormat::Yaml))
            .build()?
    };
    let active_config = base_config.get_string("active_config")?;
    println!("active_config: {:?}", active_config);
    let active_config_path_buf = dir.clone().join(active_config);
    Ok((base_path, active_config_path_buf))
}
