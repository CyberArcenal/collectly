// src/renderer/pages/sync/components/SyncAdvancedActions.tsx
import React from "react";
import { Trash2, RotateCcw } from "lucide-react";
import Button from "../../../components/UI/Button";

interface SyncAdvancedActionsProps {
  onCleanup: () => void;
  onReset: () => void;
  syncing: boolean;
}

const SyncAdvancedActions: React.FC<SyncAdvancedActionsProps> = ({ onCleanup, onReset, syncing }) => {
  return (
    <div className="bg-[var(--card-secondary-bg)] rounded-xl border border-[var(--border-color)] p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={Trash2}
          onClick={onCleanup}
          disabled={syncing}
        >
          Cleanup (30d)
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={RotateCcw}
          onClick={onReset}
          disabled={syncing}
        >
          Reset Sync State
        </Button>
      </div>
      <div className="text-xs text-[var(--text-tertiary)]">
        <p>⚠️ Cleanup removes old sync records. Reset clears sync statuses for troubleshooting.</p>
      </div>
    </div>
  );
};

export default SyncAdvancedActions;