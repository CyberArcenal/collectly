// src/renderer/pages/payments/amortization/components/DebtSelector.tsx

import React from 'react';

interface DebtSelectorProps {
  debts: any[];
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}

const DebtSelector: React.FC<DebtSelectorProps> = ({ debts, value, onChange, disabled }) => {
  const inputStyle = {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Select Debt
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        disabled={disabled}
        className="w-full px-3 py-2 border rounded-md"
        style={inputStyle}
      >
        <option value="">-- Select a debt --</option>
        {debts.map((debt) => (
          <option key={debt.id} value={debt.id}>
            {debt.name} - {debt.borrower?.name || 'Unknown'} (Due: {new Date(debt.dueDate).toLocaleDateString()})
          </option>
        ))}
      </select>
    </div>
  );
};

export default DebtSelector;