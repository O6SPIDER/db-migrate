import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Wrench,
  AlertTriangle,
  Play,
  ArrowLeft,
} from 'lucide-react';
import { SafeDatabaseIdentity, ToolchainSelection } from '../../types/migration';

interface MigrationReviewProps {
  sourceId: SafeDatabaseIdentity;
  destId: SafeDatabaseIdentity;
  toolchain: ToolchainSelection;
  destAcknowledged: boolean;
  onBack: () => void;
  onStartMigration: () => void;
  isStarting: boolean;
}

export const MigrationReview: React.FC<MigrationReviewProps> = ({
  sourceId,
  destId,
  toolchain,
  destAcknowledged,
  onBack,
  onStartMigration,
  isStarting,
}) => {
  const hasExistingTables = destId.table_count > 0;
  const canStart = !hasExistingTables || destAcknowledged;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-950/80 text-blue-400 border border-blue-800/50 uppercase tracking-wider">
              Dry Run Summary
            </span>
            <h2 className="text-base font-semibold text-gray-100">Review PostgreSQL Migration Plan</h2>
          </div>
          <p className="text-xs text-gray-400">
            Verify source, destination, toolchain, and preflight status before beginning migration.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#161a26] border border-[#272e42] hover:bg-[#202638] text-gray-300 hover:text-white transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Edit Configuration</span>
        </button>
      </div>

      {/* Main FROM -> TO Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* FROM */}
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2433] pb-3">
            <span className="text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
              FROM (SOURCE)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161a24] text-gray-300 border border-[#242b3d]">
              {sourceId.provider}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Database Name</span>
              <span className="font-mono text-gray-200 font-medium">{sourceId.dbname}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Hostname</span>
              <span className="font-mono text-gray-300 truncate max-w-[200px]" title={sourceId.hostname}>
                {sourceId.hostname}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">PostgreSQL Server Version</span>
              <span className="font-mono text-gray-200">{sourceId.server_version}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total Size</span>
              <span className="font-semibold text-gray-100">{sourceId.database_size_formatted}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Tables & Schemas</span>
              <span className="font-mono text-gray-200">
                {sourceId.table_count} tables ({sourceId.schema_count} schemas)
              </span>
            </div>
          </div>
        </div>

        {/* Central arrow for desktop */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1e2433] border border-[#2e374d] items-center justify-center text-blue-400 z-10">
          <ArrowRight className="w-4 h-4" />
        </div>

        {/* TO */}
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e2433] pb-3">
            <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
              TO (DESTINATION)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161a24] text-gray-300 border border-[#242b3d]">
              {destId.provider}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Database Name</span>
              <span className="font-mono text-gray-200 font-medium">{destId.dbname}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Hostname</span>
              <span className="font-mono text-gray-300 truncate max-w-[200px]" title={destId.hostname}>
                {destId.hostname}
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">PostgreSQL Server Version</span>
              <span className="font-mono text-gray-200">{destId.server_version}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Destination Status</span>
              <span
                className={`font-semibold ${
                  hasExistingTables ? 'text-amber-400 font-mono text-xs' : 'text-emerald-400'
                }`}
              >
                {hasExistingTables ? `${destId.table_count} existing tables` : 'Empty Database'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolchain & Scope Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toolchain */}
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono">
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>Selected Client Toolchain</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between bg-[#090a0f] p-2.5 rounded border border-[#1e2433]">
              <span className="text-gray-400">pg_dump Executable</span>
              <span className="text-emerald-400">v{toolchain.selected_dump?.version} ✓</span>
            </div>
            <div className="flex justify-between bg-[#090a0f] p-2.5 rounded border border-[#1e2433]">
              <span className="text-gray-400">pg_restore Executable</span>
              <span className="text-emerald-400">v{toolchain.selected_restore?.version} ✓</span>
            </div>
          </div>
        </div>

        {/* Migration Scope */}
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Migration Scope & Objects</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 font-mono">
            <span className="flex items-center gap-1.5 bg-[#090a0f] p-2 rounded border border-[#1e2433]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Schemas
            </span>
            <span className="flex items-center gap-1.5 bg-[#090a0f] p-2 rounded border border-[#1e2433]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tables & Data
            </span>
            <span className="flex items-center gap-1.5 bg-[#090a0f] p-2 rounded border border-[#1e2433]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Indexes
            </span>
            <span className="flex items-center gap-1.5 bg-[#090a0f] p-2 rounded border border-[#1e2433]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Foreign Keys
            </span>
          </div>
        </div>
      </div>

      {/* Non-empty acknowledgment requirement banner if needed */}
      {hasExistingTables && !destAcknowledged && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="font-semibold text-amber-100">Acknowledgment Required</p>
            <p className="text-amber-300/80 mt-0.5">
              Please check the non-empty destination acknowledgment checkbox on the main setup form
              before starting.
            </p>
          </div>
        </div>
      )}

      {/* Start Migration Primary Control */}
      <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-200">Point of No Return</p>
          <p className="text-[11px] text-gray-400">
            Clicking Start Migration will dump the source database and restore objects into destination.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartMigration}
          disabled={!canStart || isStarting}
          className="px-6 py-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center space-x-2 font-mono"
        >
          {isStarting ? (
            <span className="flex items-center space-x-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Initializing...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <Play className="w-4 h-4 fill-white" />
              <span>Start Migration</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
