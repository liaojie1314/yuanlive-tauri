use crate::FfmpegState;
use tauri::{AppHandle, State};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use tracing::{error, info};

/// 检测Ffmpeg是否存在
#[tauri::command]
pub async fn check_ffmpeg_installed(app: AppHandle) -> bool {
    let sidecar_command = app.shell().sidecar("ffmpeg");
    match sidecar_command {
        Ok(cmd) => match cmd.args(["-version"]).output().await {
            Ok(output) => output.status.success(),
            Err(e) => {
                error!("FFmpeg check failed: {}", e);
                false
            }
        },
        Err(e) => {
            error!("Sidecar configuration error: {}", e);
            false
        }
    }
}

/// Ffmpeg 推流
#[tauri::command]
pub fn start_stream_pipe(
    app: AppHandle,
    room_id: String,
    token: String,
    state: State<FfmpegState>,
) -> Result<String, String> {
    let mut child_guard = state.child.lock().unwrap();
    if child_guard.is_some() {
        return Ok("Already streaming".into());
    }
    let rtmp_url = format!("rtmp://localhost:1935/live/{}?token={}", room_id, token);
    info!("Ffmpeg Sidecar Mode: Pushing to {}", rtmp_url);
    let command = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args([
            "-f",
            "webm", // 输入格式
            "-i",
            "-", // 标准输入
            "-c:v",
            "libx264", // 视频编码
            "-preset",
            "ultrafast",
            "-tune",
            "zerolatency",
            "-g",
            "60",
            "-c:a",
            "aac",
            "-ar",
            "44100",
            "-b:a",
            "128k",
            "-f",
            "flv", // 输出格式
            &rtmp_url,
        ]);
    let (mut rx, child) = command
        .spawn()
        .map_err(|e| format!("Start Ffmpeg failed: {}", e))?;
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let log = String::from_utf8_lossy(&line);
                    info!("[FFmpeg Out]: {}", log);
                }
                CommandEvent::Stderr(line) => {
                    let log = String::from_utf8_lossy(&line);
                    info!("[FFmpeg Log]: {}", log);
                }
                CommandEvent::Terminated(payload) => {
                    info!("[FFmpeg] Terminated: {:?}", payload);
                }
                _ => {}
            }
        }
    });
    *child_guard = Some(child);
    Ok("Stream started".into())
}

/// 接收前端切片数据并写入管道
#[tauri::command]
pub fn push_stream_chunk(data: Vec<u8>, state: State<FfmpegState>) -> Result<(), String> {
    let mut child_guard = state.child.lock().unwrap();
    if let Some(child) = child_guard.as_mut() {
        if let Err(e) = child.write(&data) {
            return Err(format!("写入管道失败: {}", e));
        }
        return Ok(());
    }
    Err("Ffmpeg process not running".into())
}

/// 停止推流
#[tauri::command]
pub fn stop_stream_pipe(state: State<FfmpegState>) -> Result<(), String> {
    let mut child_guard = state.child.lock().unwrap();
    if let Some(child) = child_guard.take() {
        // kill() 对应 shell 插件的 kill 方法
        let _ = child.kill();
    }
    Ok(())
}
