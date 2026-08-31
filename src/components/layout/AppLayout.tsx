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
    <div className="flex h-screen w-screen bg-[#090a0f] text-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0f17] border-r border-[#1e2433] flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-[#1e2433] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-100 tracking-tight">
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
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'migration'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#141824]'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>New Migration</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#141824]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Migration History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#141824]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Status */}
        <div className="p-3 border-t border-[#1e2433] bg-[#0b0c13]">
          <div className="p-3 rounded-md bg-[#121520] border border-[#1e2433] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-gray-400" />
                <span>Client Tooling</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isToolchainReady
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                    : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isToolchainReady ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {isToolchainReady ? `pg_dump v${dumpVersion}` : 'Checking'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security</span>
              </span>
              <span className="font-mono text-[10px] text-gray-300">PGPASSFILE Isolated</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#090a0f] overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
