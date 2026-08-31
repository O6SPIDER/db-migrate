import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Terminal,
  Copy,
  Check,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MigrationStage, LogEvent } from '../../types/migration';

interface MigrationProgressProps {
  currentStage: MigrationStage;
  activityText: string;
  elapsedSeconds: number;
  logs: LogEvent[];
  onCancel: () => void;
}

export const MigrationProgress: React.FC<MigrationProgressProps> = ({
  currentStage,
  activityText,
  elapsedSeconds,
  logs,
  onCancel,
}) => {
  const [logsOpen, setLogsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const stages: { stage: MigrationStage; label: string }[] = [
    { stage: 'PREFLIGHT', label: 'Preparing' },
    { stage: 'DUMPING', label: 'Creating Backup' },
    { stage: 'RESTORING', label: 'Restoring Database' },
    { stage: 'VERIFYING', label: 'Verifying Destination' },
    { stage: 'COMPLETED', label: 'Complete' },
  ];

  const getStageIndex = (s: MigrationStage) => {
    switch (s) {
      case 'PREFLIGHT':
        return 0;
      case 'DUMPING':
        return 1;
      case 'RESTORING':
        return 2;
      case 'VERIFYING':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Stage Stepper */}
      <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-100">Migration in Progress</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{activityText}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[#090a0f] border border-[#1e2433] px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Elapsed: {formatElapsed(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 transition-all flex items-center space-x-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Cancel Migration</span>
            </button>
          </div>
        </div>

        {/* Visual Stepper */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {stages.map((st, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={st.stage} className="space-y-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isDone
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-[#1e2433]'
                  }`}
                />
                <div className="flex items-center space-x-1.5 text-xs font-mono">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                  )}
                  <span
                    className={`truncate ${
                      isDone
                        ? 'text-emerald-400 font-medium'
                        : isCurrent
                        ? 'text-blue-400 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Log Viewer */}
      <div className="bg-[#11131a] border border-[#1e2433] rounded-xl overflow-hidden shadow-sm">
        <div
          onClick={() => setLogsOpen(!logsOpen)}
          className="p-4 bg-[#0d0f17] border-b border-[#1e2433] flex items-center justify-between cursor-pointer hover:bg-[#141824] transition-colors select-none"
        >
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-gray-200 font-mono">Sanitized Live Migration Log</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
              {logs.length} events
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLogs();
              }}
              className="px-2.5 py-1 rounded bg-[#1b202e] hover:bg-[#252c3f] border border-[#2b344a] text-gray-300 text-[11px] font-mono flex items-center space-x-1 transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy Log'}</span>
            </button>

            {logsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {logsOpen && (
          <div className="p-4 bg-[#090a0f] font-mono text-xs text-gray-300 max-h-96 overflow-y-auto space-y-1.5">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic text-[11px]">Awaiting initial child process events...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 hover:bg-[#11131a] px-1 py-0.5 rounded">
                  <span className="text-gray-500 shrink-0 select-none text-[11px]">
                    [{log.timestamp}]
                  </span>
                  <span className="leading-relaxed break-all text-[11px]">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
