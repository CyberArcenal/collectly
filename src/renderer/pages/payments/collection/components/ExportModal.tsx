// src/renderer/pages/payments/collection/components/ExportModal.tsx

import React, { useState } from 'react';
import { X, Download, FileText, FileJson } from 'lucide-react';
import type { CollectionScheduleResponse } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  data: CollectionScheduleResponse | null;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, data, onClose }) => {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  if (!isOpen || !data) return null;

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-sm shadow-xl border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--primary-color)]" />
            Export Collection Schedule
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  format === 'csv'
                    ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileText className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  format === 'json'
                    ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 text-[var(--primary-color)]'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-[var(--text-tertiary)]">
            <p>Period: <span className="font-medium text-[var(--text-secondary)]">{data.periodLabel}</span></p>
            <p>Debtors: <span className="font-medium text-[var(--text-secondary)]">{data.totalDebtors}</span></p>
            <p>Total Due: <span className="font-medium text-[var(--text-secondary)]">{data.totalDue.toFixed(2)}</span></p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--btn-secondary-bg)",
                color: "var(--btn-secondary-text)",
                border: "1px solid var(--btn-secondary-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5"
              style={{ backgroundColor: "var(--primary-color)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-color)";
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;