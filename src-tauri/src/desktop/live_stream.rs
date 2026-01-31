use crate::FfmpegState;
use std::io::Write;
use std::process::{Command, Stdio};
use tauri::State;
use tracing::info;

/// 检测Ffmpeg是否存在
#[tauri::command]
pub fn check_ffmpeg_installed() -> bool {
    // 通过ffmpeg --version测试
    match Command::new("ffmpeg").arg("-version").output() {
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
    // 拼接 RTMP 地址 (支持 SRS/Nginx-RTMP/Go2RTC)
    // 拼接带 Token 的 RTMP 地址
    let rtmp_url = format!("rtmp://localhost:1935/live/{}?token={}", room_id, token);
    info!("Ffmpeg Mode: Pushing to {}", rtmp_url);
    let child = Command::new("ffmpeg")
        .args(&[
            "-f",
            "webm", // 输入格式: WebM (浏览器 MediaRecorder 标准输出)
            "-i",
            "-", // 输入源: 标准输入 (Stdin)
            "-c:v",
            "libx264", // 视频编码: H.264
            "-preset",
            "ultrafast", // 极速编码 (低延迟核心)
            "-tune",
            "zerolatency", // 零延迟调优
            "-g",
            "60", // 关键帧间隔 2秒 (30fps * 2)
            "-c:a",
            "aac", // 音频编码: AAC
            "-ar",
            "44100", // 采样率
            "-b:a",
            "128k", // 音频码率
            "-f",
            "flv", // 输出格式: FLV (RTMP 标准)
            &rtmp_url,
        ])
        .stdin(Stdio::piped()) // 开启输入管道
        .stdout(Stdio::null()) // 忽略输出，避免阻塞
        .stderr(Stdio::inherit()) // 错误日志输出到控制台
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
        let _ = child.kill(); // 强杀进程
        let _ = child.wait(); // 回收资源，防止僵尸进程
    }
    Ok(())
}
