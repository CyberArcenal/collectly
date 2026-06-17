// src/renderer/pages/Settings/components/LoansTab.tsx
import React from "react";
import type { LoanSettings } from "../../../api/utils/system_config";
import Switch from "../../../components/UI/Switch";

interface Props {
  settings: LoanSettings;
  onUpdate: (field: keyof LoanSettings, value: any) => void;
}

const LoansTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Loan Settings</h3>
        <p className="text-sm text-[var(--text-secondary)]">Default loan terms, payment rules, and agreements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Amortization Type
          </label>
          <select
            value={settings.amortization_type ?? "flat"}
            onChange={(e) => onUpdate("amortization_type", e.target.value)}
            className="windows-input w-full"
          >
            <option value="flat">Flat (fixed interest)</option>
            <option value="declining">Declining (diminishing balance)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default Loan Term (months)
          </label>
          <input
            type="number"
            value={settings.default_loan_term_months ?? 12}
            onChange={(e) =>
              onUpdate("default_loan_term_months", parseInt(e.target.value) || 0)
            }
            className="windows-input w-full"
            min="1"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Allowed Loan Statuses (comma separated)
          </label>
          <input
            type="text"
            value={
              Array.isArray(settings.allowed_loan_statuses)
                ? settings.allowed_loan_statuses.join(", ")
                : "active, paid, overdue, defaulted"
            }
            onChange={(e) => {
              const statuses = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              onUpdate("allowed_loan_statuses", statuses);
            }}
            className="windows-input w-full"
            placeholder="active, paid, overdue, defaulted"
          />
        </div>
      </div>

      <div className="border-t border-[var(--border-color)] pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="enable_partial_payment" className="text-sm font-medium text-[var(--text-primary)]">
              Allow partial payments
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">Borrowers can pay less than the full due amount</p>
          </div>
          <Switch
            checked={settings.enable_partial_payment || false}
            onChange={(checked) => onUpdate("enable_partial_payment", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="enable_early_payment_discount" className="text-sm font-medium text-[var(--text-primary)]">
              Enable early payment discount
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">Apply discount when loans are paid before due date</p>
          </div>
          <Switch
            checked={settings.enable_early_payment_discount || false}
            onChange={(checked) => onUpdate("enable_early_payment_discount", checked)}
          />
        </div>

        {settings.enable_early_payment_discount && (
          <div className="ml-6">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Early Payment Discount Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.early_payment_discount_rate ?? 0}
              onChange={(e) =>
                onUpdate("early_payment_discount_rate", parseFloat(e.target.value) || 0)
              }
              className="windows-input w-full max-w-xs"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="require_loan_agreement" className="text-sm font-medium text-[var(--text-primary)]">
              Require loan agreement document
            </label>
            <p className="text-xs text-[var(--text-tertiary)]">Force upload of signed agreement before loan activation</p>
          </div>
          <Switch
            checked={settings.require_loan_agreement || false}
            onChange={(checked) => onUpdate("require_loan_agreement", checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default LoansTab;