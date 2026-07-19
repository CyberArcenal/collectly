// src/renderer/pages/Settings/index.tsx
import React from "react";
import { useSettings } from "../../contexts/SettingsContext";
import OfflineSettingsPage from "./OfflineSettings";
import OnlineSettings from "./OnlineSettings";

const SettingsPage: React.FC = () => {
  const { isOnlineMode, settings } = useSettings();

  if (settings.loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background-color)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin rounded-full h-10 w-10 border-b-2"
            style={{ borderColor: "var(--primary-color)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (isOnlineMode()) {
    return <OnlineSettings />;
  }

  return <OfflineSettingsPage />;
};

export default SettingsPage;