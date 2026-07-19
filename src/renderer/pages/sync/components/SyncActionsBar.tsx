// src/renderer/pages/sync/components/SyncActionsBar.tsx
import React from "react";
import { Play, RefreshCw, AlertTriangle, Settings, ChevronDown, ChevronRight } from "lucide-react";
import Button from "../../../components/UI/Button";

interface SyncActionsBarProps {
  onFullSync: () => void;
  onIncrementalSync: () => void;
  onAutoResolve: () => void;
  onToggleAdvanced: () => void;
  showAdvanced: boolean;
  syncing: boolean;
  loading: boolean;
  conflictsCount: number;
}

const SyncActionsBar: React.FC<SyncActionsBarProps> = ({
  onFullSync,
  onIncrementalSync,
  onAutoResolve,
  onToggleAdvanced,
  showAdvanced,
  syncing,
  loading,
  conflictsCount,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        size="sm"
        icon={Play}
        onClick={onFullSync}
        disabled={syncing || loading}
        className="flex items-center gap-1.5"
      >
        {syncing ? "Syncing..." : "Full Sync"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={RefreshCw}
        onClick={onIncrementalSync}
        disabled={syncing || loading}
      >
        Incremental Sync
      </Button>
      <Button
        variant="warning"
        size="sm"
        icon={AlertTriangle}
        onClick={onAutoResolve}
        disabled={conflictsCount === 0 || syncing}
      >
        Auto-Resolve ({conflictsCount})
      </Button>
      <button
        onClick={onToggleAdvanced}
        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        style={{
          backgroundColor: "var(--card-secondary-bg)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        <Settings className="w-4 h-4" />
        Advanced
        {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

export default SyncActionsBar;