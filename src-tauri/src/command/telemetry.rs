use serde_json::Value;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};
use tokio::sync::mpsc;
use tracing::{error, info};

#[derive(Debug, Clone)]
pub struct TrackingEvent {
    pub event: String,
    pub properties: Value,
    pub timestamp: i64,
}

pub struct TelemetryState {
    pub sender: mpsc::Sender<TrackingEvent>,
}

#[tauri::command]
pub async fn track_event(
    event: String,
    properties: Value,
    state: State<'_, TelemetryState>,
) -> Result<(), String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;

    let tracking_event = TrackingEvent {
        event,
        properties,
        timestamp,
    };
    // 非阻塞发送到后台队列
    if let Err(e) = state.sender.try_send(tracking_event) {
        error!("[Telemetry] Failed to enqueue tracking event: {}", e);
    }
    Ok(())
}

async fn telemetry_worker(mut receiver: mpsc::Receiver<TrackingEvent>) {
    let client = reqwest::Client::new();
    let api_key =
        std::env::var("TELEMETRY_API_KEY").unwrap_or_else(|_| "YOUR_DEFAULT_KEY".to_string());
    let host = "https://us.i.posthog.com/capture/";
    info!("[Telemetry] Worker started");
    while let Some(event) = receiver.recv().await {
        let mut properties = event.properties;
        if let Some(map) = properties.as_object_mut() {
            if !map.contains_key("distinct_id") {
                map.insert(
                    "distinct_id".to_string(),
                    serde_json::json!("rust_fallback_device"),
                );
            }
        } else {
            properties = serde_json::json!({
                "distinct_id": "rust_fallback_device",
                "raw_data": properties
            });
        }

        let payload = serde_json::json!({
            "api_key": api_key,
            "event": event.event,
            "properties": properties
        });

        match client.post(host).json(&payload).send().await {
            Ok(res) => {
                if !res.status().is_success() {
                    tracing::error!("[Telemetry] Server error: {} - {:?}", res.status(), payload);
                } else {
                    tracing::info!("[Telemetry] Successfully sent event: {}", event.event);
                }
            }
            Err(e) => {
                tracing::error!("[Telemetry] Network error: {}", e);
            }
        }
    }
}

/// 初始化模块：创建通道，注册 State，启动后台线程
pub fn init(app_handle: &AppHandle) {
    let (tx, rx) = mpsc::channel(1000); // 队列容量限制为 1000
                                        // 启动后台独立任务
    tauri::async_runtime::spawn(async move {
        telemetry_worker(rx).await;
    });
    // 注册全局 State
    app_handle.manage(TelemetryState { sender: tx });
}
