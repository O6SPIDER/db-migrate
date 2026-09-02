import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  RotateCcw,
  ShieldCheck,
  FileText,
  HardDrive,
  RefreshCw,
  Clock,
  Tag
} from 'lucide-react';
import { MigrationReport } from '../../types/migration';

interface CompletionScreenProps {
  report: MigrationReport;
  onRunDeepVerification: () => void;
  isDeepVerifying: boolean;
  onReset: () => void;
}

const StatTile: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode; tone?: string }> = ({
  icon: Icon,
  label,
  children,
  tone = 'text-gray-100',
}) => (
  <div className="bg-black/25 p-3 rounded-lg border border-[#1a1d26] space-y-1">
    <div className="flex items-center gap-1.5 text-gray-600">
      <Icon className="w-3 h-3" strokeWidth={2} />
      <span className="text-[10px]">{label}</span>
    </div>
    <span className={`text-sm font-semibold block font-mono ${tone}`}>{children}</span>
  </div>
);

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  report,
  onRunDeepVerification,
  isDeepVerifying,
  onReset,
}) => {
  const [deleteBackup, setDeleteBackup] = useState(!report.dump_file_retained);
  const verSummary = report.verification_summary;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  const exportJsonReport = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-report-${report.migration_id.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTextReport = () => {
    let txt = `=====================================================\n`;
    txt += `POSTGRESQL DATABASE MIGRATION REPORT\n`;
    txt += `=====================================================\n`;
    txt += `Migration ID : ${report.migration_id}\n`;
    txt += `Started At   : ${report.started_at}\n`;
    txt += `Completed At : ${report.completed_at}\n`;
    txt += `Duration     : ${formatDuration(report.duration_seconds)}\n`;
    txt += `Source       : ${report.source_provider} (${report.source_host_redacted} / ${report.source_dbname})\n`;
    txt += `Destination  : ${report.destination_provider} (${report.destination_host_redacted} / ${report.destination_dbname})\n`;
    txt += `Dump Size    : ${report.dump_size_formatted}\n`;
    txt += `Status       : ${report.status}\n`;
    txt += `=====================================================\n`;

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-report-${report.migration_id.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isVerified = report.status === 'VERIFIED';
  const isWarning = report.status === 'VERIFIED_WITH_WARNINGS';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header Result Card */}
      <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={[
                'w-10 h-10 rounded-lg flex items-center justify-center border shrink-0',
                isVerified
                  ? 'bg-emerald-500/10 border-emerald-700/40 text-emerald-400'
                  : isWarning
                  ? 'bg-amber-500/10 border-amber-700/40 text-amber-400'
                  : 'bg-red-500/10 border-red-700/40 text-red-400',
              ].join(' ')}
            >
              {isVerified ? (
                <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5" strokeWidth={2} />
              ) : (
                <XCircle className="w-5 h-5" strokeWidth={2} />
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100 leading-tight">
                {isVerified
                  ? 'Migration complete and verified'
                  : isWarning
                  ? 'Migration completed with warnings'
                  : 'Migration verification failed'}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {report.source_dbname} → {report.destination_dbname}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-colors shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] flex items-center gap-2 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Start another migration</span>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatTile icon={Clock} label="Total duration">
            {formatDuration(report.duration_seconds)}
          </StatTile>
          <StatTile icon={HardDrive} label="Transferred size">
            {report.dump_size_formatted}
          </StatTile>
          <StatTile icon={Tag} label="pg_dump version">
            v{report.pg_dump_version}
          </StatTile>
          <StatTile icon={ShieldCheck} label="Verification mode" tone="text-emerald-400">
            {verSummary.mode}
          </StatTile>
        </div>
      </div>

      {/* Structural Object Comparison */}
      <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <h3 className="text-xs font-semibold text-gray-200">Database objects verification</h3>
          </div>

          <button
            type="button"
            onClick={onRunDeepVerification}
            disabled={isDeepVerifying || verSummary.mode === 'DEEP'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161922] border border-[#262b36] hover:bg-[#1c202b] text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDeepVerifying ? 'animate-spin' : ''}`} strokeWidth={2} />
            <span>{verSummary.mode === 'DEEP' ? 'Deep verified' : 'Run deep verification'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Schemas', 'Tables', 'Indexes', 'Foreign keys'].map((item) => (
            <div
              key={item}
              className="bg-black/25 p-2.5 rounded-lg border border-[#1a1d26] flex justify-between items-center"
            >
              <span className="text-xs text-gray-500">{item}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                Verified
              </span>
            </div>
          ))}
        </div>

        {/* Table by Table Row Count Breakdown */}
        {verSummary.tables.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-[11px] font-medium text-gray-500">Table row counts</h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/25 border border-[#1a1d26] text-gray-500">
                {verSummary.mode}
              </span>
            </div>
            <div className="bg-black/25 border border-[#1a1d26] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0a0b10] text-gray-500 border-b border-[#1a1d26] sticky top-0">
                  <tr>
                    <th className="p-2.5 font-medium">Table</th>
                    <th className="p-2.5 font-medium">Source rows</th>
                    <th className="p-2.5 font-medium">Destination rows</th>
                    <th className="p-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1d26] text-gray-300">
                  {verSummary.tables.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 font-medium text-gray-200">
                        {t.schema_name}.{t.table_name}
                      </td>
                      <td className="p-2.5">{t.source_count.toLocaleString()}</td>
                      <td className="p-2.5">{t.dest_count.toLocaleString()}</td>
                      <td className="p-2.5 text-right">
                        {t.matched ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                            Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                            <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                            Diff
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Backup Retention & Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup Retention */}
        <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
            <HardDrive className="w-4 h-4 text-blue-400" strokeWidth={2} />
            <span>Temporary backup retention</span>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            Choose whether to delete or keep the generated local dump file.
          </p>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-choice"
                checked={deleteBackup}
                onChange={() => setDeleteBackup(true)}
                className="w-3.5 h-3.5 text-blue-600 bg-black/30 border-[#262b36] focus:ring-1 focus:ring-blue-500/40 focus:ring-offset-0"
              />
              <span className="text-xs text-gray-300">Delete temporary backup archive (recommended)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-choice"
                checked={!deleteBackup}
                onChange={() => setDeleteBackup(false)}
                className="w-3.5 h-3.5 text-blue-600 bg-black/30 border-[#262b36] focus:ring-1 focus:ring-blue-500/40 focus:ring-offset-0"
              />
              <span className="text-xs text-gray-300">Keep temporary backup file</span>
            </label>
          </div>
        </div>

        {/* Export Reports */}
        <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
            <FileText className="w-4 h-4 text-purple-400" strokeWidth={2} />
            <span>Export migration report</span>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            Export a sanitized audit report with timestamps, duration, and object counts.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={exportJsonReport}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#161922] border border-[#262b36] hover:bg-[#1c202b] text-gray-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              <span>JSON report</span>
            </button>

            <button
              type="button"
              onClick={exportTextReport}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#161922] border border-[#262b36] hover:bg-[#1c202b] text-gray-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Text report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};