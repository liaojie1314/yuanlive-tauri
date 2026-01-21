use crate::FfmpegState;
use std::io::Write;
use std::process::{Command, Stdio};
use tauri::State;

/// 检测Ffmpeg是否存在
#[tauri::command]
pub fn check_ffmpeg_installed() -> bool {
    // 通过ffmpeg --version测试
    match Command::new("ffmpeg").arg("--version").output() {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

/// Ffmpeg 推流
#[tauri::command]
pub fn start_stream_pipe(
    room_id: String,
    token: String,
    state: State<FfmpegState>,
) -> Result<String, String> {
    let mut child_guard = state.child.lock().unwrap();
    if child_guard.is_some() {
        return Ok("Already streaming".into());
    }
    // 拼接带 Token 的 RTMP 地址
    let rtmp_url = format!("rtmp://localhost/live/{}?token={}", room_id, token);
    println!("Ffmpeg Mode: Pushing to {}", rtmp_url);
    let child = Command::new("ffmpeg")
        .args(&[
            "-f",
            "webm",
            "-i",
            "-",
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-tune",
            "zerolatency",
            "-c:a",
            "aac",
            "-f",
            "flv",
            &rtmp_url,
        ])
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Start Ffmpeg failed: {}", e))?;
    *child_guard = Some(child);
    Ok("Stream started".into())
}

/// 接收前端切片数据并写入管道
#[tauri::command]
pub fn push_stream_chunk(data: Vec<u8>, state: State<FfmpegState>) -> Result<(), String> {
    let mut child_guard = state.child.lock().unwrap();
    if let Some(child) = child_guard.as_mut() {
        if let Some(stdin) = child.stdin.as_mut() {
            // 写入数据
            if let Err(e) = stdin.write_all(&data) {
                return Err(format!("写入管道失败: {}", e));
            }
            return Ok(());
        }
    }
    Err("Ffmpeg process not running".into())
}

// 停止推流
#[tauri::command]
pub fn stop_stream_pipe(state: State<FfmpegState>) -> Result<(), String> {
    let mut child_guard = state.child.lock().unwrap();
    if let Some(mut child) = child_guard.take() {
        let _ = child.kill(); // 强制结束进程
    }
    Ok(())
}
