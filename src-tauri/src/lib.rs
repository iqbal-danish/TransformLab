pub mod types;
pub mod core;
pub mod commands;

use commands::*;
use tauri::Manager;

pub fn purge_temp_directory() {
    let base_dir = std::env::temp_dir().join("TransformLab");
    if base_dir.exists() {
        let _ = std::fs::remove_dir_all(&base_dir);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .setup(|app| {
            // Clean up any stale temp files from previous sessions on startup
            purge_temp_directory();

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
        .on_window_event(|_window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed => {
                    purge_temp_directory();
                }
                _ => {}
            }
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
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, event| {
        match event {
            tauri::RunEvent::Exit | tauri::RunEvent::ExitRequested { .. } => {
                purge_temp_directory();
            }
            _ => {}
        }
    });
}
