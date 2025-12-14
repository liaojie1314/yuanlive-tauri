use tauri::plugin::TauriPlugin;
use tauri::{Manager, Runtime, WindowEvent};
use tauri_plugin_log::fern::colors::{Color, ColoredLevelConfig};
use tauri_plugin_log::{Target, TargetKind};
use tracing::warn;

pub trait CustomInit {
    fn init_plugin(self) -> Self;
    fn init_window_event(self) -> Self;
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

    fn init_window_event(self) -> Self {
        self.on_window_event(|window, event| match event {
            WindowEvent::Focused(flag) => {
                // 自定义系统托盘-实现托盘菜单失去焦点时隐藏
                #[cfg(not(target_os = "macos"))]
                if !window.label().eq("tray") && *flag {
                    if let Some(tray_window) = window.app_handle().get_webview_window("tray") {
                        let _ = tray_window.hide();
                    }
                }
                if window.label().eq("tray") && !flag {
                    if let Err(e) = window.hide() {
                        warn!("Failed to hide tray window: {}", e);
                    }
                }
            }
            WindowEvent::CloseRequested { .. } => {
                let app_handle = window.app_handle();
                let windows = app_handle.webview_windows();
                let win_label = window.label();
                // 如果是login窗口被用户关闭，直接退出程序
                if win_label.eq("login") {
                    // 检查是否有其他窗口存在，如果有home窗口，说明是登录成功后的正常关闭
                    let has_home = windows
                        .iter()
                        .any(|(name, _)| matches!(name.as_str(), "home"));

                    if !has_home {
                        // 没有home窗口，说明是用户直接关闭login窗口，退出程序
                        window.app_handle().exit(0);
                    }
                    // 如果有home窗口，说明是登录成功后的正常关闭，允许关闭
                }
            }
            _ => (),
        })
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
