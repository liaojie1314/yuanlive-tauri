use serde::Serialize;

/// Windows文本缩放信息结构体
#[cfg(target_os = "windows")]
#[derive(Serialize)]
pub struct WindowsScaleInfo {
    // 系统DPI
    pub system_dpi: u32,
    // 系统缩放比例
    pub system_scale: f64,
    // 文本缩放比例
    pub text_scale: f64,
    // 是否检测到文本缩放
    pub has_text_scaling: bool,
}

/// 获取Windows系统和文本缩放信息
#[tauri::command]
#[cfg(target_os = "windows")]
pub fn get_windows_scale_info() -> Result<WindowsScaleInfo, String> {
    use windows::Win32::UI::HiDpi::GetDpiForSystem;

    unsafe {
        // 获取系统DPI
        let system_dpi = GetDpiForSystem();
        let standard_dpi = 96.0; // Windows标准DPI
        let system_scale = system_dpi as f64 / standard_dpi;

        // 从注册表读取文本缩放设置
        let text_scale = get_text_scale_from_registry().unwrap_or(1.0);

        // 检测是否存在文本缩放 (容差为1%)
        let has_text_scaling = (text_scale - 1.0).abs() > 0.01;

        Ok(WindowsScaleInfo {
            system_dpi,
            system_scale,
            text_scale,
            has_text_scaling,
        })
    }
}

/// 从Windows注册表读取文本缩放设置
#[cfg(target_os = "windows")]
unsafe fn get_text_scale_from_registry() -> Result<f64, String> {
    use windows::core::w;
    use windows::Win32::System::Registry::{
        RegCloseKey, RegOpenKeyExW, RegQueryValueExW, HKEY, HKEY_CURRENT_USER, KEY_READ, REG_DWORD,
    };

    // 尝试多个可能的注册表位置
    let registry_paths = [
        w!("Control Panel\\Desktop\\WindowMetrics"),
        w!("Software\\Microsoft\\Accessibility"),
        w!("Control Panel\\Desktop"),
    ];

    let value_names = [
        w!("TextScaleFactor"),
        w!("TextScaleFactor"),
        w!("LogPixels"),
    ];

    for (i, &subkey) in registry_paths.iter().enumerate() {
        let mut hkey: HKEY = HKEY::default();
        let result =
            unsafe { RegOpenKeyExW(HKEY_CURRENT_USER, subkey, Some(0), KEY_READ, &mut hkey) };

        if result.is_ok() {
            let value_name = value_names[i];
            let mut data: u32 = 0;
            let mut data_size = std::mem::size_of::<u32>() as u32;
            let mut value_type = REG_DWORD;

            let result = unsafe {
                RegQueryValueExW(
                    hkey,
                    value_name,
                    None,
                    Some(&mut value_type),
                    Some(&mut data as *mut u32 as *mut u8),
                    Some(&mut data_size),
                )
            };

            let _ = unsafe { RegCloseKey(hkey) };

            if result.is_ok() && value_type == REG_DWORD && data > 0 {
                if i == 2 {
                    // LogPixels 是DPI值，需要特殊处理
                    return Ok(1.0); // LogPixels不是文本缩放，返回默认值
                } else {
                    // TextScaleFactor 是百分比值 (100 = 100%, 150 = 150%)
                    return Ok(data as f64 / 100.0);
                }
            }
        }
    }
    Ok(1.0)
}
