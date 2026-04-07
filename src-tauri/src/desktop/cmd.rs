#![allow(unexpected_cfgs)]
#[cfg(target_os = "windows")]
use crate::AudioStreamWrapper;
use base64::{engine::general_purpose, Engine as _};
use enigo::{Enigo, KeyboardControllable, MouseControllable};
use screenshots::image::{DynamicImage, ImageOutputFormat};
use screenshots::Screen;
use std::cmp;
use std::io::Cursor;
use std::path::Path;
#[cfg(target_os = "windows")]
use tauri::Emitter;
use tauri::{AppHandle, LogicalSize, Manager, State};
use tauri_plugin_shell::ShellExt;
use tracing::{error, info};

use crate::AudioState;

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

#[tauri::command]
pub fn set_height(height: u32, handle: AppHandle) -> Result<(), String> {
    let home_window = handle
        .get_webview_window("home")
        .ok_or("未找到 home 窗口")?;
    let sf = home_window
        .scale_factor()
        .map_err(|e| format!("获取窗口缩放因子失败: {}", e))?;
    let out_size = home_window
        .inner_size()
        .map_err(|e| format!("获取窗口尺寸失败: {}", e))?;
    home_window
        .set_size(LogicalSize::new(
            out_size.to_logical(sf).width,
            cmp::max(out_size.to_logical(sf).height, height),
        ))
        .map_err(|e| format!("设置窗口高度失败: {}", e))?;
    Ok(())
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub fn toggle_system_audio_listen(
    app: AppHandle,
    state: State<'_, AudioState>,
    enable: bool,
) -> Result<(), String> {
    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

    let mut stream_guard = state.0.lock().unwrap();
    if !enable {
        *stream_guard = None;
        return Ok(());
    }

    let host = cpal::default_host();
    let device = host.default_output_device().ok_or("找不到默认扬声器")?;
    let config = device.default_output_config().map_err(|e| e.to_string())?;

    let app_clone = app.clone();
    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => device.build_input_stream(
            &config.into(),
            move |data: &[f32], _: &_| {
                let mut sum_squares = 0.0;
                for &sample in data {
                    sum_squares += sample * sample;
                }
                let rms = (sum_squares / data.len() as f32).sqrt();
                let _ = app_clone.emit("system-audio-level", rms);
            },
            |err| eprintln!("音频流报错: {}", err),
            None,
        ),
        _ => return Err("暂不支持系统的音频采样格式".to_string()),
    }
    .map_err(|e| format!("创建音频流失败: {}", e))?;

    stream
        .play()
        .map_err(|e| format!("播放音频流失败: {}", e))?;
    *stream_guard = Some(AudioStreamWrapper(stream));
    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub fn toggle_system_audio_listen(
    _app: AppHandle,
    _state: State<'_, AudioState>,
    _enable: bool,
) -> Result<(), String> {
    // 只要不是 Windows，一律抛出平台不支持的错误给前端
    Err("当前操作系统暂不支持系统声音内录功能哦~".to_string())
}

/// 模拟鼠标移动并点击
#[tauri::command]
pub fn agent_mouse_action(x: i32, y: i32, click: bool) -> Result<(), String> {
    let mut enigo = Enigo::new();

    // 瞬间移动到指定物理坐标
    enigo.mouse_move_to(x, y);

    // 如果需要点击
    if click {
        enigo.mouse_click(enigo::MouseButton::Left);
    }

    Ok(())
}

/// 模拟键盘自动打字
#[tauri::command]
pub fn agent_type_text(text: String) -> Result<(), String> {
    let mut enigo = Enigo::new();
    // 像真人一样模拟按键依次敲下
    enigo.key_sequence(&text);
    Ok(())
}

/// 万能格式转换站
#[tauri::command]
pub async fn convert_file(
    app: AppHandle,
    source_path: String,
    target_ext: String,
) -> Result<String, String> {
    let path = Path::new(&source_path);
    let file_stem = path.file_stem().unwrap().to_string_lossy();
    let parent_dir = path.parent().unwrap();

    // 同目录下，同文件名，新后缀
    let output_path = parent_dir.join(format!("{}_converted.{}", file_stem, target_ext));
    let out_str = output_path.to_string_lossy().to_string();
    let ext = target_ext.to_lowercase();

    // 1. 图像类转换 (纯内存极速处理)
    if ["png", "jpg", "jpeg", "webp", "bmp", "ico"].contains(&ext.as_str()) {
        info!("开始图像转换: {} -> {}", source_path, ext);
        let source_clone = source_path.clone();
        let out_clone = out_str.clone();

        let result = tokio::task::spawn_blocking(move || {
            let img = image::open(&source_clone).map_err(|e| e.to_string())?;
            img.save(&out_clone).map_err(|e| e.to_string())?;
            Ok::<(), String>(())
        })
        .await;

        return match result {
            Ok(Ok(_)) => Ok(out_str),
            Ok(Err(e)) => Err(format!("图片转换失败: {}", e)),
            Err(_) => Err("线程执行异常".to_string()),
        };
    }

    // 2. 音视频类转换 (使用你配置好的 Sidecar FFmpeg)
    if ["mp4", "webm", "gif", "mp3", "wav", "ogg", "avi"].contains(&ext.as_str()) {
        info!("开始音视频 Sidecar 转换: {} -> {}", source_path, ext);

        // 组装 ffmpeg 参数
        let command = app
            .shell()
            .sidecar("ffmpeg")
            .map_err(|e| format!("FFmpeg Sidecar 初始化失败: {}", e))?
            .args([
                "-y", // 覆盖输出文件
                "-i",
                &source_path,
                &out_str,
            ]);

        // 异步等待执行完成，绝对不卡死主进程！
        let output = command
            .output()
            .await
            .map_err(|e| format!("FFmpeg 运行异常: {}", e))?;

        if output.status.success() {
            return Ok(out_str);
        } else {
            let err_msg = String::from_utf8_lossy(&output.stderr);
            error!("FFmpeg 转换出错: {}", err_msg);
            return Err(format!("媒体转换失败: {}", err_msg));
        }
    }

    Err(format!("暂不支持转换为此格式: {}", ext))
}
