// src/renderer/pages/loans/overdue/components/BulkActionsBar.tsx
import React from "react";
import { X, Bell, Download } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onSendReminders: () => void;
  onExport: () => void;
  onClearSelection: () => void;
  exporting?: boolean;
  sending?: boolean;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onSendReminders,
  onExport,
  onClearSelection,
  exporting = false,
  sending = false,
}) => {
  return (
    <div className="bg-[var(--danger-color)] bg-opacity-10 rounded-xl border border-[var(--danger-color)] border-opacity-20 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {selectedCount} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          disabled={exporting}
          className="compact-button btn-secondary btn-sm flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export"}
        </button>
        <button
          onClick={onSendReminders}
          disabled={sending}
          className="compact-button btn-primary btn-sm flex items-center gap-1"
        >
          <Bell className="w-4 h-4" />
          {sending ? "Sending..." : `Send Reminders (${selectedCount})`}
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;