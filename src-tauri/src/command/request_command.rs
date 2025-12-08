use crate::request_client::{AuthResp, LoginReq, Request, Url};
use crate::AppData;
use tauri::{Emitter, State};
use tracing::info;

#[tauri::command]
pub async fn login_command(
    data: LoginReq,
    state: State<'_, AppData>,
) -> Result<Option<AuthResp>, String> {
    if data.is_auto_login {
        // 自动登录逻辑
        info!("Performing automatic login");
        if let Some(uid) = &data.uid {
            todo!()
        } else {
            Err("自动登录缺少用户ID".to_string())
        }
    } else {
        // 手动登录逻辑
        info!("Performing manual login");
        let res = {
            let mut rc = state.rc.lock().await;
            rc.login(data).await.map_err(|e| e.to_string())?
        }; // 锁在这里被释放

        // 登录成功后处理用户信息和token保存
        if let Some(login_resp) = &res {
            handle_login_success(login_resp, &state).await?;
        }

        info!("Manual login successful");
        Ok(res)
    }
}

async fn handle_login_success(
    login_resp: &AuthResp,
    state: &State<'_, AppData>,
) -> Result<(), String> {
    info!("handle_login_success, login_resp: {:?}", login_resp);
    // 设置用户信息
    let mut user_info = state.user_info.lock().await;
    user_info.uid = login_resp.uid.clone();
    user_info.token = login_resp.token.clone();
    user_info.refresh_token = login_resp.refresh_token.clone();
    info!("handle_login_success, user_info: {:?}", user_info);
    Ok(())
}

#[tauri::command]
pub async fn request_command(
    state: State<'_, AppData>,
    url: String,
    body: Option<serde_json::Value>,
    params: Option<serde_json::Value>,
    app_handle: tauri::AppHandle,
) -> Result<Option<serde_json::Value>, String> {
    let mut rc = state.rc.lock().await;

    if let Ok(url) = url.parse::<Url>() {
        let result: Result<Option<serde_json::Value>, anyhow::Error> =
            rc.request(url, body, params).await;
        match result {
            Ok(data) => Ok(data),
            Err(e) => {
                tracing::error!("Request error: {}", e);
                if e.to_string().contains("请重新登录") {
                    app_handle.emit_to("home", "reLogin", ()).unwrap();
                }
                Err(e.to_string())
            }
        }
    } else {
        tracing::error!("Invalid URL: {}", url);
        Err(format!("Invalid URL: {}", url))
    }
}
