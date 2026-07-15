// src/renderer/pages/Settings/components/AuditSecurityTab.tsx
import React from "react";
import type { AuditSecuritySettings } from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";

interface Props {
  settings: AuditSecuritySettings;
  onUpdate: (field: keyof AuditSecuritySettings, value: any) => void;
}

const AuditSecurityTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  const getLogEventsDisplay = (): string => {
    const logEvents = settings.log_events;
    if (Array.isArray(logEvents)) return logEvents.join(", ");
    if (typeof logEvents === "string") {
      try { const parsed = JSON.parse(logEvents); if (Array.isArray(parsed)) return parsed.join(", "); } catch {}
      return logEvents;
    }
    return "login, logout, create, update, delete";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Audit & Security Settings</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Audit logging, encryption, and compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Log Retention (days)</label>
          <input type="number" value={settings.log_retention_days ?? 30} onChange={(e) => onUpdate("log_retention_days", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} min="0" />
        </div>
        <div className="md:col-span-1">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Log Events</label>
          <input type="text" value={getLogEventsDisplay()} onChange={(e) => { const events = e.target.value.split(",").map((ev) => ev.trim()).filter(Boolean); onUpdate("log_events", events); }} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="login, logout, create, update, delete" />
        </div>
      </div>

      <div className="border-t pt-5 space-y-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enable Audit Log</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Track all system activities</p>
          </div>
          <Switch checked={settings.audit_log_enabled || false} onChange={(checked) => onUpdate("audit_log_enabled", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Force HTTPS</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Require secure connections</p>
          </div>
          <Switch checked={settings.force_https || false} onChange={(checked) => onUpdate("force_https", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Session Encryption</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Encrypt user sessions</p>
          </div>
          <Switch checked={settings.session_encryption_enabled || false} onChange={(checked) => onUpdate("session_encryption_enabled", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>GDPR Compliance</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Enable GDPR data handling</p>
          </div>
          <Switch checked={settings.gdpr_compliance_enabled || false} onChange={(checked) => onUpdate("gdpr_compliance_enabled", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Require MFA for Admin</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Admin accounts require 2FA</p>
          </div>
          <Switch checked={settings.require_mfa_for_admin || false} onChange={(checked) => onUpdate("require_mfa_for_admin", checked)} />
        </div>
      </div>
    </div>
  );
};

export default AuditSecurityTab;