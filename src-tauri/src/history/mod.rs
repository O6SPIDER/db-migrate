use crate::migration::engine::MigrationReport;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryRecord {
    pub migration_id: String,
    pub timestamp: String,
    pub source_provider: String,
    pub source_host: String,
    pub source_dbname: String,
    pub destination_provider: String,
    pub destination_host: String,
    pub destination_dbname: String,
    pub source_version: String,
    pub destination_version: String,
    pub pg_dump_version: String,
    pub status: String,
    pub duration_seconds: u64,
    pub dump_size_formatted: String,
}

pub struct HistoryStore {
    file_path: PathBuf,
}

impl HistoryStore {
    pub fn new() -> Self {
        let app_dir = dirs_next::data_dir()
            .unwrap_or_else(|| std::env::temp_dir())
            .join("db-migrate");
        let _ = fs::create_dir_all(&app_dir);
        let file_path = app_dir.join("migration_history.json");

        HistoryStore { file_path }
    }

    pub fn load_all(&self) -> Vec<HistoryRecord> {
        if !self.file_path.exists() {
            return Vec::new();
        }

        if let Ok(mut file) = File::open(&self.file_path) {
            let mut contents = String::new();
            if file.read_to_string(&mut contents).is_ok() {
                if let Ok(records) = serde_json::from_str::<Vec<HistoryRecord>>(&contents) {
                    return records;
                }
            }
        }

        Vec::new()
    }

    pub fn save_record(&self, report: &MigrationReport) -> Result<(), String> {
        let mut records = self.load_all();

        let new_rec = HistoryRecord {
            migration_id: report.migration_id.clone(),
            timestamp: report.started_at.clone(),
            source_provider: report.source_provider.clone(),
            source_host: report.source_host_redacted.clone(),
            source_dbname: report.source_dbname.clone(),
            destination_provider: report.destination_provider.clone(),
            destination_host: report.destination_host_redacted.clone(),
            destination_dbname: report.destination_dbname.clone(),
            source_version: report.source_postgres_version.clone(),
            destination_version: report.destination_postgres_version.clone(),
            pg_dump_version: report.pg_dump_version.clone(),
            status: format!("{:?}", report.status),
            duration_seconds: report.duration_seconds,
            dump_size_formatted: report.dump_size_formatted.clone(),
        };

        records.insert(0, new_rec);

        let json = serde_json::to_string_pretty(&records).map_err(|e| e.to_string())?;
        let mut file = File::create(&self.file_path).map_err(|e| e.to_string())?;
        file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn clear(&self) -> Result<(), String> {
        if self.file_path.exists() {
            let _ = fs::remove_file(&self.file_path);
        }
        Ok(())
    }
}
