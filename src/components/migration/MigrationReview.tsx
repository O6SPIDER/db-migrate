import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Wrench,
  AlertTriangle,
  Play,
  ArrowLeft,
  Circle,
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

const Tag: React.FC<{ dotClass: string; textClass: string; children: React.ReactNode }> = ({
  dotClass,
  textClass,
  children,
}) => (
  <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${textClass}`}>
    <Circle className={`w-1.5 h-1.5 fill-current ${dotClass}`} strokeWidth={0} />
    {children}
  </span>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between items-center text-xs gap-3">
    <span className="text-gray-500">{label}</span>
    <span className="text-right min-w-0">{children}</span>
  </div>
);

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
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-6 flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Tag dotClass="text-blue-400" textClass="text-blue-400">
            Dry run summary
          </Tag>
          <h2 className="text-base font-semibold text-gray-100">Review migration plan</h2>
          <p className="text-xs text-gray-500">
            Confirm source, destination, and toolchain before the migration begins.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#161922] border border-[#262b36] hover:bg-[#1c202b] text-gray-300 hover:text-white transition-colors flex items-center gap-2 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Edit configuration</span>
        </button>
      </div>

      {/* Main FROM -> TO Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* FROM */}
        <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a1d26] pb-3">
            <Tag dotClass="text-blue-400" textClass="text-blue-400 font-semibold">
              Source
            </Tag>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/25 text-gray-400 border border-[#1a1d26]">
              {sourceId.provider}
            </span>
          </div>

          <div className="space-y-2">
            <Row label="Database">
              <span className="font-mono text-gray-200 font-medium">{sourceId.dbname}</span>
            </Row>
            <Row label="Host">
              <span className="font-mono text-gray-300 truncate block max-w-[200px]" title={sourceId.hostname}>
                {sourceId.hostname}
              </span>
            </Row>
            <Row label="Postgres version">
              <span className="font-mono text-gray-200">{sourceId.server_version}</span>
            </Row>
            <Row label="Size">
              <span className="font-semibold text-gray-100">{sourceId.database_size_formatted}</span>
            </Row>
            <Row label="Tables / schemas">
              <span className="font-mono text-gray-200">
                {sourceId.table_count} / {sourceId.schema_count}
              </span>
            </Row>
          </div>
        </div>

        {/* Central arrow for desktop */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#161922] border border-[#262b36] items-center justify-center text-blue-400 z-10">
          <ArrowRight className="w-4 h-4" strokeWidth={2} />
        </div>

        {/* TO */}
        <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1a1d26] pb-3">
            <Tag dotClass="text-emerald-400" textClass="text-emerald-400 font-semibold">
              Destination
            </Tag>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/25 text-gray-400 border border-[#1a1d26]">
              {destId.provider}
            </span>
          </div>

          <div className="space-y-2">
            <Row label="Database">
              <span className="font-mono text-gray-200 font-medium">{destId.dbname}</span>
            </Row>
            <Row label="Host">
              <span className="font-mono text-gray-300 truncate block max-w-[200px]" title={destId.hostname}>
                {destId.hostname}
              </span>
            </Row>
            <Row label="Postgres version">
              <span className="font-mono text-gray-200">{destId.server_version}</span>
            </Row>
            <Row label="Status">
              <span
                className={`font-mono font-semibold ${hasExistingTables ? 'text-red-400' : 'text-emerald-400'}`}
              >
                {hasExistingTables ? `${destId.table_count} existing tables` : 'Empty database'}
              </span>
            </Row>
          </div>
        </div>
      </div>

      {/* Toolchain & Scope Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toolchain */}
        <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <Wrench className="w-3.5 h-3.5 text-purple-400" strokeWidth={2} />
            <span>Selected client toolchain</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center bg-black/25 p-2.5 rounded-lg border border-[#1a1d26]">
              <span className="text-xs text-gray-500 font-mono">pg_dump</span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                v{toolchain.selected_dump?.version}
              </span>
            </div>
            <div className="flex justify-between items-center bg-black/25 p-2.5 rounded-lg border border-[#1a1d26]">
              <span className="text-xs text-gray-500 font-mono">pg_restore</span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                v{toolchain.selected_restore?.version}
              </span>
            </div>
          </div>
        </div>

        {/* Migration Scope */}
        <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <Database className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />
            <span>Migration scope</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['Schemas', 'Tables & data', 'Indexes', 'Foreign keys'].map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 bg-black/25 p-2 rounded-lg border border-[#1a1d26] text-xs text-gray-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Non-empty acknowledgment requirement banner if needed */}
      {hasExistingTables && !destAcknowledged && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/40 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-amber-100">Acknowledgment required</p>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Go back and check the non-empty destination acknowledgment box before starting.
            </p>
          </div>
        </div>
      )}

      {/* Start Migration Primary Control */}
      <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-200">Point of no return</p>
          <p className="text-[11px] text-gray-500">
            Starting will dump the source database and restore its objects into the destination.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartMigration}
          disabled={!canStart || isStarting}
          className="px-6 py-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] flex items-center gap-2 shrink-0"
        >
          {isStarting ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Initializing</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-white" strokeWidth={2} />
              <span>Start migration</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};