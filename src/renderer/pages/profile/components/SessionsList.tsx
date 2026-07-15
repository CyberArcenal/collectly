// src/renderer/pages/profile/components/SessionsList.tsx
import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, Laptop, Tablet, X, CheckCircle, Clock } from "lucide-react";
import authAPI from "../../../api/core/auth";
import type { LoginSession } from "../../../api/core/auth";
import { showSuccess, showError } from "../../../utils/notification";
import { dialogs } from "../../../utils/dialogs";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

const getDeviceIcon = (deviceName: string) => {
  const name = deviceName.toLowerCase();
  if (name.includes("phone") || name.includes("mobile")) return <Smartphone className="w-4 h-4" />;
  if (name.includes("tablet") || name.includes("ipad")) return <Tablet className="w-4 h-4" />;
  if (name.includes("laptop") || name.includes("notebook")) return <Laptop className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
};

const SessionsList: React.FC = () => {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getSessions();
      if (response.status) {
        setSessions(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      showError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    const confirmed = await dialogs.confirm({
      title: "Terminate Session",
      message: "Are you sure you want to terminate this session?",
      confirmText: "Terminate",
      icon: "warning",
    });
    if (!confirmed) return;

    setTerminating(sessionId);
    try {
      await authAPI.terminateSession(sessionId);
      showSuccess("Session terminated");
      await fetchSessions();
    } catch (err: any) {
      showError("Failed to terminate session", err.message);
    } finally {
      setTerminating(null);
    }
  };

  const terminateAll = async () => {
    const confirmed = await dialogs.confirm({
      title: "Terminate All Sessions",
      message: "This will log out all devices except this one. Continue?",
      confirmText: "Terminate All",
      icon: "warning",
    });
    if (!confirmed) return;

    try {
      await authAPI.terminateAllSessions();
      showSuccess("All other sessions terminated");
      await fetchSessions();
    } catch (err: any) {
      showError("Failed to terminate sessions", err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><LoadingSpinner size="small" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Monitor className="w-4 h-4 text-[var(--primary-color)]" />
          Active Sessions
        </h3>
        {sessions.length > 1 && (
          <button
            onClick={terminateAll}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors text-[var(--danger-color)] hover:bg-[var(--status-overdue-bg)]"
          >
            Terminate All Others
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)]">No active sessions.</div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const isCurrent = session.is_active;
            return (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isCurrent ? "border-[var(--primary-color)] bg-[var(--primary-color)]/5" : "border-[var(--border-color)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.device_name)}
                  <div>
                    <p className="font-medium text-[var(--text-primary)] text-sm">
                      {session.device_name}
                      {isCurrent && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-[var(--success-color)]">
                          <CheckCircle className="w-3 h-3" />
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {session.ip_address} • Last used {new Date(session.last_used).toLocaleString()}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Created {new Date(session.created_at).toLocaleString()}
                      {session.expires_at && (
                        <span className="ml-2">Expires {new Date(session.expires_at).toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => terminateSession(session.id)}
                    disabled={terminating === session.id}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)] hover:text-[var(--danger-color)] transition-colors disabled:opacity-50"
                  >
                    {terminating === session.id ? (
                      <span className="animate-spin h-4 w-4 border-2 border-[var(--danger-color)] border-t-transparent rounded-full" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionsList;