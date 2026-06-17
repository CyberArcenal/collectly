// src/renderer/pages/Settings/components/CollectionsTab.tsx
import React from "react";
import type { CollectionsSettings } from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";

interface Props {
  settings: CollectionsSettings;
  onUpdate: (field: keyof CollectionsSettings, value: any) => void;
}

const CollectionsTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Collections Settings</h3>
        <p className="text-sm text-[var(--text-secondary)]">Default rates, penalties, and loan limits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.default_interest_rate ?? 10}
            onChange={(e) =>
              onUpdate("default_interest_rate", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Penalty Rate (% per day)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.default_penalty_rate ?? 2}
            onChange={(e) =>
              onUpdate("default_penalty_rate", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Penalty Calculation Method
          </label>
          <select
            value={settings.penalty_calculation_method ?? "percentage"}
            onChange={(e) => onUpdate("penalty_calculation_method", e.target.value)}
            className="windows-input w-full"
          >
            <option value="percentage">Percentage of remaining balance</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Penalty Grace Days
          </label>
          <input
            type="number"
            value={settings.penalty_grace_days ?? 0}
            onChange={(e) =>
              onUpdate("penalty_grace_days", parseInt(e.target.value) || 0)
            }
            className="windows-input w-full"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Interest Calculation Period (for new loans)
          </label>
          <select
            value={settings.interest_calculation_period ?? "per_annum"}
            onChange={(e) => onUpdate("interest_calculation_period", e.target.value)}
            className="windows-input w-full"
          >
            <option value="per_annum">Per Annum (yearly) – 365 days/year</option>
            <option value="per_month">Per Month (monthly) – 30 days/month</option>
          </select>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Applied as default for new loans. Existing loans retain their own period.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Overdue Reminder Days (comma separated)
          </label>
          <input
            type="text"
            value={
              Array.isArray(settings.overdue_reminder_days)
                ? settings.overdue_reminder_days.join(", ")
                : "7, 3, 1"
            }
            onChange={(e) => {
              const days = e.target.value
                .split(",")
                .map((d) => parseInt(d.trim()))
                .filter((d) => !isNaN(d));
              onUpdate("overdue_reminder_days", days);
            }}
            className="windows-input w-full"
            placeholder="e.g., 7, 3, 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Max Loan Amount (0 = unlimited)
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.max_loan_amount ?? 0}
            onChange={(e) =>
              onUpdate("max_loan_amount", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Min Loan Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.min_loan_amount ?? 0}
            onChange={(e) =>
              onUpdate("min_loan_amount", parseFloat(e.target.value) || 0)
            }
            className="windows-input w-full"
          />
        </div>
      </div>

      <div className="border-t border-[var(--border-color)] pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="enable_auto_penalty" className="text-sm font-medium text-[var(--text-primary)]">
              Automatically apply penalty when overdue
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">Penalty will be applied automatically to overdue loans</p>
          </div>
          <Switch
            checked={settings.enable_auto_penalty || false}
            onChange={(checked) => onUpdate("enable_auto_penalty", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="enforce_credit_check" className="text-sm font-medium text-[var(--text-primary)]">
              Require credit check before loan approval
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">Prevent approval without a valid credit check</p>
          </div>
          <Switch
            checked={settings.enforce_credit_check || false}
            onChange={(checked) => onUpdate("enforce_credit_check", checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default CollectionsTab;