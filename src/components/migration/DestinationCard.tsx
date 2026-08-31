import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertTriangle,
  Database,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import { SafeDatabaseIdentity } from '../../types/migration';
import { redactUrl } from '../../lib/redaction';

interface DestinationCardProps {
  url: string;
  setUrl: (url: string) => void;
  identity?: SafeDatabaseIdentity;
  isLoading: boolean;
  onTestConnection: () => void;
  error?: string;
  destAcknowledged: boolean;
  setDestAcknowledged: (ack: boolean) => void;
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
    <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Destination database</h3>
            <p className="text-xs text-gray-400">
              The PostgreSQL database that will receive the copied database.
            </p>
          </div>
        </div>

        {identity && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        )}
      </div>

      {/* Input controls */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <input
            type={showPassword ? 'text' : 'password'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="postgresql://user:password@ep-new-project.aws.neon.tech/neondb?sslmode=require"
            className="w-full bg-[#090a0f] border border-[#1e2433] rounded-lg px-3.5 py-2.5 pr-24 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />

          <div className="absolute right-2 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-gray-400 hover:text-gray-200 rounded-md hover:bg-[#1f2533] transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="p-1.5 text-gray-400 hover:text-gray-200 rounded-md hover:bg-[#1f2533] transition-colors"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-[11px] font-mono text-gray-400 truncate max-w-xs">
            {url ? redactUrl(url) : 'No URL entered'}
          </span>

          <button
            type="button"
            onClick={onTestConnection}
            disabled={!url || isLoading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center space-x-1.5"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Testing...
              </span>
            ) : (
              <span>Test Connection</span>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="font-mono">{error}</div>
        </div>
      )}

      {/* Validated details grid */}
      {identity && (
        <div className="space-y-3 pt-2 border-t border-[#1e2433]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#090a0f] p-2.5 rounded-lg border border-[#1e2433]">
              <span className="text-[10px] text-gray-400 block font-mono">PROVIDER</span>
              <span className="text-xs font-semibold text-gray-200 mt-0.5 block">
                {identity.provider}
              </span>
            </div>

            <div className="bg-[#090a0f] p-2.5 rounded-lg border border-[#1e2433]">
              <span className="text-[10px] text-gray-400 block font-mono">POSTGRES VERSION</span>
              <span className="text-xs font-semibold text-gray-200 mt-0.5 block font-mono">
                {identity.server_version}
              </span>
            </div>

            <div className="bg-[#090a0f] p-2.5 rounded-lg border border-[#1e2433]">
              <span className="text-[10px] text-gray-400 block font-mono">DATABASE SIZE</span>
              <span className="text-xs font-semibold text-gray-200 mt-0.5 block">
                {identity.database_size_formatted}
              </span>
            </div>

            <div className="bg-[#090a0f] p-2.5 rounded-lg border border-[#1e2433]">
              <span className="text-[10px] text-gray-400 block font-mono">STATUS</span>
              <span className="text-xs font-semibold text-gray-200 mt-0.5 block font-mono">
                {hasExistingTables ? `${identity.table_count} existing tables` : 'Empty Database'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-mono text-[11px]">
            <span className="truncate">Host: {identity.hostname}</span>
            <div className="flex items-center space-x-2 shrink-0">
              {identity.ssl_enabled && (
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <Shield className="w-3 h-3" /> SSL Active
                </span>
              )}

              {identity.is_pooled ? (
                <span className="inline-flex items-center gap-1 text-amber-400">
                  <Zap className="w-3 h-3" /> Pooled Endpoint
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-blue-400">
                  <Server className="w-3 h-3" /> Direct Connection
                </span>
              )}
            </div>
          </div>

          {/* High visibility warning for non-empty destination */}
          {hasExistingTables && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 space-y-3 shadow-sm">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-red-100 uppercase tracking-wider">
                    High-Visibility Warning: Destination Non-Empty
                  </h4>
                  <p className="mt-1 text-xs text-red-300/90 leading-relaxed">
                    Destination contains{' '}
                    <strong className="text-white">{identity.table_count} existing tables</strong>.
                    Restoring into a non-empty database can cause object name conflicts or modify
                    existing database objects.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-red-900/60 flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="dest-ack-check"
                  checked={destAcknowledged}
                  onChange={(e) => setDestAcknowledged(e.target.checked)}
                  className="w-4 h-4 rounded border-red-700 bg-red-950 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label
                  htmlFor="dest-ack-check"
                  className="text-xs font-medium text-red-200 cursor-pointer select-none"
                >
                  I understand that this destination is not empty and restoring may modify or
                  conflict with existing database objects.
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
