use crate::security::credential::ParsedPostgresUrl;
use native_tls::TlsConnector;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio_postgres::NoTls;
use postgres_native_tls::MakeTlsConnector;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafeDatabaseIdentity {
    pub provider: String,
    pub hostname: String,
    pub dbname: String,
    pub server_version: String,
    pub server_major_version: u32,
    pub database_size_bytes: i64,
    pub database_size_formatted: String,
    pub schema_count: usize,
    pub table_count: usize,
    pub estimated_total_rows: u64,
    pub ssl_enabled: bool,
    pub is_pooled: bool,
    pub pooled_warning: Option<String>,
    pub existing_tables_warning: Option<String>,
    pub db_system_identifier: Option<String>,
}

pub struct ConnectionTester;

impl ConnectionTester {
    pub async fn test_connection(url: &ParsedPostgresUrl) -> Result<SafeDatabaseIdentity, String> {
        // Attempt connection using tokio-postgres
        // Config construction
        let mut config = tokio_postgres::Config::new();
        config.host(&url.host);
        config.port(url.port);
        config.dbname(&url.dbname);
        config.user(&url.username);
        if let Some(ref pwd) = url.password {
            config.password(pwd);
        }
        config.connect_timeout(Duration::from_secs(8));

        let is_ssl_disabled = url.sslmode.as_deref() == Some("disable");

        let client = if !is_ssl_disabled {
            let cx = TlsConnector::builder()
                .build()
                .map_err(|e| format!("TLS init error: {}", e))?;
            let tls = MakeTlsConnector::new(cx);

            match config.connect(tls).await {
                Ok((c, conn)) => {
                    tokio::spawn(async move {
                        if let Err(e) = conn.await {
                            eprintln!("PostgreSQL connection error: {}", e);
                        }
                    });
                    c
                }
                Err(tls_err) => {
                    if url.sslmode.as_deref() == Some("require")
                        || url.provider == "Neon"
                        || url.provider == "Supabase"
                    {
                        return Err(format!(
                            "Database connection failed: {}",
                            crate::security::redaction::redact_text(&tls_err.to_string())
                        ));
                    }
                    let (c, conn) = config.connect(NoTls).await.map_err(|e| {
                        format!(
                            "Database connection failed: {}",
                            crate::security::redaction::redact_text(&e.to_string())
                        )
                    })?;
                    tokio::spawn(async move {
                        if let Err(e) = conn.await {
                            eprintln!("PostgreSQL connection error: {}", e);
                        }
                    });
                    c
                }
            }
        } else {
            let (c, conn) = config.connect(NoTls).await.map_err(|e| {
                format!(
                    "Database connection failed: {}",
                    crate::security::redaction::redact_text(&e.to_string())
                )
            })?;
            tokio::spawn(async move {
                if let Err(e) = conn.await {
                    eprintln!("PostgreSQL connection error: {}", e);
                }
            });
            c
        };

        // 1. Fetch Version
        let version_row = client
            .query_one("SELECT version()", &[])
            .await
            .map_err(|e| format!("Query version failed: {}", e))?;
        let full_version: String = version_row.get(0);
        let server_version = extract_server_version(&full_version);
        let server_major_version = parse_major_version(&server_version);

        // 2. Database Size
        let size_row = client
            .query_one("SELECT pg_database_size(current_database())", &[])
            .await
            .map_err(|e| format!("Query size failed: {}", e))?;
        let database_size_bytes: i64 = size_row.get(0);
        let database_size_formatted = format_bytes(database_size_bytes);

        // 3. User Schemas Count
        let schemas_row = client
            .query_one(
                "SELECT count(*)::int FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .map_err(|e| format!("Query schemas failed: {}", e))?;
        let schema_count: i32 = schemas_row.get(0);

        // 4. Tables Count (excluding system schemas)
        let tables_row = client
            .query_one(
                "SELECT count(*)::int FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast') AND table_type = 'BASE TABLE'",
                &[],
            )
            .await
            .map_err(|e| format!("Query tables failed: {}", e))?;
        let table_count: i32 = tables_row.get(0);

        // 5. Estimated Total Rows (from pg_stat_user_tables)
        let rows_row = client
            .query_one(
                "SELECT COALESCE(sum(n_live_tup)::bigint, 0) FROM pg_stat_user_tables",
                &[],
            )
            .await
            .ok();
        let estimated_total_rows: u64 = rows_row.map(|r| r.get::<_, i64>(0) as u64).unwrap_or(0);

        // 6. SSL Check
        let ssl_enabled = client
            .query_one("SHOW ssl", &[])
            .await
            .ok()
            .map(|r| {
                let val: String = r.get(0);
                val.eq_ignore_ascii_case("on") || val.eq_ignore_ascii_case("true")
            })
            .unwrap_or(url.sslmode.as_deref() == Some("require"));

        // 7. System Identifier (for exact same database comparison)
        let db_system_identifier = client
            .query_one("SELECT system_identifier::text FROM pg_control_system()", &[])
            .await
            .ok()
            .map(|r| r.get(0));

        let existing_tables_warning = if table_count > 0 {
            Some(format!(
                "Destination contains {} existing user table{}. Restoring into a non-empty database can cause conflicts or modify existing objects.",
                table_count,
                if table_count > 1 { "s" } else { "" }
            ))
        } else {
            None
        };

        Ok(SafeDatabaseIdentity {
            provider: url.provider.clone(),
            hostname: url.host.clone(),
            dbname: url.dbname.clone(),
            server_version,
            server_major_version,
            database_size_bytes,
            database_size_formatted,
            schema_count: schema_count as usize,
            table_count: table_count as usize,
            estimated_total_rows,
            ssl_enabled,
            is_pooled: url.is_pooled,
            pooled_warning: url.pooled_warning.clone(),
            existing_tables_warning,
            db_system_identifier,
        })
    }

    pub fn are_same_database(source: &SafeDatabaseIdentity, dest: &SafeDatabaseIdentity) -> bool {
        // Compare hostname, dbname, and system_identifier if present
        if source.hostname.to_lowercase() == dest.hostname.to_lowercase()
            && source.dbname.to_lowercase() == dest.dbname.to_lowercase()
        {
            return true;
        }

        if let (Some(s_id), Some(d_id)) = (&source.db_system_identifier, &dest.db_system_identifier) {
            if s_id == d_id && !s_id.is_empty() {
                return true;
            }
        }

        false
    }
}

fn extract_server_version(full: &str) -> String {
    // Example: "PostgreSQL 18.4 (Ubuntu 18.4-1.pgdg22.04+1) on x86_64..." -> "18.4"
    let re = regex::Regex::new(r"PostgreSQL\s+([0-9]+\.[0-9]+)").unwrap();
    if let Some(caps) = re.captures(full) {
        if let Some(m) = caps.get(1) {
            return m.as_str().to_string();
        }
    }
    "18.0".to_string()
}

fn parse_major_version(v: &str) -> u32 {
    v.split('.').next().unwrap_or("18").parse::<u32>().unwrap_or(18)
}

fn format_bytes(bytes: i64) -> String {
    if bytes < 0 {
        return "0 B".to_string();
    }
    let b = bytes as f64;
    if b < 1024.0 {
        format!("{} B", bytes)
    } else if b < 1024.0 * 1024.0 {
        format!("{:.2} KB", b / 1024.0)
    } else if b < 1024.0 * 1024.0 * 1024.0 {
        format!("{:.2} MB", b / (1024.0 * 1024.0))
    } else {
        format!("{:.2} GB", b / (1024.0 * 1024.0 * 1024.0))
    }
}
