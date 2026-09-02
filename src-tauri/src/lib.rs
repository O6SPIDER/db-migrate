pub mod commands;
pub mod history;
pub mod migration;
pub mod postgres;
pub mod security;

use commands::AppState;
use history::HistoryStore;
use migration::engine::MigrationEngine;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            engine: Arc::new(MigrationEngine::new()),
            history: HistoryStore::new(),
        })
        .invoke_handler(tauri::generate_handler![
            commands::parse_and_test_connection,
            commands::discover_postgresql_tools,
            commands::inspect_source_database,
            commands::inspect_dest_database,
            commands::run_migration,
            commands::cancel_migration,
            commands::run_deep_verification,
            commands::get_migration_history,
            commands::clear_migration_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
