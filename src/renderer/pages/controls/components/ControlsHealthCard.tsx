// src/renderer/pages/controls/components/ControlsHealthCard.tsx
import React, { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface ControlsHealthCardProps {
  title: string;
  description: string;
  onFetchHealth: () => Promise<any>;
  loading: boolean;
  icon?: React.ReactNode;
}

const ControlsHealthCard: React.FC<ControlsHealthCardProps> = ({
  title,
  description,
  onFetchHealth,
  loading,
  icon,
}) => {
  const [health, setHealth] = useState<any>(null);
  const [fetching, setFetching] = useState(false);

  const fetchHealth = async () => {
    setFetching(true);
    try {
      const data = await onFetchHealth();
      setHealth(data);
    } catch (err) {
      // handled by hook
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const hasIssues = health?.issuesFound > 0;

  return (
    // ✅ Use flex column with justify-between
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Content area */}
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            {icon && <div className="text-[var(--primary-color)] mt-1 flex-shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                {description}
              </p>
            </div>
          </div>
          {health && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {hasIssues ? (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  hasIssues ? "text-yellow-500" : "text-green-500"
                }`}
              >
                {hasIssues ? `${health.issuesFound} issues` : "Healthy"}
              </span>
            </div>
          )}
        </div>

        {health && hasIssues && (
          <div className="mt-3 max-h-32 overflow-y-auto text-xs">
            <ul className="space-y-1">
              {health.issues.slice(0, 5).map((issue: any, idx: number) => (
                <li key={idx} className="text-red-500 border-b border-[var(--border-color)] pb-1 truncate">
                  {issue.message}
                </li>
              ))}
              {health.issues.length > 5 && (
                <li className="text-[var(--text-tertiary)]">
                  +{health.issues.length - 5} more issues
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* ✅ Button section - always at the bottom */}
      <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[var(--border-color)]/50">
        <button
          onClick={fetchHealth}
          disabled={fetching}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${fetching ? "animate-spin" : ""}`} />
          Refresh health check
        </button>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {fetching ? "Checking..." : "Auto-refresh"}
        </span>
      </div>
    </div>
  );
};

export default ControlsHealthCard;