use futures_util::StreamExt;
use std::env;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter, Manager};

/// 获取模型专属目录
#[tauri::command]
pub fn get_models_dir(app: AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");

    if !models_dir.exists() {
        fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;
    }

    Ok(models_dir.to_string_lossy().to_string())
}

/// 边下载边推送进度
#[tauri::command]
pub async fn download_model_file(
    app: AppHandle,
    url: String,
    file_name: String,
) -> Result<String, String> {
    let models_dir = get_models_dir(app.clone())?;
    let file_path = PathBuf::from(&models_dir).join(&file_name);
    // 如果路径里有子文件夹（比如 kokoro/onnx/），自动创建它们
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    if file_path.exists() {
        return Ok(file_path.to_string_lossy().to_string());
    }
    // 创建一个伪装成真实浏览器的 HTTP 客户端
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("构建客户端失败: {}", e))?;

    // 发起伪装请求
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;
    // 拦截错误状态码
    if !response.status().is_success() {
        return Err(format!("服务器拒绝请求 (状态码: {})", response.status()));
    }
    let total_size = response.content_length().unwrap_or(0);
    let mut file = File::create(&file_path).map_err(|e| format!("创建文件失败: {}", e))?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    // 根据文件名构造安全的事件名（替换掉斜杠和点）
    let safe_name = file_name.replace("/", "_").replace(".", "_");
    let event_name = format!("download-progress-{}", safe_name);
    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("下载出错: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("写入失败: {}", e))?;
        downloaded += chunk.len() as u64;
        let progress = if total_size > 0 {
            (downloaded as f64 / total_size as f64) * 100.0
        } else {
            0.0
        };
        let _ = app.emit(&event_name, progress);
    }

    Ok(file_path.to_string_lossy().to_string())
}

/// 读取本地已下载的模型列表
#[tauri::command]
pub fn check_file_exists(app: tauri::AppHandle, file_path: String) -> Result<bool, String> {
    let models_dir = get_models_dir(app)?;
    // 自动拼接绝对路径，比如 models_dir + "kokoro/voices/af_bella.bin"
    let path = std::path::PathBuf::from(&models_dir).join(file_path);
    Ok(path.exists())
}

#[tauri::command]
pub async fn generate_piper_speech(
    app: AppHandle,
    text: String,
    model_path: String,
    output_path: String,
) -> Result<String, String> {
    // 兼容跨平台后缀
    #[cfg(target_os = "windows")]
    let piper_exe = "piper.exe";
    #[cfg(not(target_os = "windows"))]
    let piper_exe = "piper";

    // 1. 标准生产环境路径 (打包后 Tauri 会把它放在这里)
    let resource_dir = app.path().resource_dir().unwrap_or_default();
    let mut piper_path = resource_dir.join("bin").join("piper").join(piper_exe);

    // 2. 全天候无死角兜底：开发环境 (tauri dev) 的暴力搜索
    if !piper_path.exists() {
        if let Ok(current_dir) = env::current_dir() {
            // 猜测 1：当前命令在项目根目录运行 (如 E:\...\yuanlive-tauri)
            let path1 = current_dir
                .join("src-tauri")
                .join("bin")
                .join("piper")
                .join(piper_exe);

            // 猜测 2：当前命令在 src-tauri 目录运行
            let path2 = current_dir.join("bin").join("piper").join(piper_exe);

            if path1.exists() {
                piper_path = path1;
            } else if path2.exists() {
                piper_path = path2;
            }
        }
    }

    if !piper_path.exists() {
        return Err(format!(
            "找不到 Piper 引擎，请确认已下载解压至: {:?}",
            piper_path
        ));
    }

    // 🔴 核心修复 1：获取 piper.exe 所在的父目录
    let piper_parent_dir = piper_path.parent().unwrap();

    // 2. 启动 Piper 进程
    let mut child = Command::new(&piper_path)
        .current_dir(piper_parent_dir) // 🔴 核心修复 2：强行把工作目录设为它的老家，这样它才能找到 espeak-ng-data 字典！
        .arg("--model")
        .arg(&model_path)
        .arg("--output_file")
        .arg(&output_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped()) // 🔴 核心修复 3：把 stdout 也抓出来，防止它报错报错地方
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("启动 Piper 失败: {}", e))?;

    // 3. 将前端传来的文字通过管道强行灌入 Piper 的嘴里
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(text.as_bytes())
            .map_err(|e| format!("向 Piper 写入文本失败: {}", e))?;
    }

    // 4. 等待 Piper 吐出声音文件
    let output = child
        .wait_with_output()
        .map_err(|e| format!("等待 Piper 执行完成失败: {}", e))?;

    // 🔴 核心修复 4：全方位捕获报错信息
    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        let out_msg = String::from_utf8_lossy(&output.stdout);
        return Err(format!(
            "Piper 生成失败.\n[StdErr]: {}\n[StdOut]: {}",
            err_msg, out_msg
        ));
    }

    Ok(output_path)
}
