// src/renderer/pages/loans/active/components/BulkActionsBar.tsx
import React from "react";
import { X, Trash2 } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDelete,
  onClearSelection,
}) => {
  return (
    <div className="bg-[var(--primary-color)] bg-opacity-10 rounded-xl border border-[var(--primary-color)] border-opacity-20 px-4 py-2.5 flex items-center justify-between">
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
          onClick={onDelete}
          className="compact-button btn-danger btn-sm flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

export default BulkActionsBar;