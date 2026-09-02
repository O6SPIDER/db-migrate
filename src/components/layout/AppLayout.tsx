import React from 'react';
import {
  Database,
  History,
  Settings,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { ToolchainSelection } from '../../types/migration';

interface AppLayoutProps {
  activeTab: 'migration' | 'history' | 'settings';
  setActiveTab: (tab: 'migration' | 'history' | 'settings') => void;
  toolchain?: ToolchainSelection;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  toolchain,
  children,
}) => {
  const isToolchainReady = toolchain?.compatible ?? false;
  const dumpVersion = toolchain?.selected_dump?.version || 'None';

  return (
    <div className="flex h-screen w-screen bg-[#000000] text-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#080808] border-r border-[#1f1f1f] flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-[#1f1f1f] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Database className="w-5 h-5 text-blue-400" strokeWidth={2} />
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  DB Migrate
                </h1>
                <p className="text-[10px] text-gray-400 font-mono">v0.1.0 • Postgres</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('migration')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'migration'
                  ? 'bg-[#181818] text-white border border-[#2a2a2a] shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-[#121212]'
              }`}
            >
              <Database className="w-4 h-4 text-blue-400" strokeWidth={2} />
              <span>New Migration</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#181818] text-white border border-[#2a2a2a] shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-[#121212]'
              }`}
            >
              <History className="w-4 h-4 text-purple-400" strokeWidth={2} />
              <span>Migration History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#181818] text-white border border-[#2a2a2a] shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-[#121212]'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-400" strokeWidth={2} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Status */}
        <div className="p-3 border-t border-[#1f1f1f] bg-[#050505]">
          <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                <span>Client Tooling</span>
              </span>
              <span
                className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                  isToolchainReady
                    ? 'bg-[#0d1a12] text-emerald-400 border-emerald-900/60'
                    : 'bg-[#1a140d] text-amber-400 border-amber-900/60'
                }`}
              >
                {isToolchainReady ? `pg_dump v${dumpVersion}` : 'Checking'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                <span>Security</span>
              </span>
              <span className="font-mono text-[10px] text-gray-300">PGPASSFILE Isolated</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
