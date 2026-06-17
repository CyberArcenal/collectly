// src/renderer/pages/Settings/components/SettingsHeader.tsx
import React, { useRef } from "react";
import { Save, RotateCcw, Download, Upload, Loader2 } from "lucide-react";
import Button from "../../../components/UI/Button";

interface Props {
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
}

const SettingsHeader: React.FC<Props> = ({
  onSave,
  onReset,
  onExport,
  onImport,
  saving,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-[var(--card-bg)] border border-[var(--border-color)]/20 rounded-lg">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure your debt management system preferences
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImport}
          accept=".json,application/json"
          className="hidden"
        />
        <Button variant="secondary" size="sm" icon={Upload} onClick={handleImportClick}>
          Import
        </Button>
        <Button variant="secondary" size="sm" icon={Download} onClick={onExport}>
          Export
        </Button>
        <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onReset} className="text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10">
          Reset
        </Button>
        <Button variant="primary" size="sm" icon={Save} onClick={onSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SettingsHeader;