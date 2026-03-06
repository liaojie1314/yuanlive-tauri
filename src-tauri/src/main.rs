// Prevents additional console window on windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dotenv::dotenv;

fn main() -> std::io::Result<()> {
    dotenv().ok();
    #[cfg(target_os = "linux")]
    unsafe {
        #[link(name = "X11")]
        extern "C" {
            fn XInitThreads() -> std::os::raw::c_int;
        }
        XInitThreads();
    }
    yuanlive_tauri_lib::run();
    Ok(())
}
