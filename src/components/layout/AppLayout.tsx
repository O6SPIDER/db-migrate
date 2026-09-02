import React, { useState } from 'react';
import {
  Database,
  History,
  Settings,
  ShieldCheck,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ToolchainSelection } from '../../types/migration';
import appIcon from '../../assets/app-icon.png';

interface AppLayoutProps {
  activeTab: 'migration' | 'history' | 'settings';
  setActiveTab: (tab: 'migration' | 'history' | 'settings') => void;
  toolchain?: ToolchainSelection;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'migration', label: 'New Migration', icon: Database, color: 'text-blue-400' },
  { id: 'history', label: 'Migration History', icon: History, color: 'text-purple-400' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-emerald-400' },
] as const;

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  toolchain,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isToolchainReady = toolchain?.compatible ?? false;
  const dumpVersion = toolchain?.selected_dump?.version || 'None';

  return (
    <div className="flex h-screen w-screen bg-[#000000] text-gray-100 overflow-hidden font-sans">
      {/* Collapsible Sidebar */}
      <aside
        className={`bg-[#080808] border-r border-[#1f1f1f] flex flex-col justify-between flex-shrink-0 transition-all duration-300 cubic-bezier(0.4,0,0.2,1) select-none ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#1f1f1f] flex items-center overflow-hidden">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 px-1 min-w-0">
                <img src={appIcon} alt="DB Migrate" className="w-6 h-6 object-contain shrink-0 rounded" />
                <div className="min-w-0 transition-all duration-300">
                  <h1 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                    DB Migrate
                  </h1>
                  <p className="text-[10px] text-gray-400 font-mono leading-tight truncate">
                    v0.1.0 • Postgres
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-center">
                <img src={appIcon} alt="DB Migrate" className="w-6 h-6 object-contain shrink-0 rounded mx-auto" />
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-200 ${
                      isActive
                        ? 'bg-[#181818] text-white border border-[#2a2a2a] shadow-sm ring-1 ring-white/10'
                        : 'text-gray-400 hover:text-white hover:bg-[#121212] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.color} shrink-0`} strokeWidth={2} />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#181818] text-white border border-[#2a2a2a] shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-[#121212] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.color} shrink-0`} strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Controls & Status */}
        <div className="p-2 border-t border-[#1f1f1f] bg-[#050505] space-y-2">
          {!isCollapsed ? (
            <>
              <div className="p-3 rounded-lg bg-[#0d0d0d] border border-[#1f1f1f] space-y-2 transition-all duration-300">
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

              {/* Collapse Button at Bottom */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-[#121212] transition-colors border border-transparent hover:border-[#1f1f1f]"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Collapse Sidebar</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-1">
              <div title={isToolchainReady ? `pg_dump v${dumpVersion}` : 'Checking toolchain'}>
                <Wrench
                  className={`w-4 h-4 ${isToolchainReady ? 'text-emerald-400' : 'text-amber-400'}`}
                  strokeWidth={2}
                />
              </div>
              <div title="Security: PGPASSFILE Isolated">
                <ShieldCheck className="w-4 h-4 text-emerald-400" strokeWidth={2} />
              </div>

              {/* Expand Button at Bottom */}
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#121212] transition-colors border border-transparent hover:border-[#1f1f1f] mt-1"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 shrink-0" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Area with Fluid Animation */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-y-auto transition-all duration-300 cubic-bezier(0.4,0,0.2,1)">
        {children}
      </main>
    </div>
  );
};
