use crate::AppData;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::info;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserTokenReq {
    uid: String,
    token: String,
    refresh_token: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TokenResponse {
    token: Option<String>,
    refresh_token: Option<String>,
}

/// 移除当前用户的token信息
#[tauri::command]
pub async fn remove_token(state: State<'_, AppData>) -> Result<(), String> {
    info!("Removing user token info");
    let mut rc = state.rc.lock().await;
    rc.token = None;
    rc.refresh_token = None;
    info!("Successfully removed user token info");
    Ok(())
}

/// 更新当前用户的token信息
#[tauri::command]
pub async fn update_token(
    req: UpdateUserTokenReq,
    state: State<'_, AppData>,
) -> Result<(), String> {
    info!("Updating user token info");
    {
        let mut user_info = state.user_info.lock().await;
        user_info.uid = req.uid.clone();
        user_info.token = req.token.clone();
        user_info.refresh_token = req.refresh_token.clone();
    }
    {
        let mut rc = state.rc.lock().await;
        rc.token = Some(req.token.clone());
        rc.refresh_token = Some(req.refresh_token.clone());
    }
    info!("Successfully updated user token info");
    Ok(())
}

/// 获取当前用户的token信息
#[tauri::command]
pub async fn get_token(state: State<'_, AppData>) -> Result<TokenResponse, String> {
    info!("Getting user token info");

    let user_info = state.user_info.lock().await;

    let response = TokenResponse {
        token: user_info.token.clone().into(),
        refresh_token: user_info.refresh_token.clone().into(),
    };

    info!("Successfully retrieved user token info: {:?}", response);
    Ok(response)
}
