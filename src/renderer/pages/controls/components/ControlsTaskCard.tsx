// src/renderer/pages/controls/components/ControlsTaskCard.tsx
import React, { useState, useEffect } from "react";
import { RefreshCw, Play, Clock, CheckCircle, XCircle } from "lucide-react";
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
    // Refresh every 30 seconds
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
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {icon && <div className="text-[var(--primary-color)] mt-1">{icon}</div>}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {description}
            </p>
          </div>
        </div>
        <ControlsStatusBadge status={isEnabled} label="Status" />
      </div>

      {status && (
        <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-[var(--text-secondary)]">
          {status.lastRun && (
            <>
              <span>Last run:</span>
              <span className="font-mono">
                {status.lastRun.timestamp
                  ? new Date(status.lastRun.timestamp).toLocaleString()
                  : "Never"}
              </span>
            </>
          )}
          {status.schedule && (
            <>
              <span>Schedule:</span>
              <span>{status.schedule}</span>
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

      <div className="mt-4 flex gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={Play}
          onClick={handleTrigger}
          disabled={loading || triggering || !isEnabled}
          className="flex items-center gap-1.5"
        >
          {triggering ? "Triggering..." : "Trigger Now"}
        </Button>
        <button
          onClick={fetchStatus}
          disabled={statusLoading}
          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${statusLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
};

export default ControlsTaskCard;