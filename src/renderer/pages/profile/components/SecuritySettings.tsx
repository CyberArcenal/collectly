// src/renderer/pages/profile/components/SecuritySettings.tsx
import React, { useState, useEffect } from "react";
import { Shield, Mail, Phone, AlertCircle, CheckCircle, X } from "lucide-react";
import authAPI from "../../../api/core/auth";
import { showSuccess, showError } from "../../../utils/notification";
import { dialogs } from "../../../utils/dialogs";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

const SecuritySettings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    onConfirm: (value: string) => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    value: "",
    onConfirm: async () => {},
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await authAPI.getSecuritySettings();
        if (response.status) {
          setSettings(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch security settings:", err);
        showError("Failed to load security settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const toggle2FA = async () => {
    const current = settings?.two_factor_enabled;
    const action = current ? "disable" : "enable";
    const confirmed = await dialogs.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} 2FA`,
      message: `Are you sure you want to ${action} two-factor authentication?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      icon: "info",
    });
    if (!confirmed) return;

    setSubmitting(true);
    try {
      if (current) {
        await authAPI.disable2FA();
        showSuccess("2FA disabled");
      } else {
        await authAPI.enable2FA();
        showSuccess("2FA enabled");
      }
      // Refresh settings
      const response = await authAPI.getSecuritySettings();
      if (response.status) setSettings(response.data);
    } catch (err: any) {
      showError("Failed to toggle 2FA", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateBooleanSetting = async (key: string, value: boolean) => {
    try {
      await authAPI.updateSecuritySettings({ [key]: value });
      const response = await authAPI.getSecuritySettings();
      if (response.status) setSettings(response.data);
      showSuccess("Setting updated");
    } catch (err: any) {
      showError("Update failed", err.message);
    }
  };

  const updateRecoveryEmail = async (email: string) => {
    try {
      await authAPI.updateSecuritySettings({ recovery_email: email || null });
      const response = await authAPI.getSecuritySettings();
      if (response.status) setSettings(response.data);
      showSuccess("Recovery email updated");
    } catch (err: any) {
      showError("Update failed", err.message);
    }
  };

  const openPromptModal = (title: string, currentValue: string, onConfirm: (value: string) => Promise<void>) => {
    setPromptModal({
      isOpen: true,
      title,
      value: currentValue,
      onConfirm,
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8"><LoadingSpinner size="small" /></div>;
  }

  if (!settings) {
    return <div className="text-center py-8 text-[var(--text-tertiary)]">No security settings available.</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <Shield className="w-4 h-4 text-[var(--primary-color)]" />
        Security Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 2FA Toggle */}
        <div className="p-3 rounded-lg border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Two-Factor Authentication</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {settings.two_factor_enabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <button
            onClick={toggle2FA}
            disabled={submitting}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              settings.two_factor_enabled
                ? "bg-[var(--status-overdue-bg)] text-[var(--status-overdue-text)] hover:bg-[var(--status-overdue-bg)]/70"
                : "bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:bg-[var(--status-success-bg)]/70"
            }`}
          >
            {submitting ? "Updating..." : settings.two_factor_enabled ? "Disable" : "Enable"}
          </button>
        </div>

        {/* Recovery Email */}
        <div className="p-3 rounded-lg border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Recovery Email</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {settings.recovery_email || "Not set"}
            </p>
          </div>
          <button
            onClick={() =>
              openPromptModal(
                "Recovery Email",
                settings.recovery_email || "",
                updateRecoveryEmail
              )
            }
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors bg-[var(--card-secondary-bg)] hover:bg-[var(--card-hover-bg)] text-[var(--text-secondary)]"
          >
            {settings.recovery_email ? "Change" : "Add"}
          </button>
        </div>

        {/* Alert Settings */}
        <div className="p-3 rounded-lg border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Alert on New Device</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {settings.alert_on_new_device ? "Enabled" : "Disabled"}
            </p>
          </div>
          <button
            onClick={() => updateBooleanSetting("alert_on_new_device", !settings.alert_on_new_device)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              settings.alert_on_new_device
                ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:bg-[var(--status-success-bg)]/70"
                : "bg-[var(--status-inactive-bg)] text-[var(--status-inactive-text)] hover:bg-[var(--status-inactive-bg)]/70"
            }`}
          >
            {settings.alert_on_new_device ? "On" : "Off"}
          </button>
        </div>

        <div className="p-3 rounded-lg border border-[var(--border-color)] flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Alert on Failed Login</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {settings.alert_on_failed_login ? "Enabled" : "Disabled"}
            </p>
          </div>
          <button
            onClick={() => updateBooleanSetting("alert_on_failed_login", !settings.alert_on_failed_login)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              settings.alert_on_failed_login
                ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:bg-[var(--status-success-bg)]/70"
                : "bg-[var(--status-inactive-bg)] text-[var(--status-inactive-text)] hover:bg-[var(--status-inactive-bg)]/70"
            }`}
          >
            {settings.alert_on_failed_login ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div className="text-xs text-[var(--text-tertiary)] mt-2 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" />
        Manage your security preferences and alerts.
      </div>

      {/* Prompt Modal */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl w-full max-w-md shadow-xl border"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {promptModal.title}
              </h3>
              <button
                onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Enter value
                </label>
                <input
                  type="text"
                  value={promptModal.value}
                  onChange={(e) =>
                    setPromptModal({ ...promptModal, value: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      promptModal.onConfirm(promptModal.value);
                      setPromptModal({ ...promptModal, isOpen: false });
                    }
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setPromptModal({ ...promptModal, isOpen: false })}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: "var(--btn-secondary-bg)",
                  color: "var(--btn-secondary-text)",
                  border: "1px solid var(--btn-secondary-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  promptModal.onConfirm(promptModal.value);
                  setPromptModal({ ...promptModal, isOpen: false });
                }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--primary-color)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-color)";
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;