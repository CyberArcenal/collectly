// src/renderer/pages/Settings/components/ReportsTab.tsx
import React from "react";
import type { ReportsSettings } from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";
import Select from "../../../components/UI/Select";

const EXPORT_FORMATS = [
  { value: "CSV", label: "CSV" },
  { value: "Excel", label: "Excel" },
  { value: "PDF", label: "PDF" },
];

interface Props {
  settings: ReportsSettings;
  onUpdate: (field: keyof ReportsSettings, value: any) => void;
}

const ReportsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  const getExportFormatsDisplay = (): string => {
    const formats = settings.export_formats;
    if (Array.isArray(formats)) return formats.join(", ");
    if (typeof formats === "string") {
      try { const parsed = JSON.parse(formats); if (Array.isArray(parsed)) return parsed.join(", "); } catch {}
      return formats;
    }
    return "CSV, Excel, PDF";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Reports Settings</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Export, backup, and retention preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Export Formats</label>
          <input type="text" value={getExportFormatsDisplay()} onChange={(e) => { const formats = e.target.value.split(",").map((f) => f.trim()).filter(Boolean); onUpdate("export_formats", formats); }} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="CSV, Excel, PDF" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Default Export Format</label>
          <Select value={settings.default_export_format || "CSV"} onChange={(val) => onUpdate("default_export_format", val)} options={EXPORT_FORMATS} placeholder="Select default format" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Backup Schedule (cron)</label>
          <input type="text" value={settings.backup_schedule || "0 2 * * *"} onChange={(e) => onUpdate("backup_schedule", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="0 2 * * *" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Backup Location</label>
          <input type="text" value={settings.backup_location || "./backups"} onChange={(e) => onUpdate("backup_location", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Data Retention (days)</label>
          <input type="number" value={settings.data_retention_days ?? 365} onChange={(e) => onUpdate("data_retention_days", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} min="0" />
        </div>
      </div>

      <div className="border-t pt-5 space-y-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enable Automatic Backups</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Automatically backup system data on schedule</p>
          </div>
          <Switch checked={settings.auto_backup_enabled || false} onChange={(checked) => onUpdate("auto_backup_enabled", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Include audit logs in backup</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Backup audit trail along with other data</p>
          </div>
          <Switch checked={settings.include_audit_in_backup || false} onChange={(checked) => onUpdate("include_audit_in_backup", checked)} />
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;