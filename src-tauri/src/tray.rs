#[cfg(target_os = "windows")]
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, PhysicalPosition, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    #[cfg(not(target_os = "macos"))]
    {
        let default_icon = match app.default_window_icon() {
            Some(icon) => icon.clone(),
            None => {
                tracing::error!("Default window icon not found");
                return Err(tauri::Error::Io(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "未找到默认窗口图标",
                )));
            }
        };

        let _ = TrayIconBuilder::with_id("tray")
            .tooltip("YuanLive")
            .icon(default_icon)
            .on_tray_icon_event(|tray, event| match event {
                TrayIconEvent::Click {
                    id: _,
                    position,
                    rect: _,
                    button,
                    button_state,
                } => match button {
                    MouseButton::Left => {
                        let windows = tray.app_handle().webview_windows();
                        for (name, window) in windows {
                            if name == "login" || name == "home" {
                                if let Err(e) = window.show() {
                                    tracing::warn!("Failed to show window {}: {}", name, e);
                                }
                                if let Err(e) = window.unminimize() {
                                    tracing::warn!("Failed to unminimize window {}: {}", name, e);
                                }
                                if let Err(e) = window.set_focus() {
                                    tracing::warn!("Failed to set focus on window {}: {}", name, e);
                                }
                                break;
                            }
                        }
                    }
                    MouseButton::Right if MouseButtonState::Down == button_state => {
                        // 状态栏图标按下右键时显示状态栏菜单
                        if let Some(tray_window) = tray.app_handle().get_webview_window("tray") {
                            if let Ok(outer_size) = tray_window.outer_size() {
                                if let Err(e) = tray_window.set_position(PhysicalPosition::new(
                                    position.x,
                                    position.y - outer_size.height as f64,
                                )) {
                                    tracing::warn!("Failed to set tray window position: {}", e);
                                    return;
                                }
                                let _ = tray_window.set_always_on_top(true);
                                let _ = tray_window.show();
                                let _ = tray_window.set_focus();
                            }
                        } else {
                            tracing::warn!("Tray window not found");
                        }
                    }
                    _ => {}
                },
                #[cfg(target_os = "windows")]
                TrayIconEvent::Enter {
                    id: _,
                    position: _,
                    rect: _,
                } => {
                    if let Ok(rect) = tray.rect() {
                        match tray.app_handle().emit_to("notify", "notify_enter", &rect) {
                            Ok(_) => {
                                tracing::info!("notify_enter event sent successfully");
                            }
                            Err(e) => {
                                tracing::warn!("Failed to emit notify_enter event: {}", e);
                            }
                        }
                    } else {
                        tracing::warn!("Failed to get tray rect");
                    }
                }
                #[cfg(target_os = "windows")]
                TrayIconEvent::Leave {
                    id: _,
                    position: _,
                    rect: _,
                } => {
                    if let Err(e) = tray.app_handle().emit_to("notify", "notify_leave", ()) {
                        tracing::warn!("Failed to emit notify_leave event: {}", e);
                    }
                }
                _ => {}
            })
            .build(app);
    }
    Ok(())
}
