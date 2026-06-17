// src/renderer/pages/Settings/components/GeneralTab.tsx
import React, { useState } from "react";
import type { GeneralSettings } from "../../../api/utils/system_config";
import { dialogs } from "../../../utils/dialogs";
import { useVersion } from "../../../hooks/useVersion";
import handshakeAPI from "../../../api/utils/handshake";
import Switch from "../../../components/UI/Switch";
import Button from "../../../components/UI/Button";

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">General Settings</h3>
        <p className="text-sm text-[var(--text-secondary)]">Basic system preferences and branding</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={settings.company_name || ""}
            onChange={(e) => onUpdate("company_name", e.target.value)}
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Branch Location
          </label>
          <input
            type="text"
            value={settings.branch_location || ""}
            onChange={(e) => onUpdate("branch_location", e.target.value)}
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Timezone
          </label>
          <select
            value={settings.default_timezone || "Asia/Manila"}
            onChange={(e) => onUpdate("default_timezone", e.target.value)}
            className="windows-input w-full"
          >
            <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Currency
          </label>
          <input
            type="text"
            value={settings.currency || "PHP"}
            onChange={(e) => onUpdate("currency", e.target.value)}
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Language
          </label>
          <select
            value={settings.language || "en"}
            onChange={(e) => onUpdate("language", e.target.value)}
            className="windows-input w-full"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="tl">Tagalog</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Auto Logout (minutes)
          </label>
          <input
            type="number"
            value={settings.auto_logout_minutes || 30}
            onChange={(e) =>
              onUpdate("auto_logout_minutes", parseInt(e.target.value, 10) || 0)
            }
            className="windows-input w-full"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Date Format
          </label>
          <input
            type="text"
            value={settings.date_format || "YYYY-MM-DD"}
            onChange={(e) => onUpdate("date_format", e.target.value)}
            className="windows-input w-full"
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Receipt Footer Message
          </label>
          <textarea
            value={settings.receipt_footer_message || ""}
            onChange={(e) => onUpdate("receipt_footer_message", e.target.value)}
            rows={2}
            className="windows-input w-full"
          />
        </div>
      </div>

      {/* Sync Mode */}
      <div className="border-t border-[var(--border-color)] pt-5">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">Sync Mode</h4>
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sync_mode"
              value="offline"
              checked={settings.sync_mode === ("offline" as any)}
              onChange={() => handleSyncModeChange("offline")}
              className="w-4 h-4 text-[var(--primary-color)] border-[var(--border-color)] focus:ring-[var(--primary-color)]"
            />
            <span className="text-sm text-[var(--text-primary)]">Offline Mode</span>
            <span className="text-xs text-[var(--text-tertiary)] ml-1">Work locally, no sync</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="sync_mode"
              value="online"
              checked={settings.sync_mode === ("online" as any)}
              onChange={() => handleSyncModeChange("online")}
              className="w-4 h-4 text-[var(--primary-color)] border-[var(--border-color)] focus:ring-[var(--primary-color)]"
            />
            <span className="text-sm text-[var(--text-primary)]">Online Mode</span>
            <span className="text-xs text-[var(--text-tertiary)] ml-1">Connect to server</span>
          </label>
        </div>
        {settings.sync_mode === ("online" as any) && settings.server_url && (
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            Connected to: <span className="font-mono">{settings.server_url}</span>
          </p>
        )}
      </div>

      {/* Modal for server URL */}
      {showServerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[var(--card-bg)] rounded-xl p-6 w-full max-w-md shadow-2xl border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Connect to Server</h3>
            <input
              type="url"
              value={tempServerUrl}
              onChange={(e) => setTempServerUrl(e.target.value)}
              placeholder="https://your-server.com/api"
              className="windows-input w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowServerModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={connectServer} loading={connecting}>
                Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralTab;