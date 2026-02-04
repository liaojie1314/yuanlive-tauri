#![allow(unexpected_cfgs)]
use base64::{engine::general_purpose, Engine as _};
use screenshots::image::{DynamicImage, ImageOutputFormat};
use screenshots::Screen;
use std::io::Cursor;

#[tauri::command]
pub fn screenshot(x: f64, y: f64) -> Result<String, String> {
    // 1. 根据坐标找到屏幕
    let screen =
        Screen::from_point(x as i32, y as i32).map_err(|e| format!("无法找到当前屏幕: {}", e))?;

    // 2. 截取全屏 (物理像素)
    let image = screen.capture().map_err(|e| format!("截图失败: {}", e))?;

    let dyn_image = DynamicImage::ImageRgba8(image);

    // 3. 转 PNG Base64 返回给前端
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);

    dyn_image
        .write_to(&mut cursor, ImageOutputFormat::Png)
        .map_err(|e| format!("PNG编码失败: {}", e))?;

    let base64_str = general_purpose::STANDARD.encode(buffer);
    Ok(base64_str)
}
