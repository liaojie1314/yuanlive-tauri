// Prevents additional console window on windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dotenv::dotenv;

fn main() -> std::io::Result<()> {
    dotenv().ok();
    yuanlive_tauri_lib::run();
    Ok(())
}
