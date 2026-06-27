// src/renderer/pages/payments/amortization/components/FrequencySelector.tsx

import React from 'react';
import type { PaymentFrequency } from '../types';

interface FrequencySelectorProps {
  value: PaymentFrequency;
  onChange: (freq: PaymentFrequency) => void;
  disabled?: boolean;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({ value, onChange, disabled = false }) => {
  const options: { label: string; value: PaymentFrequency }[] = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Semi-Annual', value: 'semi-annual' },
    { label: 'Annual', value: 'annual' },
  ];

  const getButtonStyle = (opt: PaymentFrequency) => {
    if (value === opt) {
      return { backgroundColor: 'var(--primary-color)', color: 'white' };
    }
    return { backgroundColor: 'var(--card-secondary-bg)', color: 'var(--text-primary)' };
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Payment Frequency
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className="px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={getButtonStyle(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FrequencySelector;