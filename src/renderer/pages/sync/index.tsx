// src/renderer/pages/sync/index.tsx

import React, { useState } from "react";
import {
  Cloud,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  Database,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { dialogs } from "../../utils/dialogs";
import useSync from "./hooks/useSync";
import SyncSummaryCards from "./components/SyncSummaryCards";
import SyncProgressBar from "./components/SyncProgressBar";
import SyncActionsBar from "./components/SyncActionsBar";
import SyncEntityList from "./components/SyncEntityList";

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
    syncStatus,
    currentTask,
    pendingChanges,
    isLoading,
    isSyncing,
    error,
    lastSyncAt,
    progress,
    entityList,
    startFullSync,
    refresh,
    cancelSync,
  } = useSync();

  // ─── Handlers ───
  const handleFullSync = async () => {
    const confirmed = await dialogs.confirm({
      title: "Full Sync",
      message:
        "This will sync all local data to the server. Continue?",
    });
    if (!confirmed) return;

    try {
      await startFullSync({
        client_user: user?.username || "system",
        device_id: navigator.userAgent || "unknown",
        app_version: "1.0.0", // Could get from package.json
      });
    } catch (err: any) {
      // Error is already handled in context
      console.error("Sync error:", err);
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleCancel = async () => {
    const confirmed = await dialogs.confirm({
      title: "Cancel Sync",
      message: "Are you sure you want to cancel the ongoing sync?",
    });
    if (!confirmed) return;
    await cancelSync();
  };

  // ─── Compute stats ───
  const totalEntities = syncStatus?.totalEntities || 0;
  const pendingSyncs = syncStatus?.pendingSyncs || 0;
  const pendingChangesCount = pendingChanges.length;

  // ─── Render ───
  return (
    <div className="p-4 space-y-4">
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
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
                <span className="text-xs text-yellow-500 font-medium">
                  Syncing...
                </span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-500 font-medium">
                  Online
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">
            Last sync: {lastSyncAt ? formatDate(lastSyncAt) : "Never"}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SyncSummaryCards
        syncStatus={syncStatus}
        pendingChanges={pendingChanges}
        isSyncing={isSyncing}
        progress={progress}
      />

      {/* Progress Bar */}
      <SyncProgressBar
        currentTask={currentTask}
        isVisible={isSyncing || currentTask?.status === "queued"}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => refresh()}
            className="text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Actions */}
      <SyncActionsBar
        onFullSync={handleFullSync}
        onRefresh={handleRefresh}
        isSyncing={isSyncing}
        isLoading={isLoading}
      />

      {/* Cancel button when syncing */}
      {isSyncing && (
        <button
          onClick={handleCancel}
          className="text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          Cancel Sync
        </button>
      )}

      {/* Entity List */}
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
          <div className="text-xs text-[var(--text-secondary)]">
            {pendingChangesCount > 0 && (
              <span className="text-blue-500">
                {pendingChangesCount} entity(ies) have local changes
              </span>
            )}
          </div>
        </div>
        <SyncEntityList entities={entityList} loading={isLoading} />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-3">
        <p>Sync Service v2.0 • {isSyncing ? "🔄 Syncing..." : "✅ Ready"}</p>
        <p className="mt-0.5">
          {totalEntities} entities • {pendingSyncs} pending syncs
        </p>
      </div>
    </div>
  );
};

export default SyncPage;