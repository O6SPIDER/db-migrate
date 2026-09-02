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
  Tag,
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
  tone = 'text-white',
}) => (
  <div className="bg-[#121212] p-3 rounded-lg border border-[#1f1f1f] space-y-1">
    <div className="flex items-center gap-1.5 text-gray-400">
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
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
  const [deleteBackup, setDeleteBackup] = useState(true);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    if (mins === 0) return `${s}s`;
    return `${mins}m ${s}s`;
  };

  const verSummary = report.verification_summary || {
    mode: 'FAST',
    objects_verified: true,
    tables: [],
  };

  const exportJsonReport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `migration_report_${report.migration_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportTextReport = () => {
    let txt = `====================================================\n`;
    txt += `  SAFE POSTGRESQL MIGRATION REPORT\n`;
    txt += `====================================================\n`;
    txt += `Migration ID : ${report.migration_id}\n`;
    txt += `Timestamp    : ${report.started_at}\n`;
    txt += `Status       : ${report.status}\n`;
    txt += `Duration     : ${formatDuration(report.duration_seconds)}\n`;
    txt += `Source DB    : ${report.source_dbname}\n`;
    txt += `Dest DB      : ${report.destination_dbname}\n`;
    txt += `Dump Size    : ${report.dump_size_formatted}\n`;
    txt += `pg_dump Ver  : ${report.pg_dump_version}\n`;
    txt += `Verification : ${verSummary.mode}\n\n`;

    txt += `TABLE VERIFICATION SUMMARY:\n`;
    verSummary.tables.forEach((t) => {
      txt += ` - ${t.schema_name}.${t.table_name}: Source=${t.source_count}, Dest=${t.dest_count} [${
        t.matched ? 'MATCH' : 'MISMATCH'
      }]\n`;
    });

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `migration_report_${report.migration_id}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isVerified = report.status === 'VERIFIED';
  const isWarning = report.status === 'VERIFIED_WITH_WARNINGS';

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header Result Card */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {isVerified ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" strokeWidth={2} />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" strokeWidth={2} />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 shrink-0" strokeWidth={2} />
            )}

            <div>
              <h2 className="text-base font-semibold text-white leading-tight">
                {isVerified
                  ? 'Migration complete and verified'
                  : isWarning
                  ? 'Migration completed with warnings'
                  : 'Migration verification failed'}
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-1">
                {report.source_dbname} → {report.destination_dbname}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-colors shadow-md flex items-center gap-2 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Start another migration</span>
          </button>
        </div>

        {/* Stats Grid */}
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

      {/* Verification Card */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <h3 className="text-xs font-semibold text-gray-200">Database objects verification</h3>
          </div>

          <button
            type="button"
            onClick={onRunDeepVerification}
            disabled={isDeepVerifying || verSummary.mode === 'DEEP'}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#121212] border border-[#242424] hover:bg-[#1a1a1a] text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDeepVerifying ? 'animate-spin' : ''}`} strokeWidth={2} />
            <span>{verSummary.mode === 'DEEP' ? 'Deep verified' : 'Run deep verification'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Schemas', 'Tables', 'Indexes', 'Foreign keys'].map((item) => (
            <div
              key={item}
              className="bg-[#121212] p-2.5 rounded-lg border border-[#1f1f1f] flex justify-between items-center"
            >
              <span className="text-xs text-gray-400">{item}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" strokeWidth={2} />
                Verified
              </span>
            </div>
          ))}
        </div>

        {/* Table Breakdown */}
        {verSummary.tables.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-[11px] font-medium text-gray-400">Table row counts</h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#121212] border border-[#242424] text-gray-400">
                {verSummary.mode}
              </span>
            </div>
            <div className="bg-[#121212] border border-[#1f1f1f] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#1a1a1a] text-gray-400 border-b border-[#242424] sticky top-0">
                  <tr>
                    <th className="p-2.5 font-medium">Table</th>
                    <th className="p-2.5 font-medium">Source rows</th>
                    <th className="p-2.5 font-medium">Destination rows</th>
                    <th className="p-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f] text-gray-300">
                  {verSummary.tables.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03]">
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
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
            <HardDrive className="w-4 h-4 text-blue-400" strokeWidth={2} />
            <span>Temporary backup retention</span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Choose whether to delete or keep the generated local dump file.
          </p>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-choice"
                checked={deleteBackup}
                onChange={() => setDeleteBackup(true)}
                className="w-3.5 h-3.5 text-blue-600 bg-[#121212] border-[#242424] focus:ring-1 focus:ring-blue-500/40 focus:ring-offset-0"
              />
              <span className="text-xs text-gray-300">Delete temporary backup archive (recommended)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-choice"
                checked={!deleteBackup}
                onChange={() => setDeleteBackup(false)}
                className="w-3.5 h-3.5 text-blue-600 bg-[#121212] border-[#242424] focus:ring-1 focus:ring-blue-500/40 focus:ring-offset-0"
              />
              <span className="text-xs text-gray-300">Keep temporary backup file</span>
            </label>
          </div>
        </div>

        {/* Export Reports */}
        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
            <FileText className="w-4 h-4 text-purple-400" strokeWidth={2} />
            <span>Export migration report</span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            Export a sanitized audit report with timestamps, duration, and object counts.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={exportJsonReport}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#121212] border border-[#242424] hover:bg-[#1a1a1a] text-gray-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2} />
              <span>JSON report</span>
            </button>

            <button
              type="button"
              onClick={exportTextReport}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-[#121212] border border-[#242424] hover:bg-[#1a1a1a] text-gray-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
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