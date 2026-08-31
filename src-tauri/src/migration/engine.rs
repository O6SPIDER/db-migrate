use crate::postgres::connection::{ConnectionTester, SafeDatabaseIdentity};
use crate::postgres::discovery::{PostgresTool, ToolDiscoverer, ToolchainSelection};
use crate::postgres::dump::DumpExecutor;
use crate::postgres::inspection::{DatabaseInspection, Inspector};
use crate::postgres::restore::RestoreExecutor;
use crate::postgres::verification::{VerificationMode, VerificationStatus, VerificationSummary, Verifier};
use crate::security::credential::ParsedPostgresUrl;
use crate::security::redaction::redact_text;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MigrationStage {
    DRAFT,
    VALIDATING,
    PREFLIGHT,
    READY,
    DUMPING,
    RESTORING,
    VERIFYING,
    COMPLETED,
    FAILED,
    CANCELLED,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub stage: MigrationStage,
    pub activity: String,
    pub elapsed_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEvent {
    pub timestamp: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationReport {
    pub migration_id: String,
    pub started_at: String,
    pub completed_at: String,
    pub duration_seconds: u64,
    pub source_provider: String,
    pub source_host_redacted: String,
    pub source_dbname: String,
    pub destination_provider: String,
    pub destination_host_redacted: String,
    pub destination_dbname: String,
    pub source_postgres_version: String,
    pub destination_postgres_version: String,
    pub pg_dump_version: String,
    pub pg_restore_version: String,
    pub dump_size_bytes: u64,
    pub dump_size_formatted: String,
    pub status: VerificationStatus,
    pub verification_mode: VerificationMode,
    pub verification_summary: VerificationSummary,
    pub logs: Vec<String>,
    pub dump_file_retained: bool,
    pub dump_file_path: Option<String>,
}

pub struct MigrationEngine {
    pub cancel_flag: Arc<AtomicBool>,
}

impl MigrationEngine {
    pub fn new() -> Self {
        MigrationEngine {
            cancel_flag: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn cancel(&self) {
        self.cancel_flag.store(true, Ordering::Relaxed);
    }

    pub async fn run_migration(
        &self,
        app: tauri::AppHandle,
        source_raw_url: String,
        dest_raw_url: String,
        keep_backup: bool,
    ) -> Result<MigrationReport, String> {
        let migration_id = uuid::Uuid::new_v4().to_string();
        let started_at = chrono::Local::now().to_rfc3339();
        let start_instant = std::time::Instant::now();
        self.cancel_flag.store(false, Ordering::Relaxed);

        let emit_log = |app_handle: &tauri::AppHandle, msg: String| {
            let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
            let sanitized = redact_text(&msg);
            let _ = app_handle.emit(
                "migration://log",
                LogEvent {
                    timestamp,
                    message: sanitized,
                },
            );
        };

        let emit_progress = |app_handle: &tauri::AppHandle, stage: MigrationStage, activity: String, elapsed: u64| {
            let _ = app_handle.emit(
                "migration://progress",
                ProgressEvent {
                    stage,
                    activity,
                    elapsed_seconds: elapsed,
                },
            );
        };

        // 1. Stage: Preparing & Parsing
        emit_progress(&app, MigrationStage::PREFLIGHT, "Parsing connection credentials...".to_string(), 0);
        emit_log(&app, "Initializing safe migration workflow...".to_string());

        let source_parsed = ParsedPostgresUrl::parse(&source_raw_url)
            .map_err(|e| format!("Source URL error: {}", e))?;
        let dest_parsed = ParsedPostgresUrl::parse(&dest_raw_url)
            .map_err(|e| format!("Destination URL error: {}", e))?;

        // 2. Validate & Test Connections
        emit_progress(&app, MigrationStage::PREFLIGHT, "Validating source database...".to_string(), start_instant.elapsed().as_secs());
        let source_id = ConnectionTester::test_connection(&source_parsed)
            .await
            .map_err(|e| format!("Source connection failed: {}", e))?;
        emit_log(&app, format!("Source connection verified: {} ({}) - Postgres {}", source_id.provider, source_id.hostname, source_id.server_version));

        emit_progress(&app, MigrationStage::PREFLIGHT, "Validating destination database...".to_string(), start_instant.elapsed().as_secs());
        let dest_id = ConnectionTester::test_connection(&dest_parsed)
            .await
            .map_err(|e| format!("Destination connection failed: {}", e))?;
        emit_log(&app, format!("Destination connection verified: {} ({}) - Postgres {}", dest_id.provider, dest_id.hostname, dest_id.server_version));

        // Same database protection
        if ConnectionTester::are_same_database(&source_id, &dest_id) {
            return Err("Source and destination refer to the exact same database server. Migration blocked.".to_string());
        }

        // 3. Tool Discovery & Version Selection
        emit_progress(&app, MigrationStage::PREFLIGHT, "Checking PostgreSQL client tooling...".to_string(), start_instant.elapsed().as_secs());
        let toolchain = ToolDiscoverer::select_toolchain(&source_id.server_version);
        if !toolchain.compatible {
            return Err(toolchain.incompatibility_reason.unwrap_or_else(|| "Incompatible PostgreSQL toolchain.".to_string()));
        }

        let dump_tool = toolchain.selected_dump.clone().ok_or("No valid pg_dump selected.")?;
        let restore_tool = toolchain.selected_restore.clone().ok_or("No valid pg_restore selected.")?;

        emit_log(&app, format!("Selected pg_dump v{} ({})", dump_tool.version, dump_tool.path));
        emit_log(&app, format!("Selected pg_restore v{} ({})", restore_tool.version, restore_tool.path));

        // Temp storage
        let temp_dir = std::env::temp_dir();

        // 4. DUMP Stage
        emit_progress(&app, MigrationStage::DUMPING, format!("Creating archive dump from {}...", source_id.dbname), start_instant.elapsed().as_secs());
        emit_log(&app, "Beginning source pg_dump process (custom archive format)...".to_string());

        let app_log_handle = app.clone();
        let dump_res = DumpExecutor::execute_dump(
            &dump_tool,
            &source_parsed,
            &temp_dir,
            self.cancel_flag.clone(),
            move |msg| emit_log(&app_log_handle, msg),
        )?;

        // 5. RESTORE Stage
        emit_progress(&app, MigrationStage::RESTORING, format!("Restoring dump into {}...", dest_id.dbname), start_instant.elapsed().as_secs());
        let app_log_handle2 = app.clone();

        let restore_res = RestoreExecutor::execute_restore(
            &restore_tool,
            &dest_parsed,
            &dump_res.dump_file_path,
            self.cancel_flag.clone(),
            move |msg| emit_log(&app_log_handle2, msg),
        )?;

        // 6. VERIFYING Stage
        emit_progress(&app, MigrationStage::VERIFYING, "Verifying destination schema & object counts...".to_string(), start_instant.elapsed().as_secs());
        emit_log(&app, "Executing standard catalog verification...".to_string());

        let verification_summary = Verifier::verify(&source_parsed, &dest_parsed, VerificationMode::STANDARD)
            .await
            .map_err(|e| format!("Verification failed: {}", e))?;

        emit_log(&app, format!("Verification result: {:?} - {}", verification_summary.status, verification_summary.message));

        let completed_at = chrono::Local::now().to_rfc3339();
        let duration_seconds = start_instant.elapsed().as_secs();

        let dump_path_str = dump_res.dump_file_path.to_string_lossy().to_string();

        if !keep_backup {
            let _ = std::fs::remove_file(&dump_res.dump_file_path);
            emit_log(&app, "Cleaned up temporary archive dump file.".to_string());
        } else {
            emit_log(&app, format!("Backup archive retained at: {}", dump_path_str));
        }

        let report = MigrationReport {
            migration_id,
            started_at,
            completed_at,
            duration_seconds,
            source_provider: source_id.provider,
            source_host_redacted: source_parsed.host,
            source_dbname: source_id.dbname,
            destination_provider: dest_id.provider,
            destination_host_redacted: dest_parsed.host,
            destination_dbname: dest_id.dbname,
            source_postgres_version: source_id.server_version,
            destination_postgres_version: dest_id.server_version,
            pg_dump_version: dump_tool.version,
            pg_restore_version: restore_tool.version,
            dump_size_bytes: dump_res.file_size_bytes,
            dump_size_formatted: format!("{:.2} MB", dump_res.file_size_bytes as f64 / (1024.0 * 1024.0)),
            status: verification_summary.status.clone(),
            verification_mode: VerificationMode::STANDARD,
            verification_summary,
            logs: dump_res.logs.into_iter().chain(restore_res.logs.into_iter()).collect(),
            dump_file_retained: keep_backup,
            dump_file_path: if keep_backup { Some(dump_path_str) } else { None },
        };

        emit_progress(&app, MigrationStage::COMPLETED, "Migration workflow complete!".to_string(), duration_seconds);
        let _ = app.emit("migration://complete", report.clone());

        Ok(report)
    }
}
