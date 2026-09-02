import React, { useState } from 'react';
import {
  Check,
  Clock,
  Terminal,
  Copy,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Circle,
} from 'lucide-react';
import { MigrationStage, LogEvent } from '../../types/migration';

interface MigrationProgressProps {
  currentStage: MigrationStage;
  activityText: string;
  elapsedSeconds: number;
  logs: LogEvent[];
  onCancel: () => void;
}

const STAGES: { stage: MigrationStage; label: string }[] = [
  { stage: 'PREFLIGHT', label: 'Preparing' },
  { stage: 'DUMPING', label: 'Creating backup' },
  { stage: 'RESTORING', label: 'Restoring' },
  { stage: 'VERIFYING', label: 'Verifying' },
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

export const MigrationProgress: React.FC<MigrationProgressProps> = ({
  currentStage,
  activityText,
  elapsedSeconds,
  logs,
  onCancel,
}) => {
  const [logsOpen, setLogsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

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
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header & Stage Rail */}
      <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-100">Migration in progress</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{activityText}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-black/25 border border-[#1a1d26] px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/15 border border-red-800/50 text-red-300 transition-colors flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Compact step rail — same visual grammar as the top-level pipeline stepper */}
        <div className="flex items-center">
          {STAGES.map((st, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isLast = idx === STAGES.length - 1;

            return (
              <React.Fragment key={st.stage}>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className={[
                      'w-7 h-7 rounded-full flex items-center justify-center border transition-colors duration-300',
                      isDone && 'bg-blue-500/15 border-blue-500/50 text-blue-400',
                      isCurrent && 'bg-blue-600 border-blue-500 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.15)]',
                      !isDone && !isCurrent && 'bg-[#161922] border-[#262b36] text-gray-600',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <Circle className="w-2 h-2 fill-current" strokeWidth={0} />
                    )}
                  </div>
                  <span
                    className={[
                      'text-[11px] font-medium whitespace-nowrap',
                      isCurrent ? 'text-gray-100' : isDone ? 'text-blue-400' : 'text-gray-600',
                    ].join(' ')}
                  >
                    {st.label}
                  </span>
                </div>

                {!isLast && (
                  <div
                    className={[
                      'h-px flex-1 mx-2 mb-5 transition-colors duration-300',
                      idx < currentIndex ? 'bg-blue-500/50' : 'bg-[#1a1d26]',
                    ].join(' ')}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Live Log Viewer */}
      <div className="bg-[#0e1016] border border-[#1a1d26] rounded-xl overflow-hidden">
        <div
          onClick={() => setLogsOpen(!logsOpen)}
          className="p-4 bg-[#0a0b10] border-b border-[#1a1d26] flex items-center justify-between cursor-pointer hover:bg-[#0d0f16] transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-blue-400" strokeWidth={2} />
            <h3 className="text-xs font-semibold text-gray-200">Live migration log</h3>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-800/40 text-blue-400">
              <Circle className="w-1.5 h-1.5 fill-current" strokeWidth={0} />
              {logs.length} events
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLogs();
              }}
              className="px-2.5 py-1 rounded-md bg-[#161922] hover:bg-[#1c202b] border border-[#262b36] text-gray-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" strokeWidth={2} /> : <Copy className="w-3 h-3" strokeWidth={2} />}
              <span>{copied ? 'Copied' : 'Copy log'}</span>
            </button>

            {logsOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2} />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2} />
            )}
          </div>
        </div>

        {logsOpen && (
          <div className="p-4 bg-black/30 font-mono text-xs text-gray-300 max-h-96 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-600 text-[11px]">Waiting for the first log event…</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 hover:bg-white/[0.02] px-1 py-0.5 rounded">
                  <span className="text-gray-600 shrink-0 select-none text-[11px]">[{log.timestamp}]</span>
                  <span className="leading-relaxed break-all text-[11px] text-gray-300">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};