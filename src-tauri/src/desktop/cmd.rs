#![allow(unexpected_cfgs)]
use base64::{engine::general_purpose, Engine as _};
use screenshots::Screen;

#[tauri::command]
pub fn screenshot(x: &str, y: &str, width: &str, height: &str) -> Result<String, String> {
    let screen = Screen::from_point(100, 100).map_err(|e| format!("获取屏幕信息失败: {}", e))?;

    let x = x
        .parse::<i32>()
        .map_err(|_| "无效的 x 坐标参数".to_string())?;
    let y = y
        .parse::<i32>()
        .map_err(|_| "无效的 y 坐标参数".to_string())?;
    let width = width
        .parse::<u32>()
        .map_err(|_| "无效的宽度参数".to_string())?;
    let height = height
        .parse::<u32>()
        .map_err(|_| "无效的高度参数".to_string())?;

    let image = screen
        .capture_area(x, y, width, height)
        .map_err(|e| format!("截图失败: {}", e))?;

    let buffer = image.as_raw();
    let base64_str = general_purpose::STANDARD_NO_PAD.encode(buffer);
    Ok(base64_str)
}
