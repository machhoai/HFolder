mod application;
mod commands;
mod domain;
mod error;
mod infrastructure;

use commands::*;
use std::{collections::HashSet, sync::Mutex};
use tauri::{Emitter, Manager};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            let _ = app.emit("external-open", args);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let data = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data)?;
            let db = infrastructure::persistence::open_database(&data.join("hfolder.sqlite3"))
                .map_err(|e| std::io::Error::other(format!("{}: {}", e.code, e.detail)))?;
            app.manage(AppState {
                engine: Mutex::new(application::Engine { db }),
                chosen_roots: Mutex::new(HashSet::new()),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            choose_root,
            list_projects,
            create_project,
            get_project,
            preview_folder,
            create_folder,
            confirm_entries,
            open_entry,
            preview_changes,
            apply_changes,
            recover_changes
        ])
        .run(tauri::generate_context!())
        .expect("HFolder startup failed");
}
