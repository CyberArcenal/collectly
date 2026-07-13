// src/renderer/pages/debtors/credit-check/components/PreviousChecksLog.tsx
import React from "react";
import { History, Clock, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { formatDate } from "../../../../utils/formatters";
import type { CreditCheckLog } from "../../../../api/core/credit_check";

interface PreviousChecksLogProps {
  logs: CreditCheckLog[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const getRiskBadge = (risk: string) => {
  switch (risk) {
    case "Low": return "bg-green-500/20 text-green-500";
    case "Medium": return "bg-yellow-500/20 text-yellow-500";
    case "High": return "bg-red-500/20 text-red-500";
    default: return "bg-gray-500/20 text-gray-500";
  }
};

const getScoreColor = (score: number) => {
  if (score >= 700) return "text-green-500";
  if (score >= 500) return "text-yellow-500";
  return "text-red-500";
};

const PreviousChecksLog: React.FC<PreviousChecksLogProps> = ({
  logs,
  loading,
  hasMore = false,
  onLoadMore,
}) => {
  if (loading && logs.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <div className="animate-spin h-4 w-4 border-2 border-[var(--primary-color)] border-t-transparent rounded-full" />
          Loading history...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--primary-color)]" />
          Previous Checks
          <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">
            ({logs.length})
          </span>
        </h3>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-4 text-sm text-[var(--text-tertiary)]">
          No previous credit checks found.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--text-primary)] text-sm truncate">
                    {log.debtorName}
                  </div>
                  <div className="text-xs flex items-center gap-1 mt-0.5 text-[var(--text-tertiary)]">
                    <Clock className="w-3 h-3" />
                    {formatDate(log.dateChecked || log.createdAt)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className={`text-sm font-bold ${getScoreColor(log.score)}`}>
                    {log.score}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRiskBadge(log.riskLevel)}`}>
                    {log.riskLevel}
                  </span>
                </div>
              </div>
              {log.remarks && (
                <div className="mt-1 text-xs text-[var(--text-tertiary)] truncate">
                  {log.remarks}
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="w-full mt-2 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue-light)] rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Load more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviousChecksLog;