// src/components/Shared/SyncStatusIndicator.tsx
import React, { useState, useEffect } from "react";
import { useSettings } from "../../contexts/SettingsContext";

type SyncMode = "offline" | "online" | "offline_first";

const SyncStatusIndicator: React.FC = () => {
  const { settings } = useSettings();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Read sync_mode from context's flat settings (default to 'offline_first')
  const rawMode = settings.flat?.["general.sync_mode"] as SyncMode;
  const syncMode: SyncMode =
    rawMode === "online" || rawMode === "offline" || rawMode === "offline_first"
      ? rawMode
      : "offline_first";

  // Listen to network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getStatus = () => {
    if (syncMode === "online") {
      return {
        label: isOnline ? "Online" : "Offline (No Internet)",
        color: isOnline ? "bg-green-500" : "bg-red-500",
        tooltip: isOnline
          ? "Data is synced with server. All changes are sent immediately."
          : "Cannot reach the server. Check your network.",
      };
    } else if (syncMode === "offline_first") {
      return {
        label: isOnline ? "Online (Cached)" : "Offline (Cached)",
        color: isOnline ? "bg-blue-500" : "bg-yellow-500",
        tooltip: isOnline
          ? "Data is stored locally and synced when possible."
          : "Working offline. Data will sync when connection is restored.",
      };
    } else {
      // offline mode
      return {
        label: "Offline Mode",
        color: "bg-gray-500",
        tooltip: "Data is stored locally only. No server sync is active.",
      };
    }
  };

  const status = getStatus();

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]">
        <div
          className={`w-2 h-2 rounded-full ${status.color} ${
            (syncMode === "online" || syncMode === "offline_first") && isOnline
              ? "animate-pulse"
              : ""
          }`}
        />
        <span className="text-xs text-[var(--text-primary)]">
          {status.label}
        </span>
      </div>
      <div className="absolute top-full right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg p-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="text-xs text-[var(--text-secondary)]">
          <strong>Sync Mode:</strong>{" "}
          {syncMode === "online"
            ? "Online"
            : syncMode === "offline_first"
            ? "Offline-First"
            : "Offline"}
          <br />
          {status.tooltip}
        </div>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;