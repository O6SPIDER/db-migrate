use crate::postgres::discovery::PostgresTool;
use crate::security::credential::{ParsedPostgresUrl, TempPgPassFile};
use crate::security::redaction::redact_text;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

pub struct DumpTaskResult {
    pub dump_file_path: PathBuf,
    pub file_size_bytes: u64,
    pub duration_secs: u64,
    pub logs: Vec<String>,
}

pub struct DumpExecutor;

impl DumpExecutor {
    pub fn execute_dump<F>(
        tool: &PostgresTool,
        source_url: &ParsedPostgresUrl,
        output_dir: &PathBuf,
        cancel_flag: Arc<AtomicBool>,
        log_callback: F,
    ) -> Result<DumpTaskResult, String>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        let start_time = Instant::now();

        // 1. Create short-lived temporary PGPASSFILE
        let temp_pgpass = TempPgPassFile::create(source_url)
            .map_err(|e| format!("Failed to initialize credential passfile: {}", e))?;

        // 2. Generate dump file destination
        let dump_filename = format!(
            "migration-{}-{}.dump",
            chrono::Local::now().format("%Y%m%d-%H%M%S"),
            uuid::Uuid::new_v4().simple().to_string().chars().take(8).collect::<String>()
        );
        let dump_file_path = output_dir.join(dump_filename);

        // 3. Build command with explicit individual arguments
        let mut cmd = Command::new(&tool.path);
        cmd.arg("-Fc") // Custom archive format
           .arg("-f").arg(&dump_file_path)
           .arg("-h").arg(&source_url.host)
           .arg("-p").arg(source_url.port.to_string())
           .arg("-U").arg(&source_url.username)
           .arg("-d").arg(&source_url.dbname);

        // Set PGPASSFILE environment variable
        cmd.env("PGPASSFILE", &temp_pgpass.path);
        if let Some(ref ssl) = source_url.sslmode {
            cmd.env("PGSSLMODE", ssl);
        }

        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        log_callback(format!("[DUMP] Spawning {} (custom archive)...", tool.path));

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to execute pg_dump process ({}): {}", tool.path, redact_text(&e.to_string())))?;

        let mut captured_logs = Vec::new();

        // Read stderr output stream
        if let Some(stderr) = child.stderr.take() {
            let reader = BufReader::new(stderr);
            for line_res in reader.lines() {
                if cancel_flag.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    return Err("Migration cancelled by user during pg_dump.".to_string());
                }

                if let Ok(line) = line_res {
                    let sanitized = redact_text(&line);
                    log_callback(format!("[pg_dump] {}", sanitized));
                    captured_logs.push(sanitized);
                }
            }
        }

        let status = child
            .wait()
            .map_err(|e| format!("Error waiting for pg_dump process: {}", redact_text(&e.to_string())))?;

        if !status.success() {
            let code = status.code().unwrap_or(-1);
            return Err(format!("pg_dump failed with exit code {}.", code));
        }

        if !dump_file_path.exists() {
            return Err("pg_dump process completed but target dump archive was not created.".to_string());
        }

        let metadata = std::fs::metadata(&dump_file_path)
            .map_err(|e| format!("Failed to read dump file metadata: {}", e))?;

        let file_size_bytes = metadata.len();
        let duration_secs = start_time.elapsed().as_secs();

        log_callback(format!(
            "[DUMP] Archive completed successfully: {} ({:.2} MB) in {}s",
            dump_file_path.file_name().unwrap_or_default().to_string_lossy(),
            file_size_bytes as f64 / (1024.0 * 1024.0),
            duration_secs
        ));

        Ok(DumpTaskResult {
            dump_file_path,
            file_size_bytes,
            duration_secs,
            logs: captured_logs,
        })
    }
}
