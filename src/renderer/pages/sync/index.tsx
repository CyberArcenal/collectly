// src/renderer/pages/sync/index.tsx
import React, { useState } from "react";
import { Cloud, Wifi, WifiOff, Loader2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { dialogs } from "../../utils/dialogs";

import useSync from "./hooks/useSync";
import SyncSummaryCards from "./components/SyncSummaryCards";
import SyncProgressBar from "./components/SyncProgressBar";
import SyncActionsBar from "./components/SyncActionsBar";
import SyncAdvancedActions from "./components/SyncAdvancedActions";
import SyncEntityList from "./components/SyncEntityList";
import SyncConflictList from "./components/SyncConflictList";
import SyncQueueList from "./components/SyncQueueList";

const formatDate = (date: string | null): string => {
  if (!date) return "Never";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "Invalid date";
  }
};

const SyncPage: React.FC = () => {
  const { user } = useAuth();
  const {
    status,
    summary,
    conflicts,
    queueItems,
    loading,
    syncing,
    progress,
    fetchData,
    fullSync,
    incrementalSync,
    syncEntity,
    resolveConflict,
    autoResolveConflicts,
    cleanup,
    resetSync,
  } = useSync();

  const [showConflicts, setShowConflicts] = useState(true);
  const [showQueue, setShowQueue] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Transform metadata to entities
  const entityList = status?.metadata?.map(item => ({
    name: item.entity,
    status: item.status,
    lastSyncedAt: item.lastSyncedAt,
    totalSynced: item.totalSynced,
    lastSyncCount: item.lastSyncCount,
    hasPending: item.hasPending,
  })) || [];

  const handleFullSync = async () => {
    const confirmed = await dialogs.confirm({
      title: "Full Sync",
      message: "This will sync all data from the local database to the server. Are you sure?",
    });
    if (!confirmed) return;
    await fullSync(user?.username || "system");
  };

  const handleIncrementalSync = async () => {
    await incrementalSync(user?.username || "system");
  };

  const handleAutoResolve = async () => {
    const confirmed = await dialogs.confirm({
      title: "Auto-Resolve Conflicts",
      message: "This will automatically resolve all pending conflicts using Last Write Wins (server priority). Continue?",
    });
    if (!confirmed) return;
    await autoResolveConflicts();
  };

  const handleCleanup = async () => {
    const confirmed = await dialogs.confirm({
      title: "Cleanup Sync Data",
      message: "This will delete old sync records (30+ days). Continue?",
    });
    if (!confirmed) return;
    await cleanup(30);
  };

  const handleReset = async () => {
    const confirmed = await dialogs.confirm({
      title: "Reset Sync State",
      message: "This will reset all sync statuses. Use this if you're having sync issues. Continue?",
    });
    if (!confirmed) return;
    await resetSync(undefined, user?.username || "system");
  };

  const handleSyncEntity = async (entityName: string) => {
    await syncEntity(entityName, user?.username || "system");
  };

  const handleResolveConflict = async (id: number, resolution: string) => {
    await resolveConflict(id, resolution, user?.username || "system");
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[var(--primary-color)]" />
            Data Sync
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Synchronize local data with the server
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--card-secondary-bg)] border border-[var(--border-color)]">
            {syncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
                <span className="text-xs text-yellow-500 font-medium">Syncing...</span>
              </>
            ) : status?.isSyncing === false ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-500 font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-500 font-medium">Offline</span>
              </>
            )}
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">
            Last sync: {summary?.lastSync ? formatDate(summary.lastSync) : "Never"}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SyncSummaryCards summary={summary} isSyncing={syncing} />

      {/* Progress Bar */}
      <SyncProgressBar progress={progress} isVisible={syncing} />

      {/* Actions Bar */}
      <SyncActionsBar
        onFullSync={handleFullSync}
        onIncrementalSync={handleIncrementalSync}
        onAutoResolve={handleAutoResolve}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        showAdvanced={showAdvanced}
        syncing={syncing}
        loading={loading}
        conflictsCount={conflicts.length}
      />

      {/* Advanced Actions */}
      {showAdvanced && (
        <SyncAdvancedActions
          onCleanup={handleCleanup}
          onReset={handleReset}
          syncing={syncing}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Entities List */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>Entities</span>
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({entityList.length})
                </span>
              </h3>
              <button
                onClick={fetchData}
                disabled={loading}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
              >
                Refresh
              </button>
            </div>
            <SyncEntityList
              entities={entityList}
              loading={loading}
              onSyncEntity={handleSyncEntity}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Conflicts */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer"
              onClick={() => setShowConflicts(!showConflicts)}
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>Conflicts</span>
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({conflicts.length})
                </span>
              </h3>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                {showConflicts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {showConflicts && (
              <div className="p-3 max-h-60 overflow-y-auto">
                <SyncConflictList
                  conflicts={conflicts}
                  loading={loading}
                  onResolve={handleResolveConflict}
                />
              </div>
            )}
          </div>

          {/* Queue Status */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer"
              onClick={() => setShowQueue(!showQueue)}
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <span>Queue</span>
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({queueItems.length})
                </span>
              </h3>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                {showQueue ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            {showQueue && (
              <div className="p-3 max-h-40 overflow-y-auto">
                <SyncQueueList queueItems={queueItems} />
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="bg-[var(--card-secondary-bg)] rounded-xl border border-[var(--border-color)] p-3">
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {syncing ? "Syncing" : "Idle"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entities</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {summary?.totalEntities || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Synced</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {summary?.totalSynced?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Sync</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {summary?.lastSync ? formatDate(summary.lastSync) : "Never"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-3">
        <p>
          Sync Service v1.0 • {syncing ? "🔄 Syncing..." : "✅ Ready"}
        </p>
      </div>
    </div>
  );
};

export default SyncPage;