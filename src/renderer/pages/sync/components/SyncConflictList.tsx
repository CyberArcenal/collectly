// src/renderer/pages/sync/components/SyncConflictList.tsx
import React, { useState } from "react";
import { Eye, CheckCircle, AlertTriangle } from "lucide-react";
import type { Conflict } from "../../../api/utils/sync";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

interface SyncConflictListProps {
  conflicts: Conflict[];
  loading: boolean;
  onResolve: (id: number, resolution: string) => void;
}

const formatDate = (date: string): string => {
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "Invalid date";
  }
};

const SyncConflictList: React.FC<SyncConflictListProps> = ({ conflicts, loading, onResolve }) => {
  const [showDetails, setShowDetails] = useState<Record<number, boolean>>({});

  const toggleDetails = (id: number) => {
    setShowDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <LoadingSpinner size="small" />
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--text-tertiary)] text-sm">
        <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-500" />
        No conflicts detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conflicts.map((conflict) => (
        <div key={conflict.id} className="border border-[var(--border-color)] rounded-lg p-3 hover:bg-[var(--card-hover-bg)] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-[10px] font-medium">
                {conflict.entity.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {conflict.entity} #{conflict.entityId}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {formatDate(conflict.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">Pending</span>
              <button
                onClick={() => toggleDetails(conflict.id)}
                className="p-1 rounded hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)]"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onResolve(conflict.id, "server")}
                className="px-2 py-0.5 rounded text-xs bg-[var(--primary-color)] text-white hover:opacity-80"
              >
                Use Server
              </button>
              <button
                onClick={() => onResolve(conflict.id, "local")}
                className="px-2 py-0.5 rounded text-xs bg-[var(--accent-blue)] text-white hover:opacity-80"
              >
                Use Local
              </button>
            </div>
          </div>
          {showDetails[conflict.id] && (
            <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                  <div className="font-medium text-green-500 mb-1">Local Data</div>
                  <pre className="text-[var(--text-secondary)] whitespace-pre-wrap break-all max-h-32 overflow-auto">
                    {JSON.stringify(conflict.localData, null, 2)}
                  </pre>
                </div>
                <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                  <div className="font-medium text-blue-500 mb-1">Server Data</div>
                  <pre className="text-[var(--text-secondary)] whitespace-pre-wrap break-all max-h-32 overflow-auto">
                    {JSON.stringify(conflict.serverData, null, 2)}
                  </pre>
                </div>
              </div>
              {conflict.notes && (
                <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Notes: {conflict.notes}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SyncConflictList;