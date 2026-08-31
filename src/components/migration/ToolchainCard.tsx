import React from 'react';
import { Wrench, AlertTriangle, RefreshCw } from 'lucide-react';
import { ToolchainSelection } from '../../types/migration';

interface ToolchainCardProps {
  toolchain?: ToolchainSelection;
  onRescan: () => void;
  isLoading: boolean;
}

export const ToolchainCard: React.FC<ToolchainCardProps> = ({
  toolchain,
  onRescan,
  isLoading,
}) => {
  const isCompatible = toolchain?.compatible ?? false;

  return (
    <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">PostgreSQL Toolchain</h3>
            <p className="text-xs text-gray-400">
              Native pg_dump & pg_restore binaries selected for compatibility.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRescan}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1f2c] border border-[#283147] hover:bg-[#232a3b] text-gray-300 hover:text-white transition-all shadow-sm flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Re-scan tools</span>
        </button>
      </div>

      {/* Selected Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* pg_dump */}
        <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2433] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-gray-400 font-medium">pg_dump</span>
            {toolchain?.selected_dump ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                v{toolchain.selected_dump.version}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                Missing
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-gray-400 truncate" title={toolchain?.selected_dump?.path}>
            {toolchain?.selected_dump?.path || 'Not detected'}
          </p>
        </div>

        {/* pg_restore */}
        <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2433] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-gray-400 font-medium">pg_restore</span>
            {toolchain?.selected_restore ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                v{toolchain.selected_restore.version}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
                Missing
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-gray-400 truncate" title={toolchain?.selected_restore?.path}>
            {toolchain?.selected_restore?.path || 'Not detected'}
          </p>
        </div>

        {/* psql */}
        <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2433] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-gray-400 font-medium">psql</span>
            {toolchain?.selected_psql ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                v{toolchain.selected_psql.version}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800">
                Optional
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-gray-400 truncate" title={toolchain?.selected_psql?.path}>
            {toolchain?.selected_psql?.path || 'Not detected'}
          </p>
        </div>
      </div>

      {/* Incompatibility / Missing State Banner */}
      {!isCompatible && toolchain?.incompatibility_reason && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 space-y-2">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-100">PostgreSQL Client Tools Required</h4>
              <p className="mt-1 text-xs text-amber-300/90 leading-relaxed font-mono">
                {toolchain.incompatibility_reason}
              </p>
              <div className="mt-2 text-[11px] text-amber-400/80">
                <p>Ensure PostgreSQL 18 client tools are installed or select executable path manually in Settings.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
