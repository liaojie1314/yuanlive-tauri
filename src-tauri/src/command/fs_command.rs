use mime_guess::from_path;
use std::fs;
use std::fs::File;
use std::io::{BufRead, BufReader, Read};
use std::path::{Path, PathBuf};

/// 安全拦截器：工作区沙盒隔离
fn get_safe_path(requested_path: &str, allowed_workspaces: Vec<String>) -> Result<PathBuf, String> {
    let req_path = Path::new(requested_path);

    // 1. 解析请求的真实路径（处理文件尚不存在的情况，如新建文件）
    let canonical_requested = if req_path.exists() {
        req_path
            .canonicalize()
            .map_err(|_| format!("无法解析路径: {}", requested_path))?
    } else {
        let parent = req_path.parent().ok_or("无效的路径，找不到父目录")?;
        let mut parent_canon = parent
            .canonicalize()
            .map_err(|_| format!("无法解析父目录: {}", parent.display()))?;
        if let Some(file_name) = req_path.file_name() {
            parent_canon.push(file_name);
        }
        parent_canon
    };

    // 2. 遍历所有允许的工作区，只要在其中任意一个内部，就放行
    for workspace_str in allowed_workspaces {
        let workspace_path = Path::new(&workspace_str);
        if let Ok(canonical_workspace) = workspace_path.canonicalize() {
            if canonical_requested.starts_with(&canonical_workspace) {
                return Ok(canonical_requested); // ✅ 安全！命中授权目录
            }
        }
    }

    // 3. 如果循环结束都没 return，说明越权了
    Err(format!(
        "🚨 越权拦截：禁止访问授权工作区之外的文件！请求路径: {:?}",
        canonical_requested
    ))
}

/// 高级读取：按行号分页读取文件
#[tauri::command]
pub async fn fs_read_file_lines(
    workspaces: Vec<String>,
    path: String,
    start_line: usize,
    end_line: usize,
) -> Result<String, String> {
    let safe_path = get_safe_path(&path, workspaces)?;
    let file = File::open(&safe_path).map_err(|e| format!("打开文件失败: {}", e))?;
    let reader = BufReader::new(file);
    let mut content = String::new();

    let actual_end = if end_line - start_line > 2000 {
        start_line + 2000
    } else {
        end_line
    };

    for (i, line) in reader.lines().enumerate() {
        let current_line = i + 1;
        if current_line >= start_line && current_line <= actual_end {
            if let Ok(l) = line {
                content.push_str(&format!("{} | {}\n", current_line, l));
            }
        }
        if current_line > actual_end {
            break;
        }
    }

    if content.is_empty() {
        Ok(format!(
            "提示：在 {} 到 {} 行之间没有找到内容。",
            start_line, end_line
        ))
    } else {
        Ok(content)
    }
}

/// 文件内搜索
#[tauri::command]
pub async fn fs_search_file(
    workspaces: Vec<String>,
    path: String,
    keyword: String,
) -> Result<String, String> {
    let safe_path = get_safe_path(&path, workspaces)?;
    let file = File::open(&safe_path).map_err(|e| format!("打开文件失败: {}", e))?;
    let reader = BufReader::new(file);
    let mut results = String::new();
    let mut match_count = 0;

    for (i, line) in reader.lines().enumerate() {
        if let Ok(l) = line {
            if l.contains(&keyword) {
                results.push_str(&format!("第 {} 行: {}\n", i + 1, l));
                match_count += 1;
                if match_count >= 100 {
                    results.push_str("... \n[提示：匹配项过多，仅展示前 100 条结果。]\n");
                    break;
                }
            }
        }
    }

    if match_count == 0 {
        Ok(format!("在文件中未找到包含关键词 '{}' 的内容。", keyword))
    } else {
        Ok(results)
    }
}

/// 读取文件 (防 OOM 版)
#[tauri::command]
pub async fn fs_read_file(workspaces: Vec<String>, path: String) -> Result<String, String> {
    let safe_path = get_safe_path(&path, workspaces)?;
    let file = File::open(&safe_path).map_err(|e| format!("打开文件失败: {}", e))?;

    let limit: u64 = 30 * 1024;
    let mut buffer = String::new();

    match file.take(limit).read_to_string(&mut buffer) {
        Ok(bytes_read) => {
            if bytes_read as u64 == limit {
                Ok(format!(
                    "{}...\n\n[安全截断: 文件过大，仅返回前 30KB 内容]",
                    buffer
                ))
            } else {
                Ok(buffer)
            }
        }
        Err(e) => Err(format!("读取文件内容失败: {}", e)),
    }
}

/// 写入文件
#[tauri::command]
pub async fn fs_write_file(
    workspaces: Vec<String>,
    path: String,
    content: String,
) -> Result<String, String> {
    let safe_path = get_safe_path(&path, workspaces)?;
    if let Some(parent) = safe_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建父目录失败: {}", e))?;
    }
    fs::write(&safe_path, content).map_err(|e| format!("写入失败: {}", e))?;
    Ok(format!("成功写入文件: {:?}", safe_path))
}

/// 列出目录
#[tauri::command]
pub async fn fs_list_dir(workspaces: Vec<String>, path: String) -> Result<Vec<String>, String> {
    let safe_path = get_safe_path(&path, workspaces)?;
    let mut entries = Vec::new();
    let dir = fs::read_dir(&safe_path).map_err(|e| format!("读取目录失败: {}", e))?;
    for entry in dir.flatten() {
        let name = entry.file_name().into_string().unwrap_or_default();
        let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
        entries.push(format!(
            "{} {}",
            if is_dir { "[目录]" } else { "[文件]" },
            name
        ));
    }
    Ok(entries)
}

/// 创建目录
#[tauri::command]
pub async fn fs_create_dir(workspaces: Vec<String>, path: String) -> Result<String, String> {
    let safe_path = get_safe_path(&path, workspaces)?;
    fs::create_dir_all(&safe_path).map_err(|e| format!("创建目录失败: {}", e))?;
    Ok(format!("成功创建目录: {:?}", safe_path))
}

/// 移动或重命名文件/目录
#[tauri::command]
pub async fn fs_move_file(
    workspaces: Vec<String>,
    source: String,
    destination: String,
) -> Result<String, String> {
    // 因为 workspaces 是 Vec，传入 get_safe_path 会发生所有权转移 (move)，
    // 既然要调两次，我们只需要传入 clone() 即可
    let safe_source = get_safe_path(&source, workspaces.clone())?;
    let safe_dest = get_safe_path(&destination, workspaces)?;

    fs::rename(&safe_source, &safe_dest).map_err(|e| format!("移动失败: {}", e))?;
    Ok(format!("成功移动文件"))
}

/// 获取文件信息
#[tauri::command]
pub async fn fs_get_file_info(workspaces: Vec<String>, path: String) -> Result<String, String> {
    let safe_path = get_safe_path(&path, workspaces)?;

    let name = safe_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    let file_ext = safe_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_string();
    let mime_type = from_path(&safe_path).first_or_octet_stream().to_string();
    let exists = safe_path.exists();
    let stored_path = safe_path.to_string_lossy().to_string();

    Ok(format!(
        "文件名: {}, 扩展名: {}, MIME 类型: {}, 存在: {}, 存储路径: {}",
        name, file_ext, mime_type, exists, stored_path
    ))
}
