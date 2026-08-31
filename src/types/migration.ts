export type ProviderType =
  | 'Neon'
  | 'Supabase'
  | 'Railway'
  | 'Render'
  | 'AWS RDS'
  | 'Azure Database for PostgreSQL'
  | 'Google Cloud SQL'
  | 'DigitalOcean'
  | 'Localhost / Custom'
  | 'PostgreSQL';

export interface SafeDatabaseIdentity {
  provider: ProviderType;
  hostname: string;
  dbname: string;
  server_version: string;
  server_major_version: number;
  database_size_bytes: number;
  database_size_formatted: string;
  schema_count: number;
  table_count: number;
  estimated_total_rows: number;
  ssl_enabled: boolean;
  is_pooled: boolean;
  pooled_warning?: string;
  existing_tables_warning?: string;
  db_system_identifier?: string;
}

export interface TableDetail {
  schema_name: string;
  table_name: string;
  estimated_rows: number;
  exact_rows?: number;
}

export interface DatabaseInspection {
  server_version: string;
  size_bytes: number;
  size_formatted: string;
  user_schemas: string[];
  tables: TableDetail[];
  views_count: number;
  mat_views_count: number;
  indexes_count: number;
  sequences_count: number;
  foreign_keys_count: number;
  functions_count: number;
  triggers_count: number;
  extensions: string[];
}

export interface PostgresTool {
  name: string;
  version: string;
  major_version: number;
  path: string;
}

export interface ToolchainSelection {
  selected_dump?: PostgresTool;
  selected_restore?: PostgresTool;
  selected_psql?: PostgresTool;
  compatible: boolean;
  incompatibility_reason?: string;
  available_dumps: PostgresTool[];
  available_restores: PostgresTool[];
  available_psqls: PostgresTool[];
}

export type MigrationStage =
  | 'DRAFT'
  | 'VALIDATING'
  | 'PREFLIGHT'
  | 'REVIEW'
  | 'DUMPING'
  | 'RESTORING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ProgressEvent {
  stage: MigrationStage;
  activity: string;
  elapsed_seconds: number;
}

export interface LogEvent {
  timestamp: string;
  message: string;
}

export type VerificationMode = 'STANDARD' | 'DEEP';

export type VerificationStatus =
  | 'VERIFIED'
  | 'VERIFIED_WITH_WARNINGS'
  | 'FAILED_VERIFICATION';

export interface TableVerification {
  schema_name: string;
  table_name: string;
  source_count: number;
  dest_count: number;
  matched: boolean;
}

export interface VerificationSummary {
  mode: VerificationMode;
  status: VerificationStatus;
  message: string;
  schemas_match: boolean;
  tables_match: boolean;
  views_match: boolean;
  indexes_match: boolean;
  sequences_match: boolean;
  foreign_keys_match: boolean;
  functions_match: boolean;
  extensions_match: boolean;
  tables: TableVerification[];
  warnings: string[];
}

export interface MigrationReport {
  migration_id: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  source_provider: string;
  source_host_redacted: string;
  source_dbname: string;
  destination_provider: string;
  destination_host_redacted: string;
  destination_dbname: string;
  source_postgres_version: string;
  destination_postgres_version: string;
  pg_dump_version: string;
  pg_restore_version: string;
  dump_size_bytes: number;
  dump_size_formatted: string;
  status: VerificationStatus;
  verification_mode: VerificationMode;
  verification_summary: VerificationSummary;
  logs: string[];
  dump_file_retained: boolean;
  dump_file_path?: string;
}

export interface HistoryRecord {
  migration_id: string;
  timestamp: string;
  source_provider: string;
  source_host: string;
  source_dbname: string;
  destination_provider: string;
  destination_host: string;
  destination_dbname: string;
  source_version: string;
  destination_version: string;
  pg_dump_version: string;
  status: string;
  duration_seconds: number;
  dump_size_formatted: string;
}
