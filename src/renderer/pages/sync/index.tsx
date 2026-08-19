// src/renderer/pages/sync/index.tsx
import React, { useMemo, useState } from "react"; // 🆕 added useState
import {
  Cloud,
  Loader2,
  RefreshCw,
  Database,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { dialogs } from "../../utils/dialogs";
import useSync from "./hooks/useSync";
import SyncSummaryCards from "./components/SyncSummaryCards";
import SyncProgressBar from "./components/SyncProgressBar";
import SyncActionsBar from "./components/SyncActionsBar";
import SyncEntityList from "./components/SyncEntityList";

// Relative time helper (desktop-style)
const getRelativeTime = (date: string | null): string => {
  if (!date) return "Never";
  try {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
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
    pullFullSync,
    startFullSync,
    refresh,
    cancelSync,
  } = useSync();

  // ─── Local loading state for pull sync ─── 🆕
  const [isPulling, setIsPulling] = useState(false);

  // ─── Handlers ───
  const handleFullSync = async () => {
    const confirmed = await dialogs.confirm({
      title: "Full Sync",
      message: "This will sync all local data to the server. Continue?",
    });
    if (!confirmed) return;
    try {
      await startFullSync({
        client_user: user?.username || "system",
        device_id: navigator.userAgent || "unknown",
        app_version: "1.0.0",
      });
    } catch (err: any) {
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

  const handlePullSync = async () => {
    const confirmed = await dialogs.confirm({
      title: "Refresh from Server",
      message:
        "This will replace all local data with the latest data from the server. Continue?",
    });
    if (!confirmed) return;
    setIsPulling(true);
    try {
      await pullFullSync();
    } catch (err) {
      // handled in context
    } finally {
      setIsPulling(false);
    }
  };

  // ─── Computed ───
  const totalEntities = syncStatus?.totalEntities || 0;
  const pendingSyncs = syncStatus?.pendingSyncs || 0;
  const pendingChangesCount = pendingChanges.length;

  const statusConfig = useMemo(() => {
    if (isSyncing)
      return {
        label: "Syncing",
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        dot: "animate-pulse",
      };
    if (error)
      return {
        label: "Error",
        color: "text-red-500",
        bg: "bg-red-500/10",
        dot: "",
      };
    if (pendingChangesCount > 0)
      return {
        label: "Changes Pending",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        dot: "",
      };
    return {
      label: "Online & Synced",
      color: "text-green-500",
      bg: "bg-green-500/10",
      dot: "",
    };
  }, [isSyncing, error, pendingChangesCount]);

  return (
    <div className="flex flex-col h-full">
      {/* ─── TOOLBAR ─── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-color)] bg-[var(--card-bg)]/90 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-blue)] text-white shadow-md">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Data Sync
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Synchronize local data with the server
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Chip */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} border-[var(--border-color)]`}
          >
            <span
              className={`w-2 h-2 rounded-full ${statusConfig.dot} ${statusConfig.color.replace("text", "bg")}`}
            />
            <span className={`text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          {/* Last Sync */}
          <div className="hidden md:flex items-center gap-2 text-xs text-[var(--text-tertiary)] bg-[var(--card-secondary-bg)] px-3 py-1.5 rounded-full border border-[var(--border-color)]">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Last sync:{" "}
              <span className="text-[var(--text-secondary)] font-medium">
                {getRelativeTime(lastSyncAt)}
              </span>
            </span>
          </div>
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] transition-all disabled:opacity-50 border border-[var(--border-color)] bg-[var(--card-bg)]"
          >
            <RefreshCw
              className={`w-4 h-4 text-[var(--text-secondary)] ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Sync Actions – now with Cancel button */}
        <SyncActionsBar
          onFullSync={handleFullSync}
          onRefresh={handleRefresh}
          onPullSync={handlePullSync}
          onCancel={handleCancel} // 🆕
          isSyncing={isSyncing}
          isLoading={isLoading || isPulling} // 🆕 include isPulling
        />

        {/* Progress Bar */}
        <SyncProgressBar
          currentTask={currentTask}
          isVisible={isSyncing || currentTask?.status === "queued"}
          onCancel={handleCancel} // 🆕
        />

        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-500 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs font-medium hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <SyncSummaryCards
          syncStatus={syncStatus}
          pendingChanges={pendingChanges}
          isSyncing={isSyncing}
          progress={progress}
          isLoading={isLoading}
        />

        {/* Entity List */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--card-secondary-bg)]/30">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-[var(--primary-color)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Entities
              </h3>
              <span className="text-xs text-[var(--text-tertiary)] bg-[var(--card-bg)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                {entityList.length}
              </span>
            </div>
            {pendingChangesCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {pendingChangesCount} local change(s) detected
              </div>
            )}
          </div>
          <SyncEntityList entities={entityList} loading={isLoading} />
        </div>

        {/* Footer Status Bar */}
        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-color)] mt-2">
          <div className="flex items-center gap-4">
            <span>Sync Service v2.0</span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              {isSyncing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />{" "}
                  Syncing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> Ready
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>{totalEntities} total entities</span>
            <span>•</span>
            <span>{pendingSyncs} pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncPage;
