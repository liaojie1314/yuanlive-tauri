use crate::McpState;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_shell::{process::CommandEvent, ShellExt};
use tracing::error;

// 启动 MCP 服务的命令
#[tauri::command]
pub async fn start_mcp(app: AppHandle, state: State<'_, McpState>) -> Result<(), String> {
    // 启动 Sidecar
    let (mut rx, child) = app
        .shell()
        .sidecar("windows-mcp")
        .map_err(|e| format!("找不到 sidecar: {}", e))?
        .spawn()
        .map_err(|e| format!("启动失败: {}", e))?;

    // 将进程句柄存入全局状态
    *state.child.lock().unwrap() = Some(child);

    // 开启后台异步任务，持续监听 MCP 服务的输出 (Stdout)
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let msg = String::from_utf8_lossy(&line).into_owned();
                    // 将 MCP 返回的 JSON 字符串通过事件发给 Vue3 前端
                    app.emit("mcp-message", msg).unwrap();
                }
                CommandEvent::Stderr(err) => {
                    error!("MCP 错误输出: {}", String::from_utf8_lossy(&err));
                }
                _ => {}
            }
        }
    });

    Ok(())
}

// 向 MCP 发送指令的命令
#[tauri::command]
pub fn send_to_mcp(state: State<'_, McpState>, payload: String) -> Result<(), String> {
    if let Some(child) = state.child.lock().unwrap().as_mut() {
        // MCP 协议基于 JSON-RPC，且每条消息必须以换行符 \n 结尾
        let mut data = payload.into_bytes();
        data.push(b'\n');

        child.write(&data).map_err(|e| format!("写入失败: {}", e))?;
    } else {
        return Err("MCP 服务未启动".to_string());
    }
    Ok(())
}
