use crate::postgres::discovery::PostgresTool;
use crate::security::credential::{ParsedPostgresUrl, TempPgPassFile};
use crate::security::redaction::redact_text;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

pub struct RestoreTaskResult {
    pub duration_secs: u64,
    pub logs: Vec<String>,
}

pub struct RestoreExecutor;

impl RestoreExecutor {
    pub fn execute_restore<F>(
        tool: &PostgresTool,
        dest_url: &ParsedPostgresUrl,
        dump_file_path: &PathBuf,
        cancel_flag: Arc<AtomicBool>,
        log_callback: F,
    ) -> Result<RestoreTaskResult, String>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        let start_time = Instant::now();

        // 1. Create short-lived temporary PGPASSFILE for destination
        let temp_pgpass = TempPgPassFile::create(dest_url)
            .map_err(|e| format!("Failed to initialize destination credential passfile: {}", e))?;

        // 2. Build pg_restore command with explicit argument vector
        let mut cmd = Command::new(&tool.path);
        cmd.arg("--no-owner")
           .arg("--no-acl")
           .arg("-h").arg(&dest_url.host)
           .arg("-p").arg(dest_url.port.to_string())
           .arg("-U").arg(&dest_url.username)
           .arg("-d").arg(&dest_url.dbname)
           .arg(dump_file_path);

        cmd.env("PGPASSFILE", &temp_pgpass.path);
        if let Some(ref ssl) = dest_url.sslmode {
            cmd.env("PGSSLMODE", ssl);
        }

        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        log_callback(format!("[RESTORE] Spawning {} into target database...", tool.path));

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to execute pg_restore process ({}): {}", tool.path, redact_text(&e.to_string())))?;

        let mut captured_logs = Vec::new();

        // Read stderr output stream (pg_restore emits diagnostics to stderr)
        if let Some(stderr) = child.stderr.take() {
            let reader = BufReader::new(stderr);
            for line_res in reader.lines() {
                if cancel_flag.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    return Err("Migration cancelled by user during pg_restore.".to_string());
                }

                if let Ok(line) = line_res {
                    let sanitized = redact_text(&line);
                    log_callback(format!("[pg_restore] {}", sanitized));
                    captured_logs.push(sanitized);
                }
            }
        }

        let status = child
            .wait()
            .map_err(|e| format!("Error waiting for pg_restore process: {}", redact_text(&e.to_string())))?;

        // pg_restore can exit with status 1 for minor non-fatal warnings (e.g. relation already exists)
        let exit_code = status.code().unwrap_or(-1);
        if exit_code > 1 {
            return Err(format!("pg_restore failed with exit code {}.", exit_code));
        }

        let duration_secs = start_time.elapsed().as_secs();

        log_callback(format!(
            "[RESTORE] Completed with status code {} in {}s",
            exit_code, duration_secs
        ));

        Ok(RestoreTaskResult {
            duration_secs,
            logs: captured_logs,
        })
    }
}
