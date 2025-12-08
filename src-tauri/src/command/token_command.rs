use crate::AppData;
use tauri::State;
use tracing::info;

#[tauri::command]
pub async fn remove_tokens(state: State<'_, AppData>) -> Result<(), String> {
    info!("Removing user token info");
    let mut rc = state.rc.lock().await;
    rc.token = None;
    rc.refresh_token = None;
    info!("Successfully removed user token info");
    Ok(())
}
