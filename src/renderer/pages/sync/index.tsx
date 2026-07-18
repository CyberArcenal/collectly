// src/renderer/pages/sync/index.tsx
import React, { useState } from "react";
import {
  Cloud,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Database,
  Play,
  Settings,
  AlertTriangle,
  Clock,
  HardDrive,
} from "lucide-react";
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
import PendingRecordsModal from "./components/PendingRecordsModal";

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
    syncEntityByName,
    resolveConflict,
    autoResolveConflicts,
    cleanup,
    resetSync,
  } = useSync();

  const [showConflicts, setShowConflicts] = useState(true);
  const [showQueue, setShowQueue] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pendingModalEntity, setPendingModalEntity] = useState<string | null>(
    null,
  );

  const getSummary = (
    camelKey: string,
    snakeKey: string,
    fallback: any = 0,
  ) => {
    return (
      (summary as any)?.[camelKey] ?? (summary as any)?.[snakeKey] ?? fallback
    );
  };
  // Transform metadata to entities
  const entityList =
    status?.metadata?.map((item) => ({
      name: item.entity,
      status: item.status,
      lastSyncedAt: item.lastSyncedAt || item.last_synced_at || null,
      totalSynced: item.totalSynced || item.total_synced || 0,
      lastSyncCount: item.lastSyncCount || item.last_sync_count || 0,
      hasPending: item.hasPending || item.has_pending || false,
      pendingCount: (item as any).pendingCount ?? 0,
    })) || [];

  const lastSync = getSummary("lastSync", "last_sync", null);
  const totalEntities = getSummary("totalEntities", "total_entities");
  const totalSynced = getSummary("totalSynced", "total_synced");
  const pending = getSummary("pending", "pending");
  const failed = getSummary("failed", "failed");

  console.log("Synce Entities", entityList);
  console.log("status: ", status);
  console.log("Summary", summary);
  console.log("conflict: ", conflicts);
  console.log("Queue items", queueItems);

  const handleFullSync = async () => {
    const confirmed = await dialogs.confirm({
      title: "Full Sync",
      message:
        "This will sync all data from the local database to the server. Are you sure?",
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
      message:
        "This will automatically resolve all pending conflicts using Last Write Wins (server priority). Continue?",
    });
    if (!confirmed) return;
    await autoResolveConflicts();
  };

  const handleViewPending = (entityName: string) => {
    setPendingModalEntity(entityName);
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
      message:
        "This will reset all sync statuses. Use this if you're having sync issues. Continue?",
    });
    if (!confirmed) return;
    await resetSync(undefined, user?.username || "system");
  };

  const handleSyncEntity = async (entityName: string) => {
    await syncEntityByName(entityName, user?.username || "system");
  };

  const handleResolveConflict = async (id: number, resolution: string) => {
    await resolveConflict(id, resolution, user?.username || "system");
  };

  return (
    <div className="p-4 space-y-4">
      {/* ─── Header ─── */}
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
                <span className="text-xs text-yellow-500 font-medium">
                  Syncing...
                </span>
              </>
            ) : status?.isSyncing === false ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-500 font-medium">
                  Online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-500 font-medium">
                  Offline
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">
            Last sync:{" "}
            {summary?.lastSync ? formatDate(summary.lastSync) : "Never"}
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

      {/* ─── Summary Cards ─── */}
      <SyncSummaryCards summary={summary} isSyncing={syncing} />

      {/* ─── Progress Bar ─── */}
      <SyncProgressBar progress={progress} isVisible={syncing} />

      {/* ─── Actions ─── */}
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

      {/* ─── Advanced Actions ─── */}
      {showAdvanced && (
        <SyncAdvancedActions
          onCleanup={handleCleanup}
          onReset={handleReset}
          syncing={syncing}
        />
      )}

      {/* ─── Main Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Entities List ─── */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--primary-color)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Entities
                </h3>
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({entityList.length})
                </span>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
              >
                Refresh
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--primary-color)] animate-spin" />
              </div>
            ) : entityList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-tertiary)]">
                <Database className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">No entities found</p>
                <p className="text-xs mt-0.5">Run a sync to populate data</p>
              </div>
            ) : (
              <SyncEntityList
                entities={entityList}
                loading={loading}
                onSyncEntity={handleSyncEntity}
                onViewPending={handleViewPending}
              />
            )}
          </div>
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="space-y-4">
          {/* ─── Conflicts ─── */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:bg-[var(--card-hover-bg)] transition-colors"
              onClick={() => setShowConflicts(!showConflicts)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Conflicts
                </h3>
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({conflicts.length})
                </span>
              </div>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                {showConflicts ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
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

          {/* ─── Queue ─── */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:bg-[var(--card-hover-bg)] transition-colors"
              onClick={() => setShowQueue(!showQueue)}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Queue
                </h3>
                <span className="text-xs text-[var(--text-tertiary)] font-normal">
                  ({queueItems.length})
                </span>
              </div>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                {showQueue ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
            {showQueue && (
              <div className="p-3 max-h-40 overflow-y-auto">
                <SyncQueueList queueItems={queueItems} />
              </div>
            )}
          </div>

          {/* ─── Quick Stats ─── */}
          <div className="bg-[var(--card-secondary-bg)] rounded-xl border border-[var(--border-color)] p-3">
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {syncing
                    ? "Syncing"
                    : status?.isSyncing === false
                      ? "Idle"
                      : "Offline"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Entities</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {totalEntities}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Synced</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {totalSynced.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="font-medium text-yellow-500">{pending}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed</span>
                <span className="font-medium text-red-500">{failed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-3">
        <p>Sync Service v1.0 • {syncing ? "🔄 Syncing..." : "✅ Ready"}</p>
      </div>

      <PendingRecordsModal
        entityName={pendingModalEntity}
        isOpen={!!pendingModalEntity}
        onClose={() => setPendingModalEntity(null)}
      />
    </div>
  );
};

export default SyncPage;
