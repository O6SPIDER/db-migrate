use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostgresTool {
    pub name: String, // "pg_dump", "pg_restore", "psql"
    pub version: String, // "18.6"
    pub major_version: u32, // 18
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolchainSelection {
    pub selected_dump: Option<PostgresTool>,
    pub selected_restore: Option<PostgresTool>,
    pub selected_psql: Option<PostgresTool>,
    pub compatible: bool,
    pub incompatibility_reason: Option<String>,
    pub available_dumps: Vec<PostgresTool>,
    pub available_restores: Vec<PostgresTool>,
    pub available_psqls: Vec<PostgresTool>,
}

pub struct ToolDiscoverer;

impl ToolDiscoverer {
    pub fn discover_all() -> (Vec<PostgresTool>, Vec<PostgresTool>, Vec<PostgresTool>) {
        let mut dumps = Vec::new();
        let mut restores = Vec::new();
        let mut psqls = Vec::new();

        let search_dirs = get_search_directories();

        for dir in search_dirs {
            // Check pg_dump
            let dump_path = dir.join(get_executable_name("pg_dump"));
            if dump_path.exists() {
                if let Some(tool) = inspect_tool("pg_dump", &dump_path) {
                    if !dumps.iter().any(|t: &PostgresTool| t.path == tool.path) {
                        dumps.push(tool);
                    }
                }
            }

            // Check pg_restore
            let restore_path = dir.join(get_executable_name("pg_restore"));
            if restore_path.exists() {
                if let Some(tool) = inspect_tool("pg_restore", &restore_path) {
                    if !restores.iter().any(|t: &PostgresTool| t.path == tool.path) {
                        restores.push(tool);
                    }
                }
            }

            // Check psql
            let psql_path = dir.join(get_executable_name("psql"));
            if psql_path.exists() {
                if let Some(tool) = inspect_tool("psql", &psql_path) {
                    if !psqls.iter().any(|t: &PostgresTool| t.path == tool.path) {
                        psqls.push(tool);
                    }
                }
            }
        }

        (dumps, restores, psqls)
    }

    pub fn select_toolchain(source_server_version: &str) -> ToolchainSelection {
        let (dumps, restores, psqls) = Self::discover_all();
        let source_major = parse_major_version(source_server_version).unwrap_or(0);

        // Find compatible pg_dump: major_version >= source_major
        // Prefer exact or closest higher major version
        let mut compatible_dumps: Vec<_> = dumps
            .iter()
            .filter(|t| t.major_version >= source_major)
            .cloned()
            .collect();
        compatible_dumps.sort_by_key(|t| t.major_version);

        let selected_dump = compatible_dumps.first().cloned();

        // For restore, select corresponding or closest higher version
        let dump_major = selected_dump.as_ref().map(|d| d.major_version).unwrap_or(source_major);
        let mut compatible_restores: Vec<_> = restores
            .iter()
            .filter(|t| t.major_version >= dump_major)
            .cloned()
            .collect();
        compatible_restores.sort_by_key(|t| t.major_version);

        let selected_restore = compatible_restores.first().cloned();

        let mut compatible_psqls: Vec<_> = psqls.iter().cloned().collect();
        compatible_psqls.sort_by_key(|t| t.major_version);
        let selected_psql = compatible_psqls.last().cloned();

        let mut compatible = true;
        let mut incompatibility_reason = None;

        if selected_dump.is_none() {
            compatible = false;
            let highest_detected = dumps.iter().map(|d| d.version.as_str()).max().unwrap_or("none");
            incompatibility_reason = Some(format!(
                "Source database requires PostgreSQL {} or newer, but highest detected pg_dump is {}.",
                source_major, highest_detected
            ));
        } else if selected_restore.is_none() {
            compatible = false;
            incompatibility_reason = Some("No compatible pg_restore executable was found on system.".to_string());
        }

        ToolchainSelection {
            selected_dump,
            selected_restore,
            selected_psql,
            compatible,
            incompatibility_reason,
            available_dumps: dumps,
            available_restores: restores,
            available_psqls: psqls,
        }
    }
}

fn get_executable_name(base: &str) -> String {
    if cfg!(target_os = "windows") {
        format!("{}.exe", base)
    } else {
        base.to_string()
    }
}

fn get_search_directories() -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    // 1. System PATH
    if let Ok(path_var) = std::env::var("PATH") {
        for p in std::env::split_paths(&path_var) {
            if p.exists() && !dirs.contains(&p) {
                dirs.push(p);
            }
        }
    }

    // 2. Standard Linux / macOS paths
    let standard_paths = [
        "/usr/bin",
        "/usr/local/bin",
        "/opt/homebrew/bin",
        "/usr/lib/postgresql/18/bin",
        "/usr/lib/postgresql/17/bin",
        "/usr/lib/postgresql/16/bin",
        "/usr/lib/postgresql/15/bin",
        "/usr/lib/postgresql/14/bin",
    ];

    for p in &standard_paths {
        let pb = PathBuf::from(p);
        if pb.exists() && !dirs.contains(&pb) {
            dirs.push(pb);
        }
    }

    // 3. Windows standard PostgreSQL directories
    #[cfg(target_os = "windows")]
    {
        let prog_files = [
            "C:\\Program Files\\PostgreSQL",
            "C:\\Program Files (x86)\\PostgreSQL",
        ];
        for base in &prog_files {
            let base_path = Path::new(base);
            if base_path.exists() {
                if let Ok(entries) = std::fs::read_dir(base_path) {
                    for entry in entries.flatten() {
                        let bin_dir = entry.path().join("bin");
                        if bin_dir.exists() && !dirs.contains(&bin_dir) {
                            dirs.push(bin_dir);
                        }
                    }
                }
            }
        }
    }

    dirs
}

fn inspect_tool(name: &str, executable_path: &Path) -> Option<PostgresTool> {
    let output = Command::new(executable_path).arg("--version").output().ok()?;

    if !output.status.success() {
        return None;
    }

    let version_str = String::from_utf8_lossy(&output.stdout);
    let parsed_version = extract_version_number(&version_str)?;
    let major = parse_major_version(&parsed_version)?;

    Some(PostgresTool {
        name: name.to_string(),
        version: parsed_version,
        major_version: major,
        path: executable_path.to_string_lossy().to_string(),
    })
}

fn extract_version_number(output_str: &str) -> Option<String> {
    // Example: "pg_dump (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)" -> "18.6"
    // Example: "pg_dump (PostgreSQL) 17.2" -> "17.2"
    let re = regex::Regex::new(r"\(PostgreSQL\)\s+([0-9]+(?:\.[0-9]+)?)").ok()?;
    if let Some(captures) = re.captures(output_str) {
        return captures.get(1).map(|m| m.as_str().to_string());
    }

    // Generic digits fallback
    let re2 = regex::Regex::new(r"([0-9]+\.[0-9]+)").ok()?;
    if let Some(captures) = re2.captures(output_str) {
        return captures.get(1).map(|m| m.as_str().to_string());
    }

    None
}

fn parse_major_version(version_str: &str) -> Option<u32> {
    let parts: Vec<&str> = version_str.split('.').collect();
    parts.first()?.parse::<u32>().ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_version_number() {
        let line = "pg_dump (PostgreSQL) 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)";
        assert_eq!(extract_version_number(line).unwrap(), "18.6");

        let line2 = "pg_restore (PostgreSQL) 17.4";
        assert_eq!(extract_version_number(line2).unwrap(), "17.4");
    }

    #[test]
    fn test_parse_major_version() {
        assert_eq!(parse_major_version("18.6"), Some(18));
        assert_eq!(parse_major_version("17.4.2"), Some(17));
    }
}
