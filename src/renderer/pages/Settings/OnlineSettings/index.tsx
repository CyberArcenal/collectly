// src/renderer/pages/Settings/OnlineSettings/index.tsx
import React, { useState } from "react";
import type { SettingType } from "../../../api/utils/system_config";
import { useOnlineSettings } from "./hooks/useOnlineSettings";
import AuditSecurityTab from "../components/AuditSecurityTab";
import CollectionsTab from "../components/CollectionsTab";
import GeneralTab from "../components/GeneralTab";
import IntegrationsTab from "../components/IntegrationsTab";
import LoansTab from "../components/LoansTab";
import NotificationsTab from "../components/NotificationsTab";
import ReportsTab from "../components/ReportsTab";
import SettingsHeader from "../components/SettingsHeader";
import SettingsTabs from "../components/SettingsTabs";

const TAB_LABELS: Record<string, string> = {
  general: "General",
  collections: "Collections",
  loans: "Loans",
  notifications: "Notifications",
  reports: "Reports",
  integrations: "Integrations",
  audit_security: "Audit & Security",
};

const OnlineSettings: React.FC = () => {
  const {
    groupedConfig,
    loading,
    saving,
    error,
    successMessage,
    setError,
    setSuccessMessage,
    updateGeneral,
    updateCollections,
    updateLoans,
    updateNotifications,
    updateReports,
    updateIntegrations,
    updateAuditSecurity,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    testSmtpConnection,
    testSmsConnection,
  } = useOnlineSettings();

  const availableTabs = Object.keys(groupedConfig).filter(
    (key) => TAB_LABELS[key],
  );

  const [activeTab, setActiveTab] = useState<string>(
    availableTabs[0] || "general",
  );

  // Only show full-page spinner on initial load
  if (loading && !Object.keys(groupedConfig.general).length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background-color)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--primary-color)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading server settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--card-bg)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <SettingsHeader
          onSave={saveSettings}
          onReset={resetToDefaults}
          onExport={exportSettings}
          onImport={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              importSettings(file);
              e.target.value = "";
            }
          }}
          saving={saving}
        />

        {error && (
          <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--status-overdue-bg)", border: "1px solid var(--danger-color)" }}>
            <span className="text-sm" style={{ color: "var(--danger-color)" }}>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-sm underline" style={{ color: "var(--danger-color)" }}>Dismiss</button>
          </div>
        )}
        {successMessage && (
          <div className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--status-success-bg)", border: "1px solid var(--success-color)" }}>
            <span className="text-sm" style={{ color: "var(--success-color)" }}>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-auto text-sm underline" style={{ color: "var(--success-color)" }}>Dismiss</button>
          </div>
        )}

        <SettingsTabs activeTab={activeTab as SettingType} onTabChange={setActiveTab} />

        <div className="rounded-xl border shadow-sm p-6" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
          {activeTab === "general" && (
            <GeneralTab settings={groupedConfig.general} onUpdate={updateGeneral} />
          )}
          {activeTab === "collections" && (
            <CollectionsTab settings={groupedConfig.collections} onUpdate={updateCollections} />
          )}
          {activeTab === "loans" && (
            <LoansTab settings={groupedConfig.loans} onUpdate={updateLoans} />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              settings={groupedConfig.notifications}
              onUpdate={updateNotifications}
              onTestSmtp={testSmtpConnection}
              onTestSms={testSmsConnection}
            />
          )}
          {activeTab === "reports" && (
            <ReportsTab settings={groupedConfig.reports} onUpdate={updateReports} />
          )}
          {activeTab === "integrations" && (
            <IntegrationsTab settings={groupedConfig.integrations} onUpdate={updateIntegrations} />
          )}
          {activeTab === "audit_security" && (
            <AuditSecurityTab settings={groupedConfig.audit_security} onUpdate={updateAuditSecurity} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineSettings;