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
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  const handleCopyLogs = () => {
    const fullLog = logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(fullLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header & Stage Rail */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">Migration in progress</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{activityText}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#121212] border border-[#242424] px-3 py-1.5 rounded-lg text-xs font-mono text-gray-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#1a0a0a] hover:bg-red-900/40 border border-red-900/60 text-red-300 transition-colors flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Compact step rail */}
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
                      isDone && 'border-blue-500 text-blue-400 bg-transparent',
                      isCurrent && 'border-blue-500 text-white bg-blue-600 shadow-[0_0_0_3px_rgba(59,130,246,0.25)]',
                      !isDone && !isCurrent && 'border-[#262626] text-gray-500 bg-transparent',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    ) : (
                      <Circle className="w-2 h-2 fill-current text-gray-600" strokeWidth={0} />
                    )}
                  </div>
                  <span
                    className={[
                      'text-[11px] font-medium whitespace-nowrap',
                      isCurrent ? 'text-white' : isDone ? 'text-blue-400' : 'text-gray-500',
                    ].join(' ')}
                  >
                    {st.label}
                  </span>
                </div>

                {!isLast && (
                  <div
                    className={[
                      'h-px flex-1 mx-2 mb-5 transition-colors duration-300',
                      idx < currentIndex ? 'bg-blue-500' : 'bg-[#262626]',
                    ].join(' ')}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Live Log Viewer */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div
          onClick={() => setLogsOpen(!logsOpen)}
          className="p-4 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center justify-between cursor-pointer hover:bg-[#141414] transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-blue-400" strokeWidth={2} />
            <h3 className="text-xs font-semibold text-gray-200">Live migration log</h3>
            <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0a121a] border border-blue-900/60 text-blue-400">
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
              className="px-2.5 py-1 rounded-md bg-[#121212] hover:bg-[#1a1a1a] border border-[#242424] text-gray-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" strokeWidth={2} /> : <Copy className="w-3 h-3" strokeWidth={2} />}
              <span>{copied ? 'Copied' : 'Copy log'}</span>
            </button>

            {logsOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" strokeWidth={2} />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" strokeWidth={2} />
            )}
          </div>
        </div>

        {logsOpen && (
          <div className="p-4 bg-[#050505] font-mono text-xs text-gray-300 max-h-96 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-[11px]">Waiting for the first log event…</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 hover:bg-white/[0.03] px-1 py-0.5 rounded">
                  <span className="text-gray-500 shrink-0 select-none text-[11px]">[{log.timestamp}]</span>
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