use crate::AppData;
use tauri::State;
use tracing::{error, info};

/// 处理分片上传请求
#[tauri::command]
pub async fn upload_chunk_command(
    file_hash: String,
    file_name: String,
    chunk_index: u32,
    total_chunks: u32,
    scene: String,
    chunk_data: Vec<u8>,
    state: State<'_, AppData>,
) -> Result<Option<serde_json::Value>, String> {
    info!(
        "处理分片上传请求: file_hash={}, chunk_index={}",
        file_hash, chunk_index
    );
    let result = {
        let mut rc = state.rc.lock().await;
        rc.upload_chunk(
            &file_hash,
            &file_name,
            chunk_index,
            total_chunks,
            &scene,
            &chunk_data,
        )
        .await
        .map_err(|e| {
            error!("分片上传失败: {}", e);
            e.to_string()
        })?
    };
    Ok(result.data)
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
