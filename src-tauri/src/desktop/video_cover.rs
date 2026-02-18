use base64::{engine::general_purpose, Engine as _};
use tauri_plugin_shell::ShellExt;

/// 提取视频封面 (支持指定任意秒数)
#[tauri::command]
pub async fn extract_video_cover(
    app: tauri::AppHandle,
    video_path: String,
    second: f64,
) -> Result<String, String> {
    let cmd = app.shell().sidecar("ffmpeg").map_err(|e| e.to_string())?;
    // 将 f64 秒数格式化为保留三位小数的字符串，例如 "1.500"
    let time_str = format!("{:.3}", second);
    // FFmpeg 参数解析
    let output = cmd
        .args([
            "-ss",
            &time_str,
            "-i",
            &video_path,
            "-vframes",
            "1",
            "-q:v",
            "2",
            "-f",
            "image2",
            "-c:v",
            "mjpeg",
            "pipe:1",
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let base64_str = general_purpose::STANDARD.encode(&output.stdout);
        Ok(format!("data:image/jpeg;base64,{}", base64_str))
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("FFmpeg failed: {}", err_msg))
    }
}
