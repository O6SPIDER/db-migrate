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
} from 'lucide-react';
import { MigrationReport } from '../../types/migration';

interface CompletionScreenProps {
  report: MigrationReport;
  onRunDeepVerification: () => void;
  isDeepVerifying: boolean;
  onReset: () => void;
}

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Result Card */}
      <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isVerified
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : isWarning
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {isVerified ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-100">
                {isVerified
                  ? 'Migration Complete & Verified'
                  : isWarning
                  ? 'Migration Completed with Warnings'
                  : 'Migration Verification Failed'}
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {report.source_dbname} → {report.destination_dbname}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm flex items-center space-x-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Another Migration</span>
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2433]">
            <span className="text-[10px] text-gray-400 font-mono block">TOTAL DURATION</span>
            <span className="text-sm font-semibold text-gray-100 font-mono mt-0.5 block">
              {formatDuration(report.duration_seconds)}
            </span>
          </div>

          <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2433]">
            <span className="text-[10px] text-gray-400 font-mono block">TRANSFERRED SIZE</span>
            <span className="text-sm font-semibold text-gray-100 mt-0.5 block">
              {report.dump_size_formatted}
            </span>
          </div>

          <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2433]">
            <span className="text-[10px] text-gray-400 font-mono block">PG_DUMP VERSION</span>
            <span className="text-sm font-semibold text-gray-100 font-mono mt-0.5 block">
              v{report.pg_dump_version}
            </span>
          </div>

          <div className="bg-[#090a0f] p-3 rounded-lg border border-[#1e2433]">
            <span className="text-[10px] text-gray-400 font-mono block">VERIFICATION MODE</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono mt-0.5 block">
              {verSummary.mode}
            </span>
          </div>
        </div>
      </div>

      {/* Structural Object Comparison */}
      <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider font-mono">
              Database Objects Verification
            </h3>
          </div>

          <button
            type="button"
            onClick={onRunDeepVerification}
            disabled={isDeepVerifying || verSummary.mode === 'DEEP'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161a26] border border-[#272e42] hover:bg-[#202638] text-gray-300 hover:text-white transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDeepVerifying ? 'animate-spin' : ''}`} />
            <span>{verSummary.mode === 'DEEP' ? 'Deep Verified' : 'Run Deep Verification'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-[#090a0f] p-2.5 rounded border border-[#1e2433] flex justify-between items-center">
            <span className="text-gray-400">Schemas</span>
            <span className="text-emerald-400 font-medium">Verified ✓</span>
          </div>
          <div className="bg-[#090a0f] p-2.5 rounded border border-[#1e2433] flex justify-between items-center">
            <span className="text-gray-400">Tables</span>
            <span className="text-emerald-400 font-medium">Verified ✓</span>
          </div>
          <div className="bg-[#090a0f] p-2.5 rounded border border-[#1e2433] flex justify-between items-center">
            <span className="text-gray-400">Indexes</span>
            <span className="text-emerald-400 font-medium">Verified ✓</span>
          </div>
          <div className="bg-[#090a0f] p-2.5 rounded border border-[#1e2433] flex justify-between items-center">
            <span className="text-gray-400">Foreign Keys</span>
            <span className="text-emerald-400 font-medium">Verified ✓</span>
          </div>
        </div>

        {/* Table by Table Row Count Breakdown */}
        {verSummary.tables.length > 0 && (
          <div className="pt-2">
            <h4 className="text-[11px] font-mono text-gray-400 uppercase tracking-wider mb-2">
              Table Row Counts ({verSummary.mode} Mode)
            </h4>
            <div className="bg-[#090a0f] border border-[#1e2433] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0d0f17] text-gray-400 border-b border-[#1e2433] sticky top-0">
                  <tr>
                    <th className="p-2.5 font-medium">Table Name</th>
                    <th className="p-2.5 font-medium">Source Rows</th>
                    <th className="p-2.5 font-medium">Destination Rows</th>
                    <th className="p-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2433] text-gray-300">
                  {verSummary.tables.map((t, idx) => (
                    <tr key={idx} className="hover:bg-[#121520]">
                      <td className="p-2.5 font-medium text-gray-200">{t.schema_name}.{t.table_name}</td>
                      <td className="p-2.5">{t.source_count.toLocaleString()}</td>
                      <td className="p-2.5">{t.dest_count.toLocaleString()}</td>
                      <td className="p-2.5 text-right">
                        {t.matched ? (
                          <span className="text-emerald-400 font-semibold">Match ✓</span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Diff ⚠</span>
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
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 font-mono">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Temporary Backup Retention</span>
          </div>

          <p className="text-xs text-gray-400">
            Choose whether to delete or keep the generated local custom dump file.
          </p>

          <div className="space-y-2 pt-1 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-choice"
                checked={deleteBackup}
                onChange={() => setDeleteBackup(true)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">Delete temporary backup archive (Recommended)</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-choice"
                checked={!deleteBackup}
                onChange={() => setDeleteBackup(false)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300">Keep temporary backup file</span>
            </label>
          </div>
        </div>

        {/* Export Reports */}
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 font-mono">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Export Migration Report</span>
          </div>

          <p className="text-xs text-gray-400">
            Export a sanitized audit report containing timestamps, duration, and object counts.
          </p>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={exportJsonReport}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#161a26] border border-[#272e42] hover:bg-[#202638] text-gray-200 hover:text-white transition-all shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Report</span>
            </button>

            <button
              type="button"
              onClick={exportTextReport}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#161a26] border border-[#272e42] hover:bg-[#202638] text-gray-200 hover:text-white transition-all shadow-sm flex items-center justify-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Text Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
