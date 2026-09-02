import React from 'react';
import { Wrench, AlertTriangle, RefreshCw } from 'lucide-react';
import { ToolchainSelection } from '../../types/migration';

interface ToolchainCardProps {
  toolchain?: ToolchainSelection;
  onRescan: () => void;
  isLoading: boolean;
}

const StatusChip: React.FC<{ tone: 'ok' | 'missing' | 'optional' | 'info'; children: React.ReactNode }> = ({
  tone,
  children,
}) => {
  const styles: Record<typeof tone, string> = {
    ok: 'bg-[#0d1a12] border-emerald-900/60 text-emerald-400',
    missing: 'bg-[#1a0a0a] border-red-900/60 text-red-400',
    optional: 'bg-[#121212] border-[#242424] text-gray-500',
    info: 'bg-[#0a121a] border-blue-900/60 text-blue-400',
  };

  return (
    <span
      className={[
        'inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0',
        styles[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
};

export const ToolchainCard: React.FC<ToolchainCardProps> = ({ toolchain, onRescan, isLoading }) => {
  const isCompatible = toolchain?.compatible ?? false;

  const tools = [
    {
      name: 'pg_dump',
      tool: toolchain?.selected_dump,
    },
    {
      name: 'pg_restore',
      tool: toolchain?.selected_restore,
    },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="w-5 h-5 text-purple-400 shrink-0" strokeWidth={2} />
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">PostgreSQL toolchain</h3>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
              Native pg_dump and pg_restore binaries selected for compatibility.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRescan}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#121212] border border-[#242424] hover:bg-[#1a1a1a] text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
          <span>Re-scan tools</span>
        </button>
      </div>

      {/* Selected Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tools.map(({ name, tool }) => (
          <div key={name} className="bg-[#121212] p-3 rounded-lg border border-[#1f1f1f] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-gray-300 font-medium text-xs">{name}</span>
              {tool ? <StatusChip tone="ok">v{tool.version}</StatusChip> : <StatusChip tone="missing">Missing</StatusChip>}
            </div>
            <p className="text-[11px] font-mono text-gray-400 truncate" title={tool?.path}>
              {tool?.path || 'Not detected'}
            </p>
          </div>
        ))}

        {/* psql */}
        <div className="bg-[#121212] p-3 rounded-lg border border-[#1f1f1f] space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-gray-300 font-medium text-xs">psql</span>
            {toolchain?.selected_psql ? (
              <StatusChip tone="info">v{toolchain.selected_psql.version}</StatusChip>
            ) : (
              <StatusChip tone="optional">Optional</StatusChip>
            )}
          </div>
          <p className="text-[11px] font-mono text-gray-400 truncate" title={toolchain?.selected_psql?.path}>
            {toolchain?.selected_psql?.path || 'Not detected'}
          </p>
        </div>
      </div>

      {/* Incompatibility / Missing State Banner */}
      {!isCompatible && toolchain?.incompatibility_reason && (
        <div className="p-4 rounded-xl bg-[#1a140a] border border-amber-900/50 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-100">PostgreSQL client tools required</h4>
              <p className="text-[11px] text-amber-300/90 leading-relaxed font-mono">
                {toolchain.incompatibility_reason}
              </p>
              <p className="text-[11px] text-amber-400/80 pt-0.5">
                Install matching PostgreSQL client tools, or point to an executable path manually in
                Settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};