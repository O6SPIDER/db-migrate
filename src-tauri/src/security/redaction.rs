use regex::Regex;
use std::sync::OnceLock;

static URL_PWD_REGEX: OnceLock<Regex> = OnceLock::new();
static QUERY_PARAM_REGEX: OnceLock<Regex> = OnceLock::new();

fn get_url_pwd_regex() -> &'static Regex {
    URL_PWD_REGEX.get_or_init(|| {
        Regex::new(r"(?i)(postgres(?:ql)?://[^:]+:)([^@]+)(@)").expect("Invalid regex pattern")
    })
}

fn get_query_param_regex() -> &'static Regex {
    QUERY_PARAM_REGEX.get_or_init(|| {
        Regex::new(r"(?i)(password|pass|pwd)=([^&]+)").expect("Invalid query param regex")
    })
}

/// Redacts any credentials present in arbitrary text strings, log outputs, or URLs.
/// Passwords are replaced with `••••••••`.
pub fn redact_text(input: &str) -> String {
    if input.is_empty() {
        return String::new();
    }

    let step1 = get_url_pwd_regex().replace_all(input, "${1}••••••••${3}");
    let step2 = get_query_param_regex().replace_all(&step1, "${1}=••••••••");
    step2.to_string()
}

/// Redacts a PostgreSQL URL safely into a display string.
/// Example: `postgresql://user:secret@ep-host.neon.tech/neondb`
/// -> `postgresql://user:••••••••@ep-host.neon.tech/neondb`
pub fn redact_url(url_str: &str) -> String {
    redact_text(url_str)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_redact_standard_postgres_url() {
        let raw = "postgresql://admin:SuperSecret123@ep-example.aws.neon.tech/neondb?sslmode=require";
        let redacted = redact_url(raw);
        assert!(!redacted.contains("SuperSecret123"));
        assert!(redacted.contains("postgresql://admin:••••••••@ep-example.aws.neon.tech/neondb"));
    }

    #[test]
    fn test_redact_postgres_scheme() {
        let raw = "postgres://john_doe:MyP%40ssw0rd!@localhost:5432/my_db";
        let redacted = redact_url(raw);
        assert!(!redacted.contains("MyP%40ssw0rd!"));
        assert!(redacted.contains("postgres://john_doe:••••••••@localhost:5432/my_db"));
    }

    #[test]
    fn test_redact_query_param_password() {
        let raw = "host=localhost port=5432 password=SecretPassword123 dbname=testdb";
        let redacted = redact_text(raw);
        assert!(!redacted.contains("SecretPassword123"));
        assert!(redacted.contains("password=••••••••"));
    }

    #[test]
    fn test_redact_arbitrary_log_line() {
        let raw = "Error connecting to postgresql://user:my_secret_pass@db.example.com:5432/prod_db: connection refused";
        let redacted = redact_text(raw);
        assert!(!redacted.contains("my_secret_pass"));
        assert!(redacted.contains("postgresql://user:••••••••@db.example.com:5432/prod_db"));
    }
}
