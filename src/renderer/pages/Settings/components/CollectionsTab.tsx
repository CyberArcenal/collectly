// src/renderer/pages/Settings/components/CollectionsTab.tsx
import React from "react";
import type { CollectionsSettings } from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";
import Select from "../../../components/UI/Select";

const PENALTY_METHODS = [
  { value: "percentage", label: "Percentage of remaining balance" },
  { value: "fixed", label: "Fixed amount" },
];

const INTEREST_PERIODS = [
  { value: "per_annum", label: "Per Annum (yearly)" },
  { value: "per_month", label: "Per Month (monthly)" },
];

interface Props {
  settings: CollectionsSettings;
  onUpdate: (field: keyof CollectionsSettings, value: any) => void;
}

const CollectionsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const inputStyle = {
    backgroundColor: "var(--input-bg)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Collections Settings</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Default rates, penalties, and loan limits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Default Interest Rate (%)</label>
          <input type="number" step="0.01" value={settings.default_interest_rate ?? 10} onChange={(e) => onUpdate("default_interest_rate", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Default Penalty Rate (% per day)</label>
          <input type="number" step="0.01" value={settings.default_penalty_rate ?? 2} onChange={(e) => onUpdate("default_penalty_rate", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Penalty Calculation Method</label>
          <Select value={settings.penalty_calculation_method ?? "percentage"} onChange={(val) => onUpdate("penalty_calculation_method", val)} options={PENALTY_METHODS} placeholder="Select method" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Penalty Grace Days</label>
          <input type="number" value={settings.penalty_grace_days ?? 0} onChange={(e) => onUpdate("penalty_grace_days", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Interest Calculation Period</label>
          <Select value={settings.interest_calculation_period ?? "per_annum"} onChange={(val) => onUpdate("interest_calculation_period", val)} options={INTEREST_PERIODS} placeholder="Select period" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Overdue Reminder Days</label>
          <input type="text" value={Array.isArray(settings.overdue_reminder_days) ? settings.overdue_reminder_days.join(", ") : "7, 3, 1"} onChange={(e) => { const days = e.target.value.split(",").map((d) => parseInt(d.trim())).filter((d) => !isNaN(d)); onUpdate("overdue_reminder_days", days); }} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} placeholder="e.g., 7, 3, 1" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Max Loan Amount (0 = unlimited)</label>
          <input type="number" step="0.01" value={settings.max_loan_amount ?? 0} onChange={(e) => onUpdate("max_loan_amount", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Min Loan Amount</label>
          <input type="number" step="0.01" value={settings.min_loan_amount ?? 0} onChange={(e) => onUpdate("min_loan_amount", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" style={inputStyle} />
        </div>
      </div>

      <div className="border-t pt-5 space-y-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Automatically apply penalty when overdue</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Penalty will be applied automatically to overdue loans</p>
          </div>
          <Switch checked={settings.enable_auto_penalty || false} onChange={(checked) => onUpdate("enable_auto_penalty", checked)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Require credit check before loan approval</label>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Prevent approval without a valid credit check</p>
          </div>
          <Switch checked={settings.enforce_credit_check || false} onChange={(checked) => onUpdate("enforce_credit_check", checked)} />
        </div>
      </div>
    </div>
  );
};

export default CollectionsTab;