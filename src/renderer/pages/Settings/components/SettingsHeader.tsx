// src/renderer/pages/Settings/components/SettingsHeader.tsx
import React from "react";
import { Save, RefreshCw, Download, Upload, Settings } from "lucide-react";

interface SettingsHeaderProps {
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  onSave,
  onReset,
  onExport,
  onImport,
  saving,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-xl border p-5 shadow-sm" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: "var(--primary-color)/10" }}>
          <Settings className="w-6 h-6" style={{ color: "var(--primary-color)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>System Settings</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Configure your debt management system</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onExport}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--card-hover-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <label className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border cursor-pointer" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--card-hover-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <Upload className="w-4 h-4" />
          Import
          <input type="file" accept=".json" onChange={onImport} className="hidden" />
        </label>

        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
          style={{ color: "var(--danger-color)" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--status-overdue-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>

        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
          style={{ backgroundColor: "var(--primary-color)" }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "var(--primary-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--primary-color)";
          }}
        >
          {saving ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsHeader;