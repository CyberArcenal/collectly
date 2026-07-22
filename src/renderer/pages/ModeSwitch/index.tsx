// src/renderer/pages/ModeSwitch/index.tsx
import React, { useState } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import systemConfigAPI from "../../api/utils/system_config";
import { dialogs } from "../../utils/dialogs";
import handshakeAPI from "../../api/utils/handshake";
import { ServerModal } from "../Settings/components/ServerModal";
import {
  Wifi,
  WifiOff,
  Server,
  Globe,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";

const ModeSwitchPage: React.FC = () => {
  const { getSetting, refreshSettings } = useSettings();
  const [showServerModal, setShowServerModal] = useState(false);
  const [tempServerUrl, setTempServerUrl] = useState(
    getSetting("general", "server_url", ""),
  );
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentMode = getSetting("general", "sync_mode", "offline");
  const serverUrl = getSetting("general", "server_url", "");
  const isOnline = currentMode === "online";

  const handleSyncModeChange = async (mode: "offline" | "online") => {
    setLoading(true);
    try {
      if (mode === "offline") {
        await systemConfigAPI.setValueByKey("sync_mode", "offline", {
          setting_type: "general",
          description: "Sync mode: offline/online",
          isPublic: false,
        });
        await systemConfigAPI.setValueByKey("server_url", "", {
          setting_type: "general",
          description: "Server URL for online sync",
          isPublic: false,
        });
        await refreshSettings();
        dialogs.success(
          "Offline mode activated",
          "You are now working offline.",
        );
        window.location.reload();
      } else {
        setTempServerUrl(serverUrl || "");
        setShowServerModal(true);
      }
    } catch (error: any) {
      dialogs.error("Failed to switch mode", error.message);
    } finally {
      setLoading(false);
    }
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
        await systemConfigAPI.setValueByKey("sync_mode", "online", {
          setting_type: "general",
          description: "Sync mode: offline/online",
          isPublic: false,
        });
        await systemConfigAPI.setValueByKey("server_url", tempServerUrl, {
          setting_type: "general",
          description: "Server URL for online sync",
          isPublic: false,
        });
        await refreshSettings();
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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--background-color)" }}
    >
      <div className="w-full max-w-3xl">
        {/* Header with glow effect */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center p-3 rounded-2xl mb-4"
            style={{ backgroundColor: "var(--primary-color)/10" }}
          >
            <Globe
              className="w-8 h-8"
              style={{ color: "var(--primary-color)" }}
            />
          </div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Connection Mode
          </h1>
          <p
            className="text-sm mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Choose how your system connects to the server
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
              isOnline
                ? "border-[var(--success-color)] bg-[var(--status-success-bg)]"
                : "border-[var(--warning-color)] bg-[var(--status-overdue-bg)]"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi
                  className="w-4 h-4"
                  style={{ color: "var(--success-color)" }}
                />
                <span style={{ color: "var(--success-color)" }}>● Online</span>
              </>
            ) : (
              <>
                <WifiOff
                  className="w-4 h-4"
                  style={{ color: "var(--warning-color)" }}
                />
                <span style={{ color: "var(--warning-color)" }}>● Offline</span>
              </>
            )}
            {isOnline && serverUrl && (
              <span
                className="text-xs ml-2 px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "var(--card-secondary-bg)",
                  color: "var(--text-tertiary)",
                }}
              >
                {serverUrl}
              </span>
            )}
          </div>
        </div>

        {/* Main Card */}
        <div
          className="rounded-2xl border shadow-xl overflow-hidden"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
          }}
        >
          {/* Card Header with gradient accent */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--card-secondary-bg)",
            }}
          >
            <div className="flex items-center gap-2">
              <Shield
                className="w-5 h-5"
                style={{ color: "var(--primary-color)" }}
              />
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Sync Configuration
              </span>
            </div>
            {loading && (
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                Saving...
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Offline Mode Card */}
              <label
                className={`relative flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                  !isOnline
                    ? "border-[var(--primary-color)] shadow-md"
                    : "border-[var(--border-color)] hover:border-[var(--primary-color)]/50"
                }`}
                style={{
                  backgroundColor: !isOnline
                    ? "var(--primary-color)/5"
                    : "var(--card-bg)",
                }}
              >
                <input
                  type="radio"
                  name="sync_mode"
                  value="offline"
                  checked={!isOnline}
                  onChange={async () => {
                    if (
                      await dialogs.confirm({
                        title: "Offline",
                        message:
                          "Are you sure do you want to switch on offline mode?",
                      })
                    ) {
                      handleSyncModeChange("offline");
                    }
                  }}
                  disabled={loading}
                  className="absolute top-3 right-3 w-4 h-4 accent-[var(--primary-color)]"
                />
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: "var(--primary-color)/10" }}
                >
                  <WifiOff
                    className="w-7 h-7"
                    style={{ color: "var(--warning-color)" }}
                  />
                </div>
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Offline Mode
                </h3>
                <p
                  className="text-xs text-center mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Work locally without server connection
                </p>
                {!isOnline && (
                  <span
                    className="mt-3 text-xs font-medium px-3 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "var(--primary-color)/10",
                      color: "var(--primary-color)",
                    }}
                  >
                    ● Active
                  </span>
                )}
              </label>

              {/* Online Mode Card */}
              <label
                className={`relative flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                  isOnline
                    ? "border-[var(--primary-color)] shadow-md"
                    : "border-[var(--border-color)] hover:border-[var(--primary-color)]/50"
                }`}
                style={{
                  backgroundColor: isOnline
                    ? "var(--primary-color)/5"
                    : "var(--card-bg)",
                }}
              >
                <input
                  type="radio"
                  name="sync_mode"
                  value="online"
                  checked={isOnline}
                      onChange={async () => {
                    if (
                      await dialogs.confirm({
                        title: "Online",
                        message:
                          "Are you sure do you want to switch on online mode?",
                      })
                    ) {
                      handleSyncModeChange("online");
                    }
                  }}
                  disabled={loading}
                  className="absolute top-3 right-3 w-4 h-4 accent-[var(--primary-color)]"
                />
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: "var(--primary-color)/10" }}
                >
                  <Wifi
                    className="w-7 h-7"
                    style={{ color: "var(--success-color)" }}
                  />
                </div>
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Online Mode
                </h3>
                <p
                  className="text-xs text-center mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Connect to server for full features
                </p>
                {isOnline && (
                  <span
                    className="mt-3 text-xs font-medium px-3 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "var(--success-color)/10",
                      color: "var(--success-color)",
                    }}
                  >
                    ● Active
                  </span>
                )}
              </label>
            </div>

            {/* Server Info - only show when online */}
            {isOnline && serverUrl && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{
                  backgroundColor: "var(--card-secondary-bg)",
                  borderColor: "var(--border-color)",
                }}
              >
                <Server
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "var(--text-secondary)" }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Connected Server
                  </p>
                  <p
                    className="text-sm font-mono truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {serverUrl}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--success-color)" }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Connected</span>
                </div>
              </div>
            )}

            {/* Offline info - show when offline */}
            {!isOnline && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl border"
                style={{
                  backgroundColor: "var(--card-secondary-bg)",
                  borderColor: "var(--border-color)",
                }}
              >
                <AlertCircle
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <p
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Offline Mode Active
                  </p>
                  <p className="text-xs mt-0.5">
                    All data is stored locally. Switch to online mode to connect
                    to the server.
                  </p>
                </div>
              </div>
            )}

            {/* Server Modal */}
            <ServerModal
              isOpen={showServerModal}
              onClose={() => setShowServerModal(false)}
              serverUrl={tempServerUrl}
              onServerUrlChange={setTempServerUrl}
              onConnect={connectServer}
              connecting={connecting}
              onUpdate={() => {}}
              currentServerUrl={serverUrl}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {isOnline
              ? "🟢 Connected to server · All features available"
              : "🔴 Offline mode · Data stored locally"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModeSwitchPage;
