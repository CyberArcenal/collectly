// src/renderer/pages/sync/components/SyncActionsBar.tsx
import React from "react";
import { Play, RefreshCw, Loader2, Download, X } from "lucide-react";
import Button from "../../../components/UI/Button";

interface SyncActionsBarProps {
  onFullSync: () => void;
  onRefresh: () => void;
  onPullSync: () => void;
  onCancel: () => void; // 🆕
  isSyncing: boolean;
  isLoading: boolean;
}

const SyncActionsBar: React.FC<SyncActionsBarProps> = ({
  onFullSync,
  onRefresh,
  onPullSync,
  onCancel,
  isSyncing,
  isLoading,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-[var(--card-secondary-bg)]/50 rounded-xl border border-[var(--border-color)]">
      {/* Full Sync Button */}
      <button
        onClick={onFullSync}
        disabled={isSyncing || isLoading}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02]"
      >
        {isSyncing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isSyncing ? "Syncing..." : "Full Sync"}
      </button>

      {/* 🆕 Cancel Button – only visible when syncing */}
      {isSyncing && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 text-sm font-medium rounded-lg border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
        >
          <X className="w-4 h-4" />
          Cancel Sync
        </button>
      )}

      {/* Pull from Server */}
      <Button
        variant="secondary"
        size="sm"
        icon={Download}
        onClick={onPullSync}
        disabled={isLoading || isSyncing}
      >
        Pull from Server
      </Button>

      {/* Refresh Status */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] text-[var(--text-secondary)] text-sm font-medium rounded-lg border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-all duration-200"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh Status
      </button>

      <div className="ml-auto text-xs text-[var(--text-tertiary)] hidden sm:block">
        {isSyncing ? "Sync in progress... Click Cancel to stop." : "Ready to sync"}
      </div>
    </div>
  );
};

export default SyncActionsBar;