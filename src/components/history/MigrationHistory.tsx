import React, { useState, useEffect } from 'react';
import { History, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { HistoryRecord } from '../../types/migration';
import { getMigrationHistoryApi, clearMigrationHistoryApi } from '../../lib/tauriBridge';

export const MigrationHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const records = await getMigrationHistoryApi();
      setHistory(records);
    } catch (e) {
      console.error('Failed to load migration history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear your local migration history?')) {
      await clearMigrationHistoryApi();
      setHistory([]);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-100">Migration History</h1>
            <p className="text-xs text-gray-400">
              Audit log of past database migrations performed on this machine.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchHistory}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161a26] border border-[#272e42] hover:bg-[#202638] text-gray-300 transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/40 border border-red-800/40 hover:bg-red-900/50 text-red-300 transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-gray-500 font-mono">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-12 text-center space-y-3">
          <History className="w-8 h-8 text-gray-600 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-300">No Past Migrations Recorded</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Once you execute a database migration using DB Migrate, sanitized metadata will be preserved locally here.
          </p>
        </div>
      ) : (
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0d0f17] text-gray-400 border-b border-[#1e2433]">
              <tr>
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Destination</th>
                <th className="p-3 font-medium">Size</th>
                <th className="p-3 font-medium">Duration</th>
                <th className="p-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2433] text-gray-300">
              {history.map((rec) => (
                <tr key={rec.migration_id} className="hover:bg-[#131724]">
                  <td className="p-3 text-gray-400">
                    {new Date(rec.timestamp).toLocaleDateString()}{' '}
                    {new Date(rec.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <span className="text-gray-200 font-semibold">{rec.source_dbname}</span>
                    <span className="text-gray-500 block text-[11px] truncate max-w-[150px]">
                      {rec.source_provider} ({rec.source_host})
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-gray-200 font-semibold">{rec.destination_dbname}</span>
                    <span className="text-gray-500 block text-[11px] truncate max-w-[150px]">
                      {rec.destination_provider} ({rec.destination_host})
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-gray-200">{rec.dump_size_formatted}</td>
                  <td className="p-3">{formatDuration(rec.duration_seconds)}</td>
                  <td className="p-3 text-right">
                    {rec.status.includes('VERIFIED') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/40">
                        <AlertTriangle className="w-3 h-3" /> {rec.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
