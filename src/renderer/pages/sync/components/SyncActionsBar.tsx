// src/renderer/pages/sync/components/SyncActionsBar.tsx

import React from "react";
import { Play, RefreshCw } from "lucide-react";
import Button from "../../../components/UI/Button";

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
    <div className="flex flex-wrap gap-2">
      <Button
        variant="primary"
        size="sm"
        icon={Play}
        onClick={onFullSync}
        disabled={isSyncing || isLoading}
        className="flex items-center gap-1.5"
      >
        {isSyncing ? "Syncing..." : "Full Sync"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={RefreshCw}
        onClick={onRefresh}
        disabled={isLoading}
      >
        Refresh
      </Button>
    </div>
  );
};

export default SyncActionsBar;