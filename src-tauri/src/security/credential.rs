use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use url::Url;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

#[derive(Debug, Clone)]
pub struct ParsedPostgresUrl {
    pub raw_url: String,
    pub scheme: String,
    pub username: String,
    pub password: Option<String>,
    pub host: String,
    pub port: u16,
    pub dbname: String,
    pub sslmode: Option<String>,
    pub redacted_url: String,
    pub provider: String,
    pub is_pooled: bool,
    pub pooled_warning: Option<String>,
}

impl ParsedPostgresUrl {
    pub fn parse(raw: &str) -> Result<Self, String> {
        let trimmed = raw.trim();
        if !trimmed.starts_with("postgresql://") && !trimmed.starts_with("postgres://") {
            return Err("URL must start with postgresql:// or postgres://".to_string());
        }

        let parsed = Url::parse(trimmed).map_err(|e| format!("Invalid URL syntax: {}", e))?;

        let scheme = parsed.scheme().to_string();
        let username = parsed.username().to_string();
        let password = parsed.password().map(|p| p.to_string());

        let host = parsed
            .host_str()
            .ok_or_else(|| "Missing hostname in URL".to_string())?
            .to_string();

        let port = parsed.port().unwrap_or(5432);

        let path = parsed.path().trim_start_matches('/');
        let dbname = if path.is_empty() {
            "postgres".to_string()
        } else {
            path.split('/').next().unwrap_or("postgres").to_string()
        };

        // Parse query params
        let mut sslmode = None;
        for (key, val) in parsed.query_pairs() {
            if key.eq_ignore_ascii_case("sslmode") {
                sslmode = Some(val.to_string());
            }
        }

        let provider = detect_provider(&host);
        let is_pooled = detect_pooled(&host);
        let pooled_warning = if is_pooled {
            Some(
                "This connection host appears to be a pooled endpoint (e.g., Neon connection pooler). Direct connections are recommended for pg_dump and pg_restore operations."
                    .to_string(),
            )
        } else {
            None
        };

        let redacted_url = crate::security::redaction::redact_url(trimmed);

        Ok(ParsedPostgresUrl {
            raw_url: trimmed.to_string(),
            scheme,
            username,
            password,
            host,
            port,
            dbname,
            sslmode,
            redacted_url,
            provider,
            is_pooled,
            pooled_warning,
        })
    }
}

fn detect_provider(host: &str) -> String {
    let lower = host.to_lowercase();
    if lower.contains("neon.tech") {
        "Neon".to_string()
    } else if lower.contains("supabase.co") || lower.contains("supabase.com") {
        "Supabase".to_string()
    } else if lower.contains("railway.app") || lower.contains("railway.internal") {
        "Railway".to_string()
    } else if lower.contains("render.com") {
        "Render".to_string()
    } else if lower.contains("rds.amazonaws.com") {
        "AWS RDS".to_string()
    } else if lower.contains("postgres.database.azure.com") {
        "Azure Database for PostgreSQL".to_string()
    } else if lower.contains("cloudsql") || lower.contains("google") {
        "Google Cloud SQL".to_string()
    } else if lower.contains("db.ondigitalocean.com") {
        "DigitalOcean".to_string()
    } else if lower == "localhost" || lower == "127.0.0.1" || lower == "::1" {
        "Localhost / Custom".to_string()
    } else {
        "PostgreSQL".to_string()
    }
}

fn detect_pooled(host: &str) -> bool {
    let lower = host.to_lowercase();
    lower.contains("-pooler") || lower.contains("pooler.") || lower.contains("pgbouncer")
}

/// Managed short-lived temporary PGPASSFILE for child process execution.
pub struct TempPgPassFile {
    pub path: PathBuf,
}

impl TempPgPassFile {
    pub fn create(url: &ParsedPostgresUrl) -> Result<Self, String> {
        let password = url.password.as_deref().unwrap_or("");

        // Format for .pgpass: hostname:port:database:username:password
        let host_entry = if url.host.is_empty() { "*" } else { &url.host };
        let port_entry = url.port.to_string();
        let db_entry = if url.dbname.is_empty() { "*" } else { &url.dbname };
        let user_entry = if url.username.is_empty() { "*" } else { &url.username };

        let content = format!("{}:{}:{}:{}:{}\n", host_entry, port_entry, db_entry, user_entry, password);

        let temp_dir = std::env::temp_dir();
        let file_name = format!("pgpass_{}_{}.conf", uuid::Uuid::new_v4().simple(), std::process::id());
        let file_path = temp_dir.join(file_name);

        let mut file = File::create(&file_path)
            .map_err(|e| format!("Failed to create temporary PGPASSFILE: {}", e))?;

        file.write_all(content.as_bytes())
            .map_err(|e| format!("Failed to write PGPASSFILE content: {}", e))?;

        file.flush().map_err(|e| format!("Failed to flush PGPASSFILE: {}", e))?;

        // Restrict file permissions (0600 on Unix)
        #[cfg(unix)]
        {
            let mut perms = fs::metadata(&file_path)
                .map_err(|e| format!("Failed to inspect PGPASSFILE permissions: {}", e))?
                .permissions();
            perms.set_mode(0o600);
            fs::set_permissions(&file_path, perms)
                .map_err(|e| format!("Failed to set 0600 permissions on PGPASSFILE: {}", e))?;
        }

        Ok(TempPgPassFile { path: file_path })
    }
}

impl Drop for TempPgPassFile {
    fn drop(&mut self) {
        if self.path.exists() {
            let _ = fs::remove_file(&self.path);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_neon_url() {
        let url_str = "postgresql://user_123:my_pass@ep-cool-name-123456-pooler.aws.neon.tech/neondb?sslmode=require";
        let parsed = ParsedPostgresUrl::parse(url_str).unwrap();

        assert_eq!(parsed.provider, "Neon");
        assert!(parsed.is_pooled);
        assert_eq!(parsed.username, "user_123");
        assert_eq!(parsed.password.unwrap(), "my_pass");
        assert_eq!(parsed.dbname, "neondb");
        assert_eq!(parsed.port, 5432);
        assert!(!parsed.redacted_url.contains("my_pass"));
    }

    #[test]
    fn test_create_and_cleanup_temp_pgpassfile() {
        let url_str = "postgresql://admin_user:secret_password@db.example.com:5432/production_db";
        let parsed = ParsedPostgresUrl::parse(url_str).unwrap();

        let path_copy;
        {
            let temp_pgpass = TempPgPassFile::create(&parsed).unwrap();
            assert!(temp_pgpass.path.exists());
            path_copy = temp_pgpass.path.clone();

            let content = fs::read_to_string(&path_copy).unwrap();
            assert!(content.contains("db.example.com:5432:production_db:admin_user:secret_password"));
        }

        // Must be automatically deleted upon drop
        assert!(!path_copy.exists());
    }
}
