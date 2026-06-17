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
  const handleExportFormatsChange = (value: string) => {
    const formats = value
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    onUpdate("export_formats", formats);
  };

  const getExportFormatsDisplay = (): string => {
    const formats = settings.export_formats;
    if (Array.isArray(formats)) return formats.join(", ");
    if (typeof formats === "string") {
      try {
        const parsed = JSON.parse(formats);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch {}
      return formats;
    }
    return "CSV, Excel, PDF";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Reports Settings</h3>
        <p className="text-sm text-[var(--text-secondary)]">Export, backup, and retention preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Export Formats (comma separated)
          </label>
          <input
            type="text"
            value={getExportFormatsDisplay()}
            onChange={(e) => handleExportFormatsChange(e.target.value)}
            className="windows-input w-full"
            placeholder="CSV, Excel, PDF"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Export Format
          </label>
          <Select
            value={settings.default_export_format || "CSV"}
            onChange={(val) => onUpdate("default_export_format", val)}
            options={EXPORT_FORMATS}
            placeholder="Select default format"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Backup Schedule (cron expression)
          </label>
          <input
            type="text"
            value={settings.backup_schedule || "0 2 * * *"}
            onChange={(e) => onUpdate("backup_schedule", e.target.value)}
            className="windows-input w-full"
            placeholder="0 2 * * *"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Backup Location
          </label>
          <input
            type="text"
            value={settings.backup_location || "./backups"}
            onChange={(e) => onUpdate("backup_location", e.target.value)}
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Data Retention (days)
          </label>
          <input
            type="number"
            value={settings.data_retention_days ?? 365}
            onChange={(e) =>
              onUpdate("data_retention_days", parseInt(e.target.value) || 0)
            }
            className="windows-input w-full"
            min="0"
          />
        </div>
      </div>

      <div className="border-t border-[var(--border-color)] pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="auto_backup_enabled" className="text-sm font-medium text-[var(--text-primary)]">
              Enable Automatic Backups
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">Automatically backup system data on schedule</p>
          </div>
          <Switch
            checked={settings.auto_backup_enabled || false}
            onChange={(checked) => onUpdate("auto_backup_enabled", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="include_audit_in_backup" className="text-sm font-medium text-[var(--text-primary)]">
              Include audit logs in backup
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">Backup audit trail along with other data</p>
          </div>
          <Switch
            checked={settings.include_audit_in_backup || false}
            onChange={(checked) => onUpdate("include_audit_in_backup", checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;