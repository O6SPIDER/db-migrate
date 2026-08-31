import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  SafeDatabaseIdentity,
  ToolchainSelection,
  DatabaseInspection,
  MigrationReport,
  VerificationSummary,
  HistoryRecord,
  LogEvent,
  ProgressEvent,
} from '../types/migration';

// Check if running inside Tauri window
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function testConnectionApi(url: string): Promise<SafeDatabaseIdentity> {
  if (isTauriEnvironment()) {
    return await invoke<SafeDatabaseIdentity>('parse_and_test_connection', { url });
  }

  // Browser fixture fallback for UI testing without live DB
  const isNeon = url.includes('neon.tech');
  const isPooled = url.includes('-pooler');

  return {
    provider: isNeon ? 'Neon' : 'PostgreSQL',
    hostname: isNeon ? 'ep-production-instance-123456.aws.neon.tech' : 'db.example.internal',
    dbname: 'hexttel_db',
    server_version: '18.4',
    server_major_version: 18,
    database_size_bytes: 1954156544,
    database_size_formatted: '1.82 GB',
    schema_count: 4,
    table_count: 71,
    estimated_total_rows: 78678,
    ssl_enabled: true,
    is_pooled: isPooled,
    pooled_warning: isPooled
      ? 'This connection host appears to be a Neon pooled connection. Direct connections are recommended for PostgreSQL dump and restore operations.'
      : undefined,
    existing_tables_warning: undefined,
  };
}

export async function discoverToolsApi(sourceServerVersion?: string): Promise<ToolchainSelection> {
  if (isTauriEnvironment()) {
    return await invoke<ToolchainSelection>('discover_postgresql_tools', { sourceServerVersion });
  }

  // Browser fixture fallback
  return {
    selected_dump: {
      name: 'pg_dump',
      version: '18.6',
      major_version: 18,
      path: '/usr/bin/pg_dump',
    },
    selected_restore: {
      name: 'pg_restore',
      version: '18.6',
      major_version: 18,
      path: '/usr/bin/pg_restore',
    },
    selected_psql: {
      name: 'psql',
      version: '18.6',
      major_version: 18,
      path: '/usr/bin/psql',
    },
    compatible: true,
    available_dumps: [
      { name: 'pg_dump', version: '17.4', major_version: 17, path: '/usr/lib/postgresql/17/bin/pg_dump' },
      { name: 'pg_dump', version: '18.6', major_version: 18, path: '/usr/bin/pg_dump' },
    ],
    available_restores: [
      { name: 'pg_restore', version: '17.4', major_version: 17, path: '/usr/lib/postgresql/17/bin/pg_restore' },
      { name: 'pg_restore', version: '18.6', major_version: 18, path: '/usr/bin/pg_restore' },
    ],
    available_psqls: [
      { name: 'psql', version: '18.6', major_version: 18, path: '/usr/bin/psql' },
    ],
  };
}

export async function inspectDatabaseApi(url: string): Promise<DatabaseInspection> {
  if (isTauriEnvironment()) {
    return await invoke<DatabaseInspection>('inspect_source_database', { url });
  }

  return {
    server_version: '18.4',
    size_bytes: 1954156544,
    size_formatted: '1.82 GB',
    user_schemas: ['public', 'audit', 'analytics'],
    tables: [
      { schema_name: 'public', table_name: 'users', estimated_rows: 21842 },
      { schema_name: 'public', table_name: 'hostels', estimated_rows: 842 },
      { schema_name: 'public', table_name: 'bookings', estimated_rows: 56018 },
    ],
    views_count: 12,
    mat_views_count: 2,
    indexes_count: 184,
    sequences_count: 23,
    foreign_keys_count: 96,
    functions_count: 48,
    triggers_count: 14,
    extensions: ['pgcrypto', 'uuid-ossp', 'vector'],
  };
}

export async function runMigrationApi(
  sourceUrl: string,
  destUrl: string,
  keepBackup: boolean
): Promise<MigrationReport> {
  if (isTauriEnvironment()) {
    return await invoke<MigrationReport>('run_migration', {
      sourceUrl,
      destUrl,
      keepBackup,
    });
  }

  // Browser fixture response
  return {
    migration_id: 'mig-' + Math.random().toString(36).substring(2, 9),
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: 402,
    source_provider: 'Neon',
    source_host_redacted: 'ep-old-project.aws.neon.tech',
    source_dbname: 'hexttel_prod',
    destination_provider: 'Neon',
    destination_host_redacted: 'ep-new-project.aws.neon.tech',
    destination_dbname: 'hexttel_new',
    source_postgres_version: '18.4',
    destination_postgres_version: '18.4',
    pg_dump_version: '18.6',
    pg_restore_version: '18.6',
    dump_size_bytes: 1954156544,
    dump_size_formatted: '1.82 GB',
    status: 'VERIFIED',
    verification_mode: 'STANDARD',
    verification_summary: {
      mode: 'STANDARD',
      status: 'VERIFIED',
      message: 'Destination schema and object counts match source database.',
      schemas_match: true,
      tables_match: true,
      views_match: true,
      indexes_match: true,
      sequences_match: true,
      foreign_keys_match: true,
      functions_match: true,
      extensions_match: true,
      tables: [
        { schema_name: 'public', table_name: 'users', source_count: 21842, dest_count: 21842, matched: true },
        { schema_name: 'public', table_name: 'hostels', source_count: 842, dest_count: 842, matched: true },
        { schema_name: 'public', table_name: 'bookings', source_count: 56018, dest_count: 56018, matched: true },
      ],
      warnings: [],
    },
    logs: [
      '[23:41:02] Source connection verified',
      '[23:41:03] PostgreSQL 18.4 detected',
      '[23:41:03] pg_dump 18.6 selected',
      '[23:41:04] Creating custom archive',
      '[23:44:17] Archive completed',
      '[23:44:17] Beginning restore',
      '[23:47:30] Restore completed',
      '[23:47:31] Verification completed successfully',
    ],
    dump_file_retained: false,
  };
}

export async function cancelMigrationApi(): Promise<void> {
  if (isTauriEnvironment()) {
    await invoke('cancel_migration');
  }
}

export async function runDeepVerificationApi(
  sourceUrl: string,
  destUrl: string
): Promise<VerificationSummary> {
  if (isTauriEnvironment()) {
    return await invoke<VerificationSummary>('run_deep_verification', { sourceUrl, destUrl });
  }

  return {
    mode: 'DEEP',
    status: 'VERIFIED',
    message: 'Exact row count verification passed for all 71 tables.',
    schemas_match: true,
    tables_match: true,
    views_match: true,
    indexes_match: true,
    sequences_match: true,
    foreign_keys_match: true,
    functions_match: true,
    extensions_match: true,
    tables: [
      { schema_name: 'public', table_name: 'users', source_count: 21842, dest_count: 21842, matched: true },
      { schema_name: 'public', table_name: 'hostels', source_count: 842, dest_count: 842, matched: true },
      { schema_name: 'public', table_name: 'bookings', source_count: 56018, dest_count: 56018, matched: true },
    ],
    warnings: [],
  };
}

export async function getMigrationHistoryApi(): Promise<HistoryRecord[]> {
  if (isTauriEnvironment()) {
    return await invoke<HistoryRecord[]>('get_migration_history');
  }
  return [];
}

export async function clearMigrationHistoryApi(): Promise<void> {
  if (isTauriEnvironment()) {
    await invoke('clear_migration_history');
  }
}

export async function listenMigrationProgress(
  callback: (event: ProgressEvent) => void
): Promise<UnlistenFn> {
  if (isTauriEnvironment()) {
    return await listen<ProgressEvent>('migration://progress', (e) => callback(e.payload));
  }
  return () => {};
}

export async function listenMigrationLog(
  callback: (event: LogEvent) => void
): Promise<UnlistenFn> {
  if (isTauriEnvironment()) {
    return await listen<LogEvent>('migration://log', (e) => callback(e.payload));
  }
  return () => {};
}

export async function listenMigrationComplete(
  callback: (report: MigrationReport) => void
): Promise<UnlistenFn> {
  if (isTauriEnvironment()) {
    return await listen<MigrationReport>('migration://complete', (e) => callback(e.payload));
  }
  return () => {};
}
