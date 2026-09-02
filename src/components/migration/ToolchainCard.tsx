import React from 'react';
import { Wrench, AlertTriangle, RefreshCw, Circle } from 'lucide-react';
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
    ok: 'bg-emerald-500/10 border-emerald-700/40 text-emerald-400',
    missing: 'bg-red-500/10 border-red-800/40 text-red-400',
    optional: 'bg-[#161922] border-[#262b36] text-gray-500',
    info: 'bg-blue-500/10 border-blue-800/40 text-blue-400',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0',
        styles[tone],
      ].join(' ')}
    >
      <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
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
      requiredTone: 'ok' as const,
    },
    {
      name: 'pg_restore',
      tool: toolchain?.selected_restore,
      requiredTone: 'ok' as const,
    },
  ];

  return (
    <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-purple-600/15 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
            <Wrench className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100 leading-tight">PostgreSQL toolchain</h3>
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Native pg_dump and pg_restore binaries selected for compatibility.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRescan}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161922] border border-[#262b36] hover:bg-[#1c202b] text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
          <span>Re-scan tools</span>
        </button>
      </div>

      {/* Selected Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tools.map(({ name, tool }) => (
          <div key={name} className="bg-black/25 p-3 rounded-lg border border-[#1a1d26] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-gray-400 font-medium text-xs">{name}</span>
              {tool ? <StatusChip tone="ok">v{tool.version}</StatusChip> : <StatusChip tone="missing">Missing</StatusChip>}
            </div>
            <p className="text-[11px] font-mono text-gray-600 truncate" title={tool?.path}>
              {tool?.path || 'Not detected'}
            </p>
          </div>
        ))}

        {/* psql */}
        <div className="bg-black/25 p-3 rounded-lg border border-[#1a1d26] space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-gray-400 font-medium text-xs">psql</span>
            {toolchain?.selected_psql ? (
              <StatusChip tone="info">v{toolchain.selected_psql.version}</StatusChip>
            ) : (
              <StatusChip tone="optional">Optional</StatusChip>
            )}
          </div>
          <p className="text-[11px] font-mono text-gray-600 truncate" title={toolchain?.selected_psql?.path}>
            {toolchain?.selected_psql?.path || 'Not detected'}
          </p>
        </div>
      </div>

      {/* Incompatibility / Missing State Banner */}
      {!isCompatible && toolchain?.incompatibility_reason && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/40 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-100">PostgreSQL client tools required</h4>
              <p className="text-[11px] text-amber-300/85 leading-relaxed font-mono">
                {toolchain.incompatibility_reason}
              </p>
              <p className="text-[11px] text-amber-500/70 pt-0.5">
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