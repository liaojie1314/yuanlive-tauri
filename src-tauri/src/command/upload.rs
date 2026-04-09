use crate::AppData;
use tauri::State;
use tracing::{error, info};

// 内存文件/二进制数据上传
#[tauri::command]
pub async fn upload_chunk_bytes_command(
    file_hash: String,
    file_name: String,
    chunk_index: u32,
    total_chunks: u32,
    scene: String,
    chunk_data: Vec<u8>,
    state: State<'_, AppData>,
) -> Result<Option<serde_json::Value>, String> {
    info!("内存分片上传: idx={}", chunk_index);
    let mut rc = state.rc.lock().await;
    rc.upload_chunk_bytes(
        &file_hash,
        &file_name,
        chunk_index,
        total_chunks,
        &scene,
        chunk_data,
    )
    .await
    .map_err(|e| e.to_string())
    .map(|r| r.data)
}

// 大文件路径直接上传
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn upload_chunk_by_path_command(
    file_hash: String,
    file_name: String,
    chunk_index: u32,
    total_chunks: u32,
    scene: String,
    file_path: String, // 传入文件路径
    start: u64,        // 读取起始位置
    size: u64,         // 读取长度
    state: State<'_, AppData>,
) -> Result<Option<serde_json::Value>, String> {
    info!("文件流分片上传: idx={}, path={}", chunk_index, file_path);
    let mut rc = state.rc.lock().await;
    rc.upload_chunk_from_path(
        &file_hash,
        &file_name,
        chunk_index,
        total_chunks,
        &scene,
        &file_path,
        start,
        size,
    )
    .await
    .map_err(|e| {
        error!("分片上传失败 (Path): {}", e);
        e.to_string()
    })
    .map(|r| r.data)
}

/// 处理检查已上传分片请求
#[tauri::command]
pub async fn check_uploaded_chunks_command(
    file_hash: String,
    file_name: String,
    scene: String,
    state: State<'_, AppData>,
) -> Result<Option<serde_json::Value>, String> {
    info!("处理检查已上传分片请求: file_hash={}", file_hash);
    let result = {
        let mut rc = state.rc.lock().await;
        rc.check_uploaded_chunks(&file_hash, &file_name, &scene)
            .await
            .map_err(|e| {
                error!("检查已上传分片失败: {}", e);
                e.to_string()
            })?
    };
    Ok(result.data)
}

/// 处理合并分片请求
#[tauri::command]
pub async fn merge_chunks_command(
    file_hash: String,
    file_name: String,
    total_chunks: u32,
    scene: String,
    state: State<'_, AppData>,
) -> Result<Option<serde_json::Value>, String> {
    info!(
        "处理合并分片请求: file_hash={}, total_chunks={}",
        file_hash, total_chunks
    );
    let result = {
        let mut rc = state.rc.lock().await;
        rc.merge_chunks(&file_hash, &file_name, total_chunks, &scene)
            .await
            .map_err(|e| {
                error!("合并分片失败: {}", e);
                e.to_string()
            })?
    };
    Ok(result.data)
}
