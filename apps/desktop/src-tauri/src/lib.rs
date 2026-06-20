#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            if let Err(error) = app
                .handle()
                .plugin(tauri_plugin_updater::Builder::new().build())
            {
                eprintln!("自动更新插件未启用: {error}");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
