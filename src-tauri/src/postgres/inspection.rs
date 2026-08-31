use crate::security::credential::ParsedPostgresUrl;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio_postgres::NoTls;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableDetail {
    pub schema_name: String,
    pub table_name: String,
    pub estimated_rows: u64,
    pub exact_rows: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseInspection {
    pub server_version: String,
    pub size_bytes: i64,
    pub size_formatted: String,
    pub user_schemas: Vec<String>,
    pub tables: Vec<TableDetail>,
    pub views_count: usize,
    pub mat_views_count: usize,
    pub indexes_count: usize,
    pub sequences_count: usize,
    pub foreign_keys_count: usize,
    pub functions_count: usize,
    pub triggers_count: usize,
    pub extensions: Vec<String>,
}

pub struct Inspector;

impl Inspector {
    pub async fn inspect_database(url: &ParsedPostgresUrl) -> Result<DatabaseInspection, String> {
        let mut config = tokio_postgres::Config::new();
        config.host(&url.host);
        config.port(url.port);
        config.dbname(&url.dbname);
        config.user(&url.username);
        if let Some(ref pwd) = url.password {
            config.password(pwd);
        }
        config.connect_timeout(Duration::from_secs(8));

        let (client, connection) = config
            .connect(NoTls)
            .await
            .map_err(|e| format!("Inspection connection failed: {}", crate::security::redaction::redact_text(&e.to_string())))?;

        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("Inspection connection error: {}", e);
            }
        });

        // 1. Server Version
        let v_row = client.query_one("SELECT version()", &[]).await.map_err(|e| e.to_string())?;
        let full_version: String = v_row.get(0);
        let server_version = extract_ver(&full_version);

        // 2. Database Size
        let s_row = client.query_one("SELECT pg_database_size(current_database())", &[]).await.map_err(|e| e.to_string())?;
        let size_bytes: i64 = s_row.get(0);
        let size_formatted = format_bytes(size_bytes);

        // 3. User Schemas
        let schema_rows = client
            .query(
                "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?;
        let user_schemas: Vec<String> = schema_rows.iter().map(|r| r.get(0)).collect();

        // 4. Tables with estimated rows
        let table_rows = client
            .query(
                "SELECT t.table_schema, t.table_name, COALESCE(s.n_live_tup, 0) as est_rows \
                 FROM information_schema.tables t \
                 LEFT JOIN pg_stat_user_tables s ON s.schemaname = t.table_schema AND s.relname = t.table_name \
                 WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast') AND t.table_type = 'BASE TABLE' \
                 ORDER BY t.table_schema, t.table_name",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?;

        let tables: Vec<TableDetail> = table_rows
            .iter()
            .map(|r| {
                let schema_name: String = r.get(0);
                let table_name: String = r.get(1);
                let est_rows_i: i64 = r.get(2);
                TableDetail {
                    schema_name,
                    table_name,
                    estimated_rows: est_rows_i.max(0) as u64,
                    exact_rows: None,
                }
            })
            .collect();

        // 5. Views count
        let views_row = client
            .query_one(
                "SELECT count(*)::int FROM information_schema.views WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?;
        let views_count: i32 = views_row.get(0);

        // 6. Materialized Views count
        let mat_views_row = client
            .query_one(
                "SELECT count(*)::int FROM pg_matviews WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .ok();
        let mat_views_count: usize = mat_views_row.map(|r| r.get::<_, i32>(0) as usize).unwrap_or(0);

        // 7. Indexes count
        let idx_row = client
            .query_one(
                "SELECT count(*)::int FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?;
        let indexes_count: i32 = idx_row.get(0);

        // 8. Sequences count
        let seq_row = client
            .query_one(
                "SELECT count(*)::int FROM information_schema.sequences WHERE sequence_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?;
        let sequences_count: i32 = seq_row.get(0);

        // 9. Foreign keys count
        let fk_row = client
            .query_one(
                "SELECT count(*)::int FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND constraint_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?;
        let foreign_keys_count: i32 = fk_row.get(0);

        // 10. Functions count
        let func_row = client
            .query_one(
                "SELECT count(*)::int FROM information_schema.routines WHERE routine_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .map_err(|e| e.to_string())?;
        let functions_count: i32 = func_row.get(0);

        // 11. Triggers count
        let trig_row = client
            .query_one(
                "SELECT count(*)::int FROM information_schema.triggers WHERE trigger_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')",
                &[],
            )
            .await
            .ok();
        let triggers_count: usize = trig_row.map(|r| r.get::<_, i32>(0) as usize).unwrap_or(0);

        // 12. Extensions
        let ext_rows = client
            .query("SELECT extname FROM pg_extension ORDER BY extname", &[])
            .await
            .map_err(|e| e.to_string())?;
        let extensions: Vec<String> = ext_rows.iter().map(|r| r.get(0)).collect();

        Ok(DatabaseInspection {
            server_version,
            size_bytes,
            size_formatted,
            user_schemas,
            tables,
            views_count: views_count as usize,
            mat_views_count,
            indexes_count: indexes_count as usize,
            sequences_count: sequences_count as usize,
            foreign_keys_count: foreign_keys_count as usize,
            functions_count: functions_count as usize,
            triggers_count,
            extensions,
        })
    }
}

fn extract_ver(full: &str) -> String {
    let re = regex::Regex::new(r"PostgreSQL\s+([0-9]+\.[0-9]+)").unwrap();
    if let Some(caps) = re.captures(full) {
        if let Some(m) = caps.get(1) {
            return m.as_str().to_string();
        }
    }
    "18.0".to_string()
}

fn format_bytes(bytes: i64) -> String {
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
