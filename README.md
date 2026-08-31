# DB Migrate - Production PostgreSQL Database Migration Tool

**DB Migrate** is a production-grade desktop application built with **Tauri 2, React, TypeScript, Vite, Tailwind CSS, and Rust**. It allows developers to migrate an entire PostgreSQL database safely between database servers by providing exactly two PostgreSQL connection URLs:

1. **SOURCE DATABASE URL**
2. **DESTINATION DATABASE URL**

Targeted specifically for migrating databases across providers like **Neon**, **Supabase**, **Railway**, **Render**, **AWS RDS**, **Azure PostgreSQL**, **Google Cloud SQL**, **DigitalOcean**, and standard custom/localhost PostgreSQL instances.

---

## 🌟 Key Features

* **CLI Credential Isolation (`PGPASSFILE`)**: Plaintext passwords are **never** passed as command-line arguments to child processes (`pg_dump` or `pg_restore`). Subprocesses run with individual argument vectors and receive credentials via short-lived temporary `PGPASSFILE` files (`0600` permissions on Unix/Linux) that are immediately deleted post-execution.
* **Defense-In-Depth Redaction**: Centralized redaction masks passwords as `••••••••` across all application logs, frontend displays, exported reports, and local migration history.
* **Smart Tooling Discovery & Major Version Protection**: Automatically discovers installed `pg_dump`, `pg_restore`, and `psql` binaries (searching `PATH`, Linux `/usr/bin`, `/usr/lib/postgresql/*/bin`, Windows `C:\Program Files\PostgreSQL*\bin`, macOS `/opt/homebrew/bin`). Enforces that `pg_dump` major version $\ge$ Source server major version (e.g. auto-selects PostgreSQL 18 `pg_dump` when source is PostgreSQL 18.4).
* **Non-Destructive Dry Run Review**: Enforces a non-destructive pre-flight summary screen displaying `FROM` vs `TO` metadata, object counts, selected toolchain, and preflight checklist before reaching the point-of-no-return "Start Migration" button.
* **Destination Protection**: High-visibility warning when destination contains existing user tables. Requires explicit checkbox acknowledgment before proceeding and avoids applying `--clean` by default.
* **Dual-Level Verification Engine**:
  * **STANDARD**: Fast catalog statistics & structural object verification (avoiding expensive `SELECT COUNT(*)` queries on large production databases).
  * **DEEP**: Optional per-table exact row count verification (`COUNT(*)`), explicitly initiated by the user.
* **Neon Pooled Connection Detection**: Detects Neon `-pooler` endpoints and warns the user to switch to a direct connection for optimal dump/restore performance.

---

## 🏗️ Architecture & Technology Stack

```text
┌─────────────────────────────────────────────────────────────┐
│ React + TypeScript + Tailwind CSS Frontend (Vite)          │
│ - Source & Destination URL Cards with Password Masking     │
│ - Toolchain & Preflight Validation Components               │
│ - Non-Destructive Dry Run Review Screen                     │
│ - Live Stepper, Elapsed Timer, Sanitized Log Viewer         │
│ - Exportable JSON & Text Migration Audit Reports            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Tauri IPC Commands & Events
┌──────────────────────────────▼──────────────────────────────┐
│ Tauri 2 Rust Backend                                        │
│ - credential.rs: URL parser & short-lived PGPASSFILE        │
│ - redaction.rs: Regex-based defense-in-depth redactor       │
│ - connection.rs: Async connection validation & identity     │
│ - discovery.rs: Tool discovery & major version selection    │
│ - inspection.rs: Read-only schema & catalog inspection      │
│ - dump.rs & restore.rs: Process execution & event streaming │
│ - verification.rs: Standard & Deep row count comparison     │
│ - history/mod.rs: Sanitized local SQLite/JSON history store │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Prerequisites

1. **Node.js**: v18+ & `npm`
2. **Rust Toolchain**: `rustc` & `cargo` (v1.75+)
3. **PostgreSQL Client Tools**: `pg_dump` and `pg_restore` (v18+ recommended for Neon PostgreSQL 18).

---

## 🛠️ Development Setup

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

2. **Run TypeScript & Code Quality Checks**:
   ```bash
   npm run check
   npm test
   ```

3. **Build Frontend Bundle**:
   ```bash
   npm run build
   ```

4. **Launch Application in Development Mode**:
   ```bash
   npm run tauri dev
   ```

5. **Run Rust Unit Tests**:
   ```bash
   cargo test --manifest-path src-tauri/Cargo.toml
   ```

---

## 🔒 Security Model

* **Local Execution Only**: Credentials and dump archives stay entirely on your local machine. No remote server telemetry or credential transmission.
* **Process Argument Isolation**: `pg_dump` and `pg_restore` are invoked via direct process argument vectors (`std::process::Command`), preventing shell injection vulnerabilities (`sh -c` / `cmd /c`).
* **Short-lived Credentials**: Passwords are supplied strictly via `PGPASSFILE` created in OS temp directory with restricted permissions (`0600`). Files are purged immediately after subprocess completion.
* **Redaction Utility**: All string outputs pass through `redact_url()` / `redact_text()`, stripping plaintext secrets before reaching UI logs, files, or exported reports.

---

## 📜 Migration Lifecycle

1. **Validate**: Connect to Source & Destination, fetch version, DB size, and object counts.
2. **Inspect**: Scan schemas, tables, indexes, views, foreign keys, and extensions.
3. **Tool Discovery**: Auto-select compatible `pg_dump` & `pg_restore` binaries.
4. **Dry Run Review**: Review summary card, toolchain details, and acknowledgment flags.
5. **Dump**: Execute `pg_dump -Fc` custom format archive to temporary storage.
6. **Restore**: Execute `pg_restore --no-owner --no-acl` into destination.
7. **Verify**: Execute structural catalog verification and table row checks.
8. **Report**: Export sanitized JSON or text report.

---

## 📄 License

MIT License. Built for production PostgreSQL database migrations.
