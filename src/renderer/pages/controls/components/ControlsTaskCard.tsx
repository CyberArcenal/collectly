// src/renderer/pages/controls/components/ControlsTaskCard.tsx
import React, { useState, useEffect } from "react";
import { RefreshCw, Play } from "lucide-react";
import Button from "../../../components/UI/Button";
import ControlsStatusBadge from "./ControlsStatusBadge";

interface ControlsTaskCardProps {
  title: string;
  description: string;
  onTrigger: () => Promise<void>;
  onFetchStatus: () => Promise<any>;
  loading: boolean;
  icon?: React.ReactNode;
}

const ControlsTaskCard: React.FC<ControlsTaskCardProps> = ({
  title,
  description,
  onTrigger,
  onFetchStatus,
  loading,
  icon,
}) => {
  const [status, setStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const data = await onFetchStatus();
      setStatus(data);
    } catch (err) {
      // handled by hook
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await onTrigger();
      await fetchStatus();
    } finally {
      setTriggering(false);
    }
  };

  const isEnabled = status?.enabled !== false;

  return (
    // ✅ Use flex column with justify-between para laging nasa baba ang button
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      {/* Content area - grows to fill space */}
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
          <ControlsStatusBadge status={isEnabled} label="Status" />
        </div>

        {status && (
          <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
            {status.lastRun && (
              <>
                <span>Last run:</span>
                <span className="font-mono truncate">
                  {status.lastRun.timestamp
                    ? new Date(status.lastRun.timestamp).toLocaleString()
                    : "Never"}
                </span>
              </>
            )}
            {status.schedule && (
              <>
                <span>Schedule:</span>
                <span className="truncate">{status.schedule}</span>
              </>
            )}
            {status.lastRun?.processed !== undefined && (
              <>
                <span>Processed:</span>
                <span>{status.lastRun.processed}</span>
              </>
            )}
            {status.lastRun?.errors !== undefined && status.lastRun.errors > 0 && (
              <>
                <span className="text-red-500">Errors:</span>
                <span className="text-red-500">{status.lastRun.errors}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ✅ Button section - always at the bottom */}
      <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[var(--border-color)]/50">
        <Button
          variant="primary"
          size="sm"
          icon={Play}
          onClick={handleTrigger}
          disabled={loading || triggering || !isEnabled}
          className="flex items-center gap-1.5 flex-shrink-0"
        >
          {triggering ? "Triggering..." : "Trigger Now"}
        </Button>
        <button
          onClick={fetchStatus}
          disabled={statusLoading}
          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${statusLoading ? "animate-spin" : ""}`} />
        </button>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {statusLoading ? "Updating..." : "Auto-refresh"}
        </span>
      </div>
    </div>
  );
};

export default ControlsTaskCard;