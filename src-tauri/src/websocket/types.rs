use std::collections::HashMap;

use serde::{Deserialize, Serialize};

/// WebSocket 连接状态
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Reconnecting,
    Error,
}

/// WebSocket 消息类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    // 心跳消息 (PING)
    #[serde(rename = "PING")]
    Heartbeat,
    // 心跳响应 (PONG)
    #[serde(rename = "PONG")]
    HeartbeatResponse,
    // 普通消息
    Message {
        #[serde(flatten)]
        data: serde_json::Value,
    },
}

/// WebSocket 连接配置
#[derive(Debug, Clone)]
pub struct WebSocketConfig {
    pub server_url: String,
    pub token: Option<String>,
    pub device_id: String,
    pub heartbeat_interval: u64,
    pub heartbeat_timeout: u64,
    pub max_reconnect_attempts: u32,
    pub reconnect_delay_ms: u64,
}

/// WebSocket 连接配置默认值
impl Default for WebSocketConfig {
    fn default() -> Self {
        Self {
            server_url: String::new(),
            token: None,
            device_id: String::new(),
            heartbeat_interval: 9900, // 9.9秒
            heartbeat_timeout: 15000, // 15秒
            // 0 表示无限重连
            max_reconnect_attempts: 0,
            reconnect_delay_ms: 1000, // 1秒
        }
    }
}

/// 连接健康状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionHealth {
    pub is_healthy: bool,
    pub last_pong_time: Option<u64>,
    pub consecutive_failures: u32,
    pub round_trip_time: Option<u64>,
}

/// WebSocket 事件
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum WebSocketEvent {
    ConnectionStateChanged {
        state: ConnectionState,
        is_reconnection: bool,
    },
    MessageReceived {
        message: serde_json::Value,
    },
    HeartbeatStatusChanged {
        health: ConnectionHealth,
    },
    Error {
        message: String,
        details: Option<HashMap<String, serde_json::Value>>,
    },
}
