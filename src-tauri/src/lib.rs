pub mod types;
pub mod core;
pub mod commands;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_theme(Some(tauri::Theme::Dark));
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_file_dialog,
            save_file_dialog,
            inspect_file,
            read_file_slice,
            search_file,
            start_transformation,
            cancel_transformation,
            export_output_file,
            download_url_feed,
            cancel_url_download,
            clear_temp_cache,
            get_temp_cache_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
