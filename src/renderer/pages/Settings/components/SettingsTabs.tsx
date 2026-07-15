// src/renderer/pages/Settings/components/SettingsTabs.tsx
import React from "react";
import { Home, HandCoins, FileText, Bell, BarChart3, Plug, Shield } from "lucide-react";
import type { SettingType } from "../../../api/utils/system_config";

interface SettingsTabsProps {
  activeTab: SettingType;
  onTabChange: (tab: string) => void;
}

const TABS: { id: SettingType; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Home className="w-4 h-4" /> },
  { id: "collections", label: "Collections", icon: <HandCoins className="w-4 h-4" /> },
  { id: "loans", label: "Loans", icon: <FileText className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  // { id: "reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
  // { id: "integrations", label: "Integrations", icon: <Plug className="w-4 h-4" /> },
  { id: "audit_security", label: "Audit & Security", icon: <Shield className="w-4 h-4" /> },
];

const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              isActive
                ? "text-white shadow-md"
                : "hover:bg-[var(--card-hover-bg)]"
            }`}
            style={{
              backgroundColor: isActive ? "var(--primary-color)" : "transparent",
              color: isActive ? "white" : "var(--text-secondary)",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default SettingsTabs;