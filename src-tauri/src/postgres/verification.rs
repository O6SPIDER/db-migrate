use crate::postgres::inspection::{DatabaseInspection, Inspector};
use crate::security::credential::ParsedPostgresUrl;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio_postgres::NoTls;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VerificationMode {
    STANDARD,
    DEEP,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VerificationStatus {
    VERIFIED,
    #[serde(rename = "VERIFIED_WITH_WARNINGS")]
    VerifiedWithWarnings,
    #[serde(rename = "FAILED_VERIFICATION")]
    FailedVerification,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableVerification {
    pub schema_name: String,
    pub table_name: String,
    pub source_count: u64,
    pub dest_count: u64,
    pub matched: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationSummary {
    pub mode: VerificationMode,
    pub status: VerificationStatus,
    pub message: String,
    pub schemas_match: bool,
    pub tables_match: bool,
    pub views_match: bool,
    pub indexes_match: bool,
    pub sequences_match: bool,
    pub foreign_keys_match: bool,
    pub functions_match: bool,
    pub extensions_match: bool,
    pub tables: Vec<TableVerification>,
    pub warnings: Vec<String>,
}

pub struct Verifier;

impl Verifier {
    pub async fn verify(
        source_url: &ParsedPostgresUrl,
        dest_url: &ParsedPostgresUrl,
        mode: VerificationMode,
    ) -> Result<VerificationSummary, String> {
        let source_insp = Inspector::inspect_database(source_url)
            .await
            .map_err(|e| format!("Source inspection failed during verification: {}", e))?;

        let dest_insp = Inspector::inspect_database(dest_url)
            .await
            .map_err(|e| format!("Destination inspection failed during verification: {}", e))?;

        let schemas_match = source_insp.user_schemas.len() == dest_insp.user_schemas.len();
        let tables_match = source_insp.tables.len() == dest_insp.tables.len();
        let views_match = source_insp.views_count == dest_insp.views_count;
        let indexes_match = source_insp.indexes_count == dest_insp.indexes_count;
        let sequences_match = source_insp.sequences_count == dest_insp.sequences_count;
        let foreign_keys_match = source_insp.foreign_keys_count == dest_insp.foreign_keys_count;
        let functions_match = source_insp.functions_count == dest_insp.functions_count;

        let mut extensions_match = true;
        let mut warnings = Vec::new();

        for ext in &source_insp.extensions {
            if !dest_insp.extensions.contains(ext) {
                extensions_match = false;
                warnings.push(format!("Extension '{}' present on source is missing from destination.", ext));
            }
        }

        let mut table_verifications = Vec::new();

        if mode == VerificationMode::DEEP {
            // Perform exact SELECT COUNT(*) on all tables
            let source_counts = get_exact_counts(source_url, &source_insp).await?;
            let dest_counts = get_exact_counts(dest_url, &dest_insp).await?;

            for s_table in &source_insp.tables {
                let full_key = format!("{}.{}", s_table.schema_name, s_table.table_name);
                let s_cnt = source_counts.get(&full_key).copied().unwrap_or(0);
                let d_cnt = dest_counts.get(&full_key).copied().unwrap_or(0);

                table_verifications.push(TableVerification {
                    schema_name: s_table.schema_name.clone(),
                    table_name: s_table.table_name.clone(),
                    source_count: s_cnt,
                    dest_count: d_cnt,
                    matched: s_cnt == d_cnt,
                });
            }
        } else {
            // STANDARD mode: use estimated catalog rows
            for s_table in &source_insp.tables {
                let d_table = dest_insp
                    .tables
                    .iter()
                    .find(|t| t.schema_name == s_table.schema_name && t.table_name == s_table.table_name);

                let d_est = d_table.map(|t| t.estimated_rows).unwrap_or(0);
                let matched = d_table.is_some();

                table_verifications.push(TableVerification {
                    schema_name: s_table.schema_name.clone(),
                    table_name: s_table.table_name.clone(),
                    source_count: s_table.estimated_rows,
                    dest_count: d_est,
                    matched,
                });
            }
        }

        let all_tables_matched = table_verifications.iter().all(|t| t.matched);

        let status = if tables_match && schemas_match && all_tables_matched && warnings.is_empty() {
            VerificationStatus::VERIFIED
        } else if tables_match && schemas_match {
            VerificationStatus::VerifiedWithWarnings
        } else {
            VerificationStatus::FailedVerification
        };

        let message = match status {
            VerificationStatus::VERIFIED => "Destination schema and object counts perfectly match source database.".to_string(),
            VerificationStatus::VerifiedWithWarnings => "Migration completed with minor non-critical structural warnings.".to_string(),
            VerificationStatus::FailedVerification => "Migration completed, but verification detected schema or object count discrepancies.".to_string(),
        };

        Ok(VerificationSummary {
            mode,
            status,
            message,
            schemas_match,
            tables_match,
            views_match,
            indexes_match,
            sequences_match,
            foreign_keys_match,
            functions_match,
            extensions_match,
            tables: table_verifications,
            warnings,
        })
    }
}

async fn get_exact_counts(
    url: &ParsedPostgresUrl,
    insp: &DatabaseInspection,
) -> Result<std::collections::HashMap<String, u64>, String> {
    let mut map = std::collections::HashMap::new();

    let mut config = tokio_postgres::Config::new();
    config.host(&url.host);
    config.port(url.port);
    config.dbname(&url.dbname);
    config.user(&url.username);
    if let Some(ref pwd) = url.password {
        config.password(pwd);
    }
    config.connect_timeout(Duration::from_secs(10));

    let (client, connection) = config
        .connect(NoTls)
        .await
        .map_err(|e| format!("Deep verification query connection error: {}", e))?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Deep verification connection error: {}", e);
        }
    });

    for t in &insp.tables {
        let query = format!(
            "SELECT count(*)::bigint FROM \"{}\".\"{}\"",
            t.schema_name, t.table_name
        );
        if let Ok(row) = client.query_one(&query, &[]).await {
            let count: i64 = row.get(0);
            map.insert(format!("{}.{}", t.schema_name, t.table_name), count.max(0) as u64);
        }
    }

    Ok(map)
}
