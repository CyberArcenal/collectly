// src/renderer/pages/payments/collection/components/ExportModal.tsx

import React, { useState } from 'react';
import Modal from '../../../../components/UI/Modal';
import Button from '../../../../components/UI/Button';
import { formatCurrency } from '../../../../utils/formatters';
import type { CollectionScheduleResponse } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  data: CollectionScheduleResponse | null;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, data, onClose }) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  if (!data) return null;

  const handleExport = () => {
    if (format === 'csv') {
      const headers = ['Debtor', 'Contact', 'Email', 'Period Amount', 'Paid', 'Status'];
      const rows = data.debtors.map(d => [
        d.borrowerName,
        d.contact || '',
        d.email || '',
        d.totalPeriodAmount.toFixed(2),
        d.totalPaidInPeriod.toFixed(2),
        d.allPaid ? 'Paid' : 'Unpaid',
      ]);
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collection_schedule_${data.periodLabel}_${data.asOfDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collection_schedule_${data.periodLabel}_${data.asOfDate}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Collection Schedule" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Export Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleExport}>Export</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;