// src/renderer/pages/Settings/components/GeneralTab.tsx
import React, { useState } from "react";
import type { GeneralSettings } from "../../../api/utils/system_config";
import { dialogs } from "../../../utils/dialogs";
import { useVersion } from "../../../hooks/useVersion";
import handshakeAPI from "../../../api/utils/handshake";
import Switch from "../../../components/UI/Switch";
import Select from "../../../components/UI/Select";
import { ServerModal } from "./ServerModal";

const TIMEZONES = [
  { value: "Asia/Manila", label: "Asia/Manila (UTC+8)" },
  { value: "UTC", label: "UTC" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "tl", label: "Tagalog" },
];

interface Props {
  settings: GeneralSettings;
  onUpdate: (field: keyof GeneralSettings, value: any) => void;
}

const GeneralTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const { version: appVersion } = useVersion();
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempServerUrl, setTempServerUrl] = useState(settings.server_url || "");
  const [connecting, setConnecting] = useState(false);

  const handleSyncModeChange = (mode: "offline" | "online") => {
    if (mode === "offline") {
      onUpdate("sync_mode", "offline");
      onUpdate("server_url", "");
      return;
    }
    setTempServerUrl(settings.server_url || "");
    setShowServerModal(true);
  };

  const connectServer = async () => {
    if (!tempServerUrl.trim()) {
      dialogs.alert({
        title: "Server URL",
        message: "Please enter a valid server URL.",
      });
      return;
    }
    setConnecting(true);
    try {
      const handshake = await handshakeAPI.perform(tempServerUrl);
      if (handshake.status) {
        onUpdate("sync_mode", "online");
        onUpdate("server_url", tempServerUrl);
        dialogs.success("Connected to server", "Online mode activated.");
        setShowServerModal(false);
        window.location.reload();
      } else {
        dialogs.error(
          "Handshake failed",
          handshake.message || "Server rejected connection.",
        );
      }
    } catch (err: any) {
      dialogs.error("Connection error", err.message);
    } finally {
      setConnecting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>General Settings</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Basic system preferences and branding</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Company Name</label>
          <input
            type="text"
            value={settings.company_name || ""}
            onChange={(e) => onUpdate("company_name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Branch Location</label>
          <input
            type="text"
            value={settings.branch_location || ""}
            onChange={(e) => onUpdate("branch_location", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Timezone</label>
          <Select
            value={settings.default_timezone || "Asia/Manila"}
            onChange={(val) => onUpdate("default_timezone", val)}
            options={TIMEZONES}
            placeholder="Select timezone"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Currency</label>
          <input
            type="text"
            value={settings.currency || "PHP"}
            onChange={(e) => onUpdate("currency", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Language</label>
          <Select
            value={settings.language || "en"}
            onChange={(val) => onUpdate("language", val)}
            options={LANGUAGES}
            placeholder="Select language"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Auto Logout (minutes)</label>
          <input
            type="number"
            value={settings.auto_logout_minutes || 30}
            onChange={(e) => onUpdate("auto_logout_minutes", parseInt(e.target.value, 10) || 0)}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={inputStyle}
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Date Format</label>
          <input
            type="text"
            value={settings.date_format || "YYYY-MM-DD"}
            onChange={(e) => onUpdate("date_format", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            style={inputStyle}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Receipt Footer Message</label>
          <textarea
            value={settings.receipt_footer_message || ""}
            onChange={(e) => onUpdate("receipt_footer_message", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Sync Mode */}
      <div className="border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
        <h4 className="text-md font-medium mb-3" style={{ color: "var(--text-primary)" }}>Sync Mode</h4>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="sync_mode"
              value="offline"
              checked={settings.sync_mode === ("offline" as any)}
              onChange={() => handleSyncModeChange("offline")}
              className="w-4 h-4 accent-[var(--primary-color)]"
            />
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Offline Mode</span>
            <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>Work locally, no sync</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="sync_mode"
              value="online"
              checked={settings.sync_mode === ("online" as any)}
              onChange={() => handleSyncModeChange("online")}
              className="w-4 h-4 accent-[var(--primary-color)]"
            />
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Online Mode</span>
            <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>Connect to server</span>
          </label>
        </div>
        {settings.sync_mode === ("online" as any) && settings.server_url && (
          <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "var(--status-success-bg)", border: "1px solid var(--success-color)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Connected to: <span className="font-mono" style={{ color: "var(--text-primary)" }}>{settings.server_url}</span>
            </p>
          </div>
        )}
      </div>

      {/* Server URL Modal */}
      <ServerModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
        serverUrl={tempServerUrl}
        onServerUrlChange={setTempServerUrl}
        onConnect={connectServer}
        connecting={connecting}
        onUpdate={onUpdate}
        currentServerUrl={settings.server_url || ""}
      />
    </div>
  );
};

export default GeneralTab;