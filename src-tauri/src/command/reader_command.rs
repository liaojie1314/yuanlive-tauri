use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::Path};
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Debug)]
pub struct Chapter {
    pub name: String,
    pub pages: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ComicBook {
    pub cover: String,
    pub chapters: Vec<Chapter>,
}

// 用于书架展示的轻量级漫画元数据
#[derive(Serialize, Deserialize, Debug)]
pub struct ComicMeta {
    pub title: String,
    pub path: String,
    pub cover: String,
}

#[tauri::command]
pub async fn scan_comic_library(root_path: String) -> Result<Vec<ComicMeta>, String> {
    let root = Path::new(&root_path);
    if !root.exists() || !root.is_dir() {
        return Err("目录不存在".into());
    }

    let mut comics = Vec::new();

    // 只读取一级目录作为独立的漫画文件夹
    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                // 快速获取子目录的漫画信息
                if let Some(meta) = get_lightweight_comic_meta(&path) {
                    comics.push(meta);
                }
            }
        }
    }

    // 按漫画名自然排序
    comics.sort_by(|a, b| natord::compare(&a.title, &b.title));
    Ok(comics)
}

// 轻量级提取封面和标题（提升批量导入速度）
fn get_lightweight_comic_meta(path: &Path) -> Option<ComicMeta> {
    let title = path.file_name()?.to_string_lossy().to_string();
    let path_str = path.to_string_lossy().to_string();
    let mut cover = String::new();

    // 限制遍历深度，寻找第一张合适的图片作为封面
    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let p = entry.path();
        if p.is_file() {
            let ext = p
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_lowercase();
            if ["jpg", "jpeg", "png", "webp", "avif"].contains(&ext.as_str()) {
                let file_path_str = p.to_string_lossy().to_string();
                let file_name = p
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_lowercase();

                // 先随便记下一张图作为兜底封面
                if cover.is_empty() {
                    cover = file_path_str.clone();
                }

                // 如果发现明确包含 cover 关键字的图，立即使用并打断循环
                if file_name.contains("cover")
                    || file_name.contains("poster")
                    || file_name.contains("front")
                {
                    cover = file_path_str;
                    break;
                }
            }
        }
    }

    // 如果这个文件夹里连一张图片都没有，说明它不是漫画，忽略它
    if cover.is_empty() {
        None
    } else {
        Some(ComicMeta {
            title,
            path: path_str,
            cover,
        })
    }
}

#[tauri::command]
pub async fn parse_comic_directory(root_path: String) -> Result<ComicBook, String> {
    let root = Path::new(&root_path);
    if !root.exists() || !root.is_dir() {
        return Err("漫画根目录不存在".into());
    }

    let mut chapter_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut possible_covers: Vec<String> = Vec::new();
    let mut all_pages_fallback: Vec<String> = Vec::new();

    // 1. 递归扫描所有文件
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();

        if path.is_file() {
            let ext = path
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_lowercase();
            // 只处理图片
            if ["jpg", "jpeg", "png", "webp", "avif"].contains(&ext.as_str()) {
                let file_path_str = path.to_string_lossy().to_string();
                let file_name = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_lowercase();

                // 2. 封面启发式猜测
                let is_explicit_cover = file_name.contains("cover")
                    || file_name.contains("poster")
                    || file_name.contains("front");

                if is_explicit_cover {
                    possible_covers.push(file_path_str.clone());

                    // 【修复点】：如果这个封面图片直接位于漫画的根目录，
                    // 则跳过后续逻辑，不把它加入到任何章节（如"正文"）的阅读列表中。
                    let parent_path = path.parent().unwrap_or(root);
                    if parent_path == root {
                        continue;
                    }
                }

                // 3. 提取章节名 (相对父路径)
                let parent_path = path.parent().unwrap_or(root);
                let rel_parent = parent_path.strip_prefix(root).unwrap_or(Path::new(""));

                let chapter_name = if rel_parent.as_os_str().is_empty() {
                    "正文".to_string() // 直接在根目录的其他普通图片
                } else {
                    rel_parent.to_string_lossy().replace('\\', "/") // 统一斜杠格式
                };

                chapter_map
                    .entry(chapter_name)
                    .or_insert_with(Vec::new)
                    .push(file_path_str.clone());
                all_pages_fallback.push(file_path_str);
            }
        }
    }
    if chapter_map.is_empty() {
        return Err("该目录下未找到任何支持的图片文件".into());
    }

    // 4. 对章节和图片进行【自然排序】
    let mut chapters: Vec<Chapter> = chapter_map
        .into_iter()
        .map(|(name, mut pages)| {
            // 对章节内的页面进行自然排序
            pages.sort_by(|a, b| natord::compare(a, b));
            Chapter { name, pages }
        })
        .collect();

    // 对章节列表本身进行自然排序
    chapters.sort_by(|a, b| natord::compare(&a.name, &b.name));

    // 5. 决定最终封面
    let cover = if !possible_covers.is_empty() {
        possible_covers[0].clone()
    } else {
        // 如果没特征，尝试取第一章的第一页
        chapters
            .first()
            .and_then(|c| c.pages.first())
            .cloned()
            .unwrap_or_default()
    };

    Ok(ComicBook { cover, chapters })
}
