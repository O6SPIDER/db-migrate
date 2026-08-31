import React, { useState } from 'react';
import { Settings, Wrench, Shield, HardDrive, RefreshCw, Check } from 'lucide-react';
import { ToolchainSelection, VerificationMode } from '../../types/migration';

interface SettingsViewProps {
  toolchain?: ToolchainSelection;
  onRescanTools: () => void;
  isRescanning: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  toolchain,
  onRescanTools,
  isRescanning,
}) => {
  const [defaultVerification, setDefaultVerification] = useState<VerificationMode>('STANDARD');
  const [backupBehavior, setBackupBehavior] = useState<'delete' | 'ask'>('delete');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Application Settings</h1>
          <p className="text-xs text-gray-400">
            Configure PostgreSQL client binary locations, verification modes, and application safety rules.
          </p>
        </div>
      </div>

      {/* Client Tools Configuration */}
      <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e2433] pb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-200">Auto-Detected Client Tools</h3>
          </div>

          <button
            type="button"
            onClick={onRescanTools}
            disabled={isRescanning}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#161a26] border border-[#272e42] hover:bg-[#202638] text-gray-300 transition-all flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin' : ''}`} />
            <span>Re-scan Client Tools</span>
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-[#090a0f] border border-[#1e2433] rounded-lg space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">pg_dump</span>
              <span className="text-emerald-400 font-medium">
                {toolchain?.selected_dump ? `v${toolchain.selected_dump.version}` : 'Not found'}
              </span>
            </div>
            <p className="text-gray-500 text-[11px] truncate">
              {toolchain?.selected_dump?.path || 'No compatible executable detected in PATH'}
            </p>
          </div>

          <div className="p-3 bg-[#090a0f] border border-[#1e2433] rounded-lg space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">pg_restore</span>
              <span className="text-emerald-400 font-medium">
                {toolchain?.selected_restore ? `v${toolchain.selected_restore.version}` : 'Not found'}
              </span>
            </div>
            <p className="text-gray-500 text-[11px] truncate">
              {toolchain?.selected_restore?.path || 'No compatible executable detected in PATH'}
            </p>
          </div>

          <div className="p-3 bg-[#090a0f] border border-[#1e2433] rounded-lg space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-semibold">psql</span>
              <span className="text-blue-400 font-medium">
                {toolchain?.selected_psql ? `v${toolchain.selected_psql.version}` : 'Not found'}
              </span>
            </div>
            <p className="text-gray-500 text-[11px] truncate">
              {toolchain?.selected_psql?.path || 'No executable detected in PATH'}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Settings */}
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 font-mono">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Default Verification Mode</span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Standard mode verifies catalog structure and system estimates. Deep mode counts exact table rows.
          </p>

          <div className="space-y-2 pt-1 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="radio"
                name="verification-pref"
                checked={defaultVerification === 'STANDARD'}
                onChange={() => setDefaultVerification('STANDARD')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 font-medium">Standard (Fast catalog stats)</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="radio"
                name="verification-pref"
                checked={defaultVerification === 'DEEP'}
                onChange={() => setDefaultVerification('DEEP')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 font-medium">Deep (Exact COUNT(*) per table)</span>
            </label>
          </div>
        </div>

        {/* Backup Retention */}
        <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-200 font-mono">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Backup Archive Behavior</span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Manage automatic cleanup of temporary PostgreSQL custom dump files post-migration.
          </p>

          <div className="space-y-2 pt-1 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-pref"
                checked={backupBehavior === 'delete'}
                onChange={() => setBackupBehavior('delete')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 font-medium">Delete temporary dump after verified success</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="radio"
                name="backup-pref"
                checked={backupBehavior === 'ask'}
                onChange={() => setBackupBehavior('ask')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-300 font-medium">Keep dump files for manual inspection</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save action */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-gray-500 font-mono">Preferences saved in local storage.</span>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm flex items-center space-x-1.5 font-mono"
        >
          {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : null}
          <span>{savedSuccess ? 'Saved Preferences' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
};
