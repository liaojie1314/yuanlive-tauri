use tauri::plugin::TauriPlugin;
use tauri::Runtime;
use tauri_plugin_log::fern::colors::{Color, ColoredLevelConfig};
use tauri_plugin_log::{Target, TargetKind};

pub trait CustomInit {
    fn init_plugin(self) -> Self;
}

impl<R: Runtime> CustomInit for tauri::Builder<R> {
    fn init_plugin(self) -> Self {
        let builder = self
            .plugin(tauri_plugin_process::init())
            .plugin(tauri_plugin_os::init())
            .plugin(tauri_plugin_fs::init())
            .plugin(tauri_plugin_http::init())
            .plugin(tauri_plugin_opener::init());
        // 添加日志插件
        builder.plugin(build_log_plugin())
    }
}

/// 构建平台特定的日志插件
fn build_log_plugin<R: Runtime>() -> TauriPlugin<R> {
    let builder = tauri_plugin_log::Builder::new()
        .level(tracing::log::LevelFilter::Info)
        .level_for("tao", tracing::log::LevelFilter::Warn)
        .level_for("wry", tracing::log::LevelFilter::Warn)
        .level_for("tauri", tracing::log::LevelFilter::Warn)
        .level_for("tauri::manager", tracing::log::LevelFilter::Warn)
        .level_for("tauri::event", tracing::log::LevelFilter::Warn)
        .level_for("tauri::plugin", tracing::log::LevelFilter::Warn)
        .level_for("tauri::ipc", tracing::log::LevelFilter::Warn)
        .level_for("tracing::span", tracing::log::LevelFilter::Warn)
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Webview),
            Target::new(TargetKind::LogDir {
                file_name: Some("logs".to_string()),
            }),
        ])
        .with_colors(ColoredLevelConfig {
            error: Color::Red,
            warn: Color::Yellow,
            debug: Color::White,
            info: Color::Green,
            trace: Color::White,
        });
    builder.build()
}
