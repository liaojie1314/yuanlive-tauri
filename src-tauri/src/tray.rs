#[cfg(target_os = "windows")]
use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition, Runtime,
};

#[cfg(target_os = "linux")]
use tauri::{
    menu::{MenuBuilder, MenuId, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
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
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        // 为linux创建原生菜单
        let open_id = MenuId::new("open_home");
        let exit_id = MenuId::new("exit_app");

        // 创建分隔符和菜单项
        let open_menu_item =
            MenuItem::with_id(app, open_id.clone(), "打开主窗口", true, None::<&str>)?;
        let separator = PredefinedMenuItem::separator(app)?;
        let exit_menu_item = MenuItem::with_id(app, exit_id.clone(), "退出", true, None::<&str>)?;
        // 构建菜单
        let tray_menu = MenuBuilder::new(app)
            .items(&[&open_menu_item, &separator, &exit_menu_item])
            .build()?;

        let tray_handler = app.clone();

        let _ = TrayIconBuilder::with_id("tray")
            .tooltip("YuanLive")
            .icon(default_icon)
            .menu(&tray_menu) // 直接设置菜单，让系统处理右键显示
            .on_menu_event(move |app, event| {
                let id = event.id();
                if id == &open_id {
                    // 打开主面板
                    let windows = app.webview_windows();

                    // 优先显示已存在的home窗口
                    for (name, window) in windows {
                        if name == "home" {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                            break;
                        }
                    }
                } else if id == &exit_id {
                    // 退出应用
                    let _ = tray_handler.exit(0);
                }
            })
            .build(app)?;
    }
    #[cfg(target_os = "windows")]
    {
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
                _ => {}
            })
            .build(app);
    }
    Ok(())
}
