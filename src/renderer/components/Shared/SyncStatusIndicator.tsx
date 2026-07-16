// src/components/Shared/SyncStatusIndicator.tsx
import React, { useState, useEffect } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import { useSyncContext } from "../../contexts/SyncContext";
import { Loader2, Wifi, WifiOff, Cloud, CloudOff, AlertTriangle } from "lucide-react";

type SyncMode = "offline" | "online" | "offline_first";

const SyncStatusIndicator: React.FC = () => {
  const { settings } = useSettings();
  const { syncing, progress, isOnline: serverOnline, error } = useSyncContext();
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);

  // Read sync_mode from context's flat settings
  const rawMode = settings.flat?.["general.sync_mode"] as SyncMode;
  const syncMode: SyncMode =
    rawMode === "online" || rawMode === "offline" || rawMode === "offline_first"
      ? rawMode
      : "offline_first";

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Determine if we're actually online (browser + server)
  const isActuallyOnline = browserOnline && serverOnline;

  // ─── Status Configurations ───
  const getStatusConfig = () => {
    // 🟡 SYNCING
    if (syncing) {
      const percentage = progress?.total
        ? Math.round((progress.completed / progress.total) * 100)
        : 0;
      return {
        label: `Syncing ${percentage}%`,
        color: "bg-yellow-500",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        tooltip: `Syncing: ${progress?.completed || 0}/${progress?.total || 0} records`,
        isActive: true,
      };
    }

    // 🔴 ERROR
    if (error) {
      return {
        label: "Sync Error",
        color: "bg-red-500",
        icon: <AlertTriangle className="w-3 h-3" />,
        tooltip: `Sync error: ${error}`,
        isActive: false,
      };
    }

    // 🟢 ONLINE MODE
    if (syncMode === "online") {
      if (isActuallyOnline) {
        return {
          label: "Online",
          color: "bg-green-500",
          icon: <Wifi className="w-3 h-3" />,
          tooltip: "Data is synced with server. All changes are sent immediately.",
          isActive: true,
        };
      }
      return {
        label: "Offline (No Server)",
        color: "bg-red-500",
        icon: <WifiOff className="w-3 h-3" />,
        tooltip: "Cannot reach the server. Check your network.",
        isActive: false,
      };
    }

    // 🔵 OFFLINE-FIRST MODE
    if (syncMode === "offline_first") {
      if (isActuallyOnline) {
        return {
          label: "Online (Cached)",
          color: "bg-blue-500",
          icon: <Cloud className="w-3 h-3" />,
          tooltip: "Data is stored locally and synced when possible.",
          isActive: true,
        };
      }
      return {
        label: "Offline (Cached)",
        color: "bg-yellow-500",
        icon: <CloudOff className="w-3 h-3" />,
        tooltip: "Working offline. Data will sync when connection is restored.",
        isActive: false,
      };
    }

    // ⚪ OFFLINE MODE
    return {
      label: "Offline Mode",
      color: "bg-gray-500",
      icon: <CloudOff className="w-3 h-3" />,
      tooltip: "Data is stored locally only. No server sync is active.",
      isActive: false,
    };
  };

  const status = getStatusConfig();

  return (
    <div className="relative group">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)] transition-all ${
          status.isActive ? "hover:border-[var(--primary-color)]" : ""
        }`}
      >
        {/* Icon */}
        <span className="text-[var(--text-secondary)]">{status.icon}</span>

        {/* Status Dot */}
        <div
          className={`w-2 h-2 rounded-full ${status.color} ${
            status.isActive ? "animate-pulse" : ""
          }`}
        />

        {/* Label */}
        <span className="text-xs font-medium text-[var(--text-primary)] whitespace-nowrap">
          {status.label}
        </span>
      </div>

      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg p-2.5 w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <div>
            <strong>Mode:</strong>{" "}
            {syncMode === "online"
              ? "Online"
              : syncMode === "offline_first"
              ? "Offline-First"
              : "Offline"}
          </div>
          <div className="text-[var(--text-tertiary)]">{status.tooltip}</div>
          {syncing && progress && (
            <div className="mt-1 pt-1 border-t border-[var(--border-color)]">
              <div className="flex justify-between text-[var(--text-tertiary)]">
                <span>Progress</span>
                <span>
                  {progress.completed}/{progress.total}
                </span>
              </div>
              <div className="mt-0.5 h-1 bg-[var(--card-secondary-bg)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
          {error && (
            <div className="mt-1 pt-1 border-t border-[var(--border-color)] text-red-500">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;