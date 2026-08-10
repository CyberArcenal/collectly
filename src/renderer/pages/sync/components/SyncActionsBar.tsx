// src/renderer/pages/sync/components/SyncActionsBar.tsx
import React from "react";
import { Play, RefreshCw, Loader2 } from "lucide-react";

interface SyncActionsBarProps {
  onFullSync: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  isLoading: boolean;
}

const SyncActionsBar: React.FC<SyncActionsBarProps> = ({
  onFullSync,
  onRefresh,
  isSyncing,
  isLoading,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-[var(--card-secondary-bg)]/50 rounded-xl border border-[var(--border-color)]">
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
      
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)] text-[var(--text-secondary)] text-sm font-medium rounded-lg border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-all duration-200"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh Status
      </button>

      <div className="ml-auto text-xs text-[var(--text-tertiary)] hidden sm:block">
        {isSyncing ? "Sync is running in the background..." : "Ready to sync"}
      </div>
    </div>
  );
};

export default SyncActionsBar;