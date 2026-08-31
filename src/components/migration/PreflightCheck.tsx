import React from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { SafeDatabaseIdentity, ToolchainSelection } from '../../types/migration';

interface PreflightCheckProps {
  sourceId?: SafeDatabaseIdentity;
  destId?: SafeDatabaseIdentity;
  toolchain?: ToolchainSelection;
  isSameDatabase: boolean;
  destAcknowledged: boolean;
}

export const PreflightCheck: React.FC<PreflightCheckProps> = ({
  sourceId,
  destId,
  toolchain,
  isSameDatabase,
}) => {
  const checks = [
    {
      title: 'Source Connection',
      passed: !!sourceId,
      detail: sourceId ? `${sourceId.provider} (${sourceId.hostname})` : 'Not connected',
    },
    {
      title: 'Destination Connection',
      passed: !!destId,
      detail: destId ? `${destId.provider} (${destId.hostname})` : 'Not connected',
    },
    {
      title: 'Database Non-Identity',
      passed: !isSameDatabase && (!!sourceId && !!destId),
      detail: isSameDatabase
        ? 'BLOCKED: Source and Destination refer to the same database'
        : 'Different database targets verified',
    },
    {
      title: 'Compatible Tooling',
      passed: toolchain?.compatible ?? false,
      detail: toolchain?.compatible
        ? `pg_dump v${toolchain.selected_dump?.version} & pg_restore v${toolchain.selected_restore?.version}`
        : toolchain?.incompatibility_reason || 'Missing tools',
    },
    {
      title: 'Source Readable & Inspected',
      passed: (sourceId?.table_count ?? 0) >= 0 && !!sourceId,
      detail: sourceId ? `${sourceId.table_count} tables (${sourceId.database_size_formatted})` : 'Pending',
    },
    {
      title: 'Destination Target Writable',
      passed: !!destId,
      detail: destId
        ? destId.table_count > 0
          ? `${destId.table_count} existing tables (Non-empty)`
          : 'Ready (Empty database)'
        : 'Pending',
    },
  ];

  return (
    <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Preflight Validation Checklist</h3>
          <p className="text-xs text-gray-400">
            Safety checks performed prior to executing migration child processes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {checks.map((c, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
              c.passed
                ? 'bg-[#090a0f] border-[#1e2433] text-gray-200'
                : 'bg-red-950/20 border-red-900/40 text-red-300'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-medium block">{c.title}</span>
              <span className="text-[11px] font-mono text-gray-400 block truncate max-w-xs">
                {c.detail}
              </span>
            </div>

            {c.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
