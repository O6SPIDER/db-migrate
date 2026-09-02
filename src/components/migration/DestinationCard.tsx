import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  Database,
  Server,
  Shield,
  Zap,
  Tag,
  HardDrive,
  Table2,
} from 'lucide-react';
import { SafeDatabaseIdentity } from '../../types/migration';
import { redactUrl } from '../../lib/redaction';

interface DestinationCardProps {
  url: string;
  setUrl: (url: string) => void;
  identity?: SafeDatabaseIdentity | null;
  isLoading: boolean;
  onTestConnection: () => void;
  error?: string | null;
  destAcknowledged: boolean;
  setDestAcknowledged: (val: boolean) => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  url,
  setUrl,
  identity,
  isLoading,
  onTestConnection,
  error,
  destAcknowledged,
  setDestAcknowledged,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const hasExistingTables = (identity?.table_count ?? 0) > 0;

  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-emerald-400 shrink-0" strokeWidth={2} />
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">Destination database</h3>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">Where the copied database will be restored.</p>
          </div>
        </div>

        {identity && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#0d1a12] border border-emerald-900/60 text-emerald-400 shrink-0">
            Connected
          </span>
        )}
      </div>

      {/* Input controls */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-gray-400 block">Connection string</label>

        <div className="relative flex items-center">
          <input
            type={showPassword ? 'text' : 'password'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="postgresql://user:password@ep-new-project.aws.neon.tech/neondb?sslmode=require"
            className="w-full bg-[#121212] border border-[#242424] rounded-lg px-3.5 py-2.5 pr-9 text-xs font-mono text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
          />

          <div className="absolute right-2 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#1a1a1a] transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#1a1a1a] transition-colors"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-0.5 gap-3">
          <span className="text-[11px] font-mono text-gray-400 truncate">
            {url ? redactUrl(url) : 'No URL entered yet'}
          </span>

          <button
            type="button"
            onClick={onTestConnection}
            disabled={!url || isLoading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Testing
              </span>
            ) : (
              <span>Test connection</span>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-[#1a0a0a] border border-red-900/50 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="text-[11px] font-mono text-red-300 leading-relaxed break-all">{error}</div>
        </div>
      )}

      {/* Connected Database Summary */}
      {identity && (
        <div className="space-y-3 pt-3 border-t border-[#1f1f1f]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#121212] p-2.5 rounded-lg border border-[#1f1f1f] space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Server className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />
                <span className="text-[10px]">Provider</span>
              </div>
              <span className="text-xs font-semibold text-white block">{identity.provider}</span>
            </div>

            <div className="bg-[#121212] p-2.5 rounded-lg border border-[#1f1f1f] space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Tag className="w-3.5 h-3.5 text-purple-400" strokeWidth={2} />
                <span className="text-[10px]">Postgres version</span>
              </div>
              <span className="text-xs font-semibold text-white block font-mono">
                {identity.server_version}
              </span>
            </div>

            <div className="bg-[#121212] p-2.5 rounded-lg border border-[#1f1f1f] space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                <span className="text-[10px]">Database size</span>
              </div>
              <span className="text-xs font-semibold text-white block">
                {identity.database_size_formatted}
              </span>
            </div>

            <div
              className={[
                'p-2.5 rounded-lg border space-y-1',
                hasExistingTables
                  ? 'bg-[#1a0a0a] border-red-900/50'
                  : 'bg-[#121212] border-[#1f1f1f]',
              ].join(' ')}
            >
              <div className={['flex items-center gap-1.5', hasExistingTables ? 'text-red-400' : 'text-gray-400'].join(' ')}>
                <Table2 className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="text-[10px]">Status</span>
              </div>
              <span
                className={[
                  'text-xs font-semibold block font-mono',
                  hasExistingTables ? 'text-red-300' : 'text-white',
                ].join(' ')}
              >
                {hasExistingTables ? `${identity.table_count} tables exist` : 'Empty database'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-0.5">
            <span className="text-[11px] font-mono text-gray-400 truncate">{identity.hostname}</span>
            <div className="flex items-center gap-2 shrink-0">
              {identity.ssl_enabled && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} /> SSL
                </span>
              )}

              {identity.is_pooled ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} /> Pooled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                  <Server className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} /> Direct
                </span>
              )}
            </div>
          </div>

          {/* High visibility warning for non-empty destination */}
          {hasExistingTables && (
            <div className="p-4 rounded-xl bg-[#1a0a0a] border border-red-900/50 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-red-100">Destination is not empty</h4>
                  <p className="text-[11px] text-red-300/90 leading-relaxed">
                    This database already has{' '}
                    <span className="text-white font-medium">{identity.table_count} tables</span>.
                    Restoring here can create name conflicts or overwrite existing objects.
                  </p>
                </div>
              </div>

              <label
                htmlFor="dest-ack-check"
                className="flex items-start gap-2.5 pt-2.5 border-t border-red-950/80 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  id="dest-ack-check"
                  checked={destAcknowledged}
                  onChange={(e) => setDestAcknowledged(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-red-800 bg-[#121212] text-red-500 focus:ring-1 focus:ring-red-500/50 focus:ring-offset-0 cursor-pointer shrink-0"
                />
                <span className="text-[11px] font-medium text-red-200 leading-relaxed">
                  I understand this destination is not empty, and restoring may modify or conflict
                  with existing database objects.
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};