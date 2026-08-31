import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { SourceCard } from './components/migration/SourceCard';
import { DestinationCard } from './components/migration/DestinationCard';
import { SwapButton } from './components/migration/SwapButton';
import { ToolchainCard } from './components/migration/ToolchainCard';
import { PreflightCheck } from './components/migration/PreflightCheck';
import { MigrationReview } from './components/migration/MigrationReview';
import { MigrationProgress } from './components/migration/MigrationProgress';
import { CompletionScreen } from './components/migration/CompletionScreen';
import { MigrationHistory } from './components/history/MigrationHistory';
import { SettingsView } from './components/settings/SettingsView';
import {
  SafeDatabaseIdentity,
  ToolchainSelection,
  MigrationStage,
  LogEvent,
  MigrationReport,
} from './types/migration';
import {
  testConnectionApi,
  discoverToolsApi,
  runMigrationApi,
  cancelMigrationApi,
  runDeepVerificationApi,
  listenMigrationProgress,
  listenMigrationLog,
  listenMigrationComplete,
} from './lib/tauriBridge';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'migration' | 'history' | 'settings'>('migration');
  const [migrationStage, setMigrationStage] = useState<MigrationStage>('DRAFT');

  // Input states
  const [sourceUrl, setSourceUrl] = useState('');
  const [destUrl, setDestUrl] = useState('');

  // Connected Identity states
  const [sourceId, setSourceId] = useState<SafeDatabaseIdentity | undefined>();
  const [destId, setDestId] = useState<SafeDatabaseIdentity | undefined>();

  // Loading & Error states
  const [sourceLoading, setSourceLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | undefined>();
  const [destError, setDestError] = useState<string | undefined>();

  // Safety acknowledgment for non-empty destination
  const [destAcknowledged, setDestAcknowledged] = useState(false);

  // Toolchain state
  const [toolchain, setToolchain] = useState<ToolchainSelection | undefined>();
  const [toolchainLoading, setToolchainLoading] = useState(false);

  // Live progress states
  const [activityText, setActivityText] = useState('Initializing migration engine...');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [report, setReport] = useState<MigrationReport | undefined>();
  const [isDeepVerifying, setIsDeepVerifying] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Initial tool discovery
  const loadToolchain = async (sourceVersion?: string) => {
    setToolchainLoading(true);
    try {
      const tc = await discoverToolsApi(sourceVersion);
      setToolchain(tc);
    } catch (e: any) {
      console.error('Failed to discover tools:', e);
    } finally {
      setToolchainLoading(false);
    }
  };

  useEffect(() => {
    loadToolchain();
  }, []);

  // Timer lifecycle for active migration
  useEffect(() => {
    if (['DUMPING', 'RESTORING', 'VERIFYING', 'PREFLIGHT'].includes(migrationStage)) {
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [migrationStage]);

  // Test Connection Handlers
  const handleTestSource = async () => {
    if (!sourceUrl) return;
    setSourceLoading(true);
    setSourceError(undefined);
    try {
      const id = await testConnectionApi(sourceUrl);
      setSourceId(id);
      // Automatically re-evaluate toolchain compatibility against source postgres version
      await loadToolchain(id.server_version);
    } catch (err: any) {
      setSourceError(err.toString());
      setSourceId(undefined);
    } finally {
      setSourceLoading(false);
    }
  };

  const handleTestDest = async () => {
    if (!destUrl) return;
    setDestLoading(true);
    setDestError(undefined);
    try {
      const id = await testConnectionApi(destUrl);
      setDestId(id);
    } catch (err: any) {
      setDestError(err.toString());
      setDestId(undefined);
    } finally {
      setDestLoading(false);
    }
  };

  // Safe Swap Handler
  const handleSwap = () => {
    const tmpUrl = sourceUrl;
    setSourceUrl(destUrl);
    setDestUrl(tmpUrl);

    const tmpId = sourceId;
    setSourceId(destId);
    setDestId(tmpId);

    setSourceError(undefined);
    setDestError(undefined);
  };

  // Same Database Check
  const isSameDatabase =
    !!sourceId &&
    !!destId &&
    (sourceId.hostname.toLowerCase() === destId.hostname.toLowerCase() &&
      sourceId.dbname.toLowerCase() === destId.dbname.toLowerCase());

  // Can move to Dry Run Review
  const canReview =
    !!sourceId &&
    !!destId &&
    !isSameDatabase &&
    (toolchain?.compatible ?? false);

  const handleProceedToReview = () => {
    setMigrationStage('REVIEW');
  };

  // Execute Live Migration
  const handleStartMigration = async () => {
    setMigrationStage('PREFLIGHT');
    setElapsedSeconds(0);
    setLogs([]);
    setActivityText('Initializing safe PostgreSQL migration engine...');

    // Attach listeners for live events
    const unlistenProgress = await listenMigrationProgress((evt) => {
      setMigrationStage(evt.stage);
      setActivityText(evt.activity);
      if (evt.elapsed_seconds > 0) {
        setElapsedSeconds(evt.elapsed_seconds);
      }
    });

    const unlistenLog = await listenMigrationLog((evt) => {
      setLogs((prev) => [...prev, evt]);
    });

    const unlistenComplete = await listenMigrationComplete((rpt) => {
      setReport(rpt);
      setMigrationStage('COMPLETED');
    });

    try {
      const resReport = await runMigrationApi(sourceUrl, destUrl, false);
      setReport(resReport);
      setMigrationStage('COMPLETED');
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `[ERROR] ${err.toString()}` },
      ]);
      setMigrationStage('FAILED');
    } finally {
      unlistenProgress();
      unlistenLog();
      unlistenComplete();
    }
  };

  const handleCancel = async () => {
    await cancelMigrationApi();
    setMigrationStage('CANCELLED');
    setActivityText('Migration process safely cancelled by user.');
  };

  const handleRunDeepVerification = async () => {
    if (!sourceUrl || !destUrl) return;
    setIsDeepVerifying(true);
    try {
      const summary = await runDeepVerificationApi(sourceUrl, destUrl);
      if (report) {
        setReport({
          ...report,
          verification_summary: summary,
          status: summary.status,
        });
      }
    } catch (e: any) {
      console.error('Deep verification failed:', e);
    } finally {
      setIsDeepVerifying(false);
    }
  };

  const handleReset = () => {
    setMigrationStage('DRAFT');
    setReport(undefined);
    setLogs([]);
    setElapsedSeconds(0);
  };

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      toolchain={toolchain}
    >
      {/* HISTORY TAB */}
      {activeTab === 'history' && <MigrationHistory />}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <SettingsView
          toolchain={toolchain}
          onRescanTools={() => loadToolchain(sourceId?.server_version)}
          isRescanning={toolchainLoading}
        />
      )}

      {/* NEW MIGRATION TAB */}
      {activeTab === 'migration' && (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
          {/* Top Title Banner */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-gray-100">
              PostgreSQL Database Migration
            </h1>
            <p className="text-xs text-gray-400">
              Move an entire PostgreSQL database safely between accounts or hosts using native client tooling.
            </p>
          </div>

          {/* DRAFT STATE: Main Setup Form */}
          {migrationStage === 'DRAFT' && (
            <div className="space-y-6">
              {/* Source Database Card */}
              <SourceCard
                url={sourceUrl}
                setUrl={setSourceUrl}
                identity={sourceId}
                isLoading={sourceLoading}
                onTestConnection={handleTestSource}
                error={sourceError}
              />

              {/* Swap Button */}
              <SwapButton onSwap={handleSwap} disabled={sourceLoading || destLoading} />

              {/* Destination Database Card */}
              <DestinationCard
                url={destUrl}
                setUrl={setDestUrl}
                identity={destId}
                isLoading={destLoading}
                onTestConnection={handleTestDest}
                error={destError}
                destAcknowledged={destAcknowledged}
                setDestAcknowledged={setDestAcknowledged}
              />

              {/* Toolchain Selection Card */}
              <ToolchainCard
                toolchain={toolchain}
                onRescan={() => loadToolchain(sourceId?.server_version)}
                isLoading={toolchainLoading}
              />

              {/* Preflight Validation Summary */}
              {(sourceId || destId) && (
                <PreflightCheck
                  sourceId={sourceId}
                  destId={destId}
                  toolchain={toolchain}
                  isSameDatabase={isSameDatabase}
                  destAcknowledged={destAcknowledged}
                />
              )}

              {/* Same Database Error Banner */}
              {isSameDatabase && (
                <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-100">Same Database Migration Blocked</h4>
                    <p className="text-red-300/90 mt-0.5">
                      Source and destination refer to the exact same database. Choose a different destination database URL.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Review Proceed Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  disabled={!canReview}
                  className="px-6 py-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center space-x-2 font-mono"
                >
                  <span>Review Migration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* REVIEW STATE: Non-destructive Dry Run Summary */}
          {migrationStage === 'REVIEW' && sourceId && destId && toolchain && (
            <MigrationReview
              sourceId={sourceId}
              destId={destId}
              toolchain={toolchain}
              destAcknowledged={destAcknowledged}
              onBack={() => setMigrationStage('DRAFT')}
              onStartMigration={handleStartMigration}
              isStarting={false}
            />
          )}

          {/* ACTIVE PROGRESS STATE */}
          {['PREFLIGHT', 'DUMPING', 'RESTORING', 'VERIFYING'].includes(migrationStage) && (
            <MigrationProgress
              currentStage={migrationStage}
              activityText={activityText}
              elapsedSeconds={elapsedSeconds}
              logs={logs}
              onCancel={handleCancel}
            />
          )}

          {/* FAILED / CANCELLED STATE */}
          {(migrationStage === 'FAILED' || migrationStage === 'CANCELLED') && (
            <div className="bg-[#11131a] border border-[#1e2433] rounded-xl p-8 text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <h2 className="text-base font-semibold text-gray-100">
                {migrationStage === 'CANCELLED' ? 'Migration Cancelled' : 'Migration Failed'}
              </h2>
              <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">{activityText}</p>

              <div className="pt-2 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                >
                  Back to Setup
                </button>
              </div>
            </div>
          )}

          {/* COMPLETED STATE */}
          {migrationStage === 'COMPLETED' && report && (
            <CompletionScreen
              report={report}
              onRunDeepVerification={handleRunDeepVerification}
              isDeepVerifying={isDeepVerifying}
              onReset={handleReset}
            />
          )}
        </div>
      )}
    </AppLayout>
  );
};
