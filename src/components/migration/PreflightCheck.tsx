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
  destAcknowledged,
}) => {
  const destHasTables = (destId?.table_count ?? 0) > 0;
  const destReady = !!destId && (!destHasTables || destAcknowledged);

  const checks = [
    {
      title: 'Source connection',
      passed: !!sourceId,
      detail: sourceId ? `${sourceId.provider} (${sourceId.hostname})` : 'Not connected',
    },
    {
      title: 'Destination connection',
      passed: !!destId,
      detail: destId ? `${destId.provider} (${destId.hostname})` : 'Not connected',
    },
    {
      title: 'Database non-identity',
      passed: !isSameDatabase && !!sourceId && !!destId,
      detail: isSameDatabase
        ? 'Source and destination refer to the same database'
        : 'Different database targets verified',
    },
    {
      title: 'Compatible tooling',
      passed: toolchain?.compatible ?? false,
      detail: toolchain?.compatible
        ? `pg_dump v${toolchain.selected_dump?.version} & pg_restore v${toolchain.selected_restore?.version}`
        : toolchain?.incompatibility_reason || 'Missing tools',
    },
    {
      title: 'Source readable & inspected',
      passed: !!sourceId,
      detail: sourceId ? `${sourceId.table_count} tables (${sourceId.database_size_formatted})` : 'Pending',
    },
    {
      title: 'Destination ready',
      passed: destReady,
      detail: !destId
        ? 'Pending'
        : destHasTables && !destAcknowledged
        ? 'Acknowledge the non-empty destination to proceed'
        : destHasTables
        ? `${destId.table_count} existing tables, acknowledged`
        : 'Ready (empty database)',
    },
  ];

  return (
    <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-emerald-600/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck className="w-4 h-4" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100 leading-tight">Preflight checklist</h3>
          <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
            Safety checks run before any migration process starts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {checks.map((c, i) => (
          <div
            key={i}
            className={[
              'p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors',
              c.passed ? 'bg-black/25 border-[#1a1d26]' : 'bg-red-950/20 border-red-900/40',
            ].join(' ')}
          >
            <div className="space-y-0.5 min-w-0">
              <span className={['text-xs font-medium block', c.passed ? 'text-gray-200' : 'text-red-200'].join(' ')}>
                {c.title}
              </span>
              <span
                className={[
                  'text-[11px] font-mono block truncate',
                  c.passed ? 'text-gray-500' : 'text-red-300/80',
                ].join(' ')}
                title={c.detail}
              >
                {c.detail}
              </span>
            </div>

            {c.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2} />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 shrink-0" strokeWidth={2} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};