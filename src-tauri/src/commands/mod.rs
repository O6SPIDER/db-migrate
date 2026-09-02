use crate::history::{HistoryRecord, HistoryStore};
use crate::migration::engine::{MigrationEngine, MigrationReport};
use crate::postgres::connection::{ConnectionTester, SafeDatabaseIdentity};
use crate::postgres::discovery::{ToolDiscoverer, ToolchainSelection};
use crate::postgres::inspection::{DatabaseInspection, Inspector};
use crate::postgres::verification::{VerificationMode, VerificationSummary, Verifier};
use crate::security::credential::ParsedPostgresUrl;
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub engine: Arc<MigrationEngine>,
    pub history: HistoryStore,
}

#[tauri::command]
pub async fn parse_and_test_connection(url: String) -> Result<SafeDatabaseIdentity, String> {
    let parsed = ParsedPostgresUrl::parse(&url)?;
    ConnectionTester::test_connection(&parsed).await
}

#[tauri::command]
pub fn discover_postgresql_tools(source_server_version: Option<String>) -> ToolchainSelection {
    let version = source_server_version.unwrap_or_else(|| "18.0".to_string());
    ToolDiscoverer::select_toolchain(&version)
}

#[tauri::command]
pub async fn inspect_source_database(url: String) -> Result<DatabaseInspection, String> {
    let parsed = ParsedPostgresUrl::parse(&url)?;
    Inspector::inspect_database(&parsed).await
}

#[tauri::command]
pub async fn inspect_dest_database(url: String) -> Result<DatabaseInspection, String> {
    let parsed = ParsedPostgresUrl::parse(&url)?;
    Inspector::inspect_database(&parsed).await
}

#[tauri::command]
pub async fn run_migration(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    source_url: String,
    dest_url: String,
    keep_backup: bool,
) -> Result<MigrationReport, String> {
    let report = state
        .engine
        .run_migration(app, source_url, dest_url, keep_backup)
        .await?;

    let _ = state.history.save_record(&report);

    Ok(report)
}

#[tauri::command]
pub async fn cancel_migration(state: State<'_, AppState>) -> Result<(), String> {
    state.engine.cancel();
    Ok(())
}

#[tauri::command]
pub async fn run_deep_verification(
    source_url: String,
    dest_url: String,
) -> Result<VerificationSummary, String> {
    let source_parsed = ParsedPostgresUrl::parse(&source_url)?;
    let dest_parsed = ParsedPostgresUrl::parse(&dest_url)?;
    Verifier::verify(&source_parsed, &dest_parsed, VerificationMode::DEEP).await
}

#[tauri::command]
pub fn get_migration_history(state: State<'_, AppState>) -> Vec<HistoryRecord> {
    state.history.load_all()
}

#[tauri::command]
pub fn clear_migration_history(state: State<'_, AppState>) -> Result<(), String> {
    state.history.clear()
}
