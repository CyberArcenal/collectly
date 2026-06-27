// src/renderer/pages/Settings/components/SettingsTabs.tsx
import React from "react";
import { SettingType } from "../../../api/utils/system_config";

const tabs: { id: SettingType; label: string }[] = [
  { id: "general", label: "General" },
  { id: "collections", label: "Collections" },
  { id: "loans", label: "Loans" },
  { id: "notifications", label: "Notifications" },
  // { id: "reports", label: "Reports" },
  // { id: "integrations", label: "Integrations" },
  { id: "audit_security", label: "Audit & Security" },
];

interface Props {
  activeTab: SettingType;
  onTabChange: (tab: SettingType) => void;
}

const SettingsTabs: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-1 mb-6 border-b border-[var(--border-color)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-2.5 text-sm font-medium transition-all duration-200
            border-b-2 border-transparent
            hover:text-[var(--text-primary)] hover:border-[var(--border-color)]
            ${activeTab === tab.id
              ? "text-[var(--primary-color)] border-[var(--primary-color)]"
              : "text-[var(--text-secondary)]"
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SettingsTabs;