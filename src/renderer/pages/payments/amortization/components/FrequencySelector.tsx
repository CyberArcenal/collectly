// src/renderer/pages/payments/amortization/components/FrequencySelector.tsx

import React from 'react';
import type { PaymentFrequency } from '../types';

interface FrequencySelectorProps {
  value: PaymentFrequency;
  onChange: (freq: PaymentFrequency) => void;
  disabled?: boolean;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options: { label: string; value: PaymentFrequency }[] = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Semi-Annual', value: 'semi-annual' },
    { label: 'Annual', value: 'annual' },
  ];

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
        Payment Frequency
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? "text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
              }`}
              style={{
                backgroundColor: isActive ? "var(--primary-color)" : "var(--card-secondary-bg)",
                borderColor: isActive ? "var(--primary-color)" : "var(--border-color)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FrequencySelector;