// src/renderer/pages/payments/collection/components/RecordPeriodPaymentModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/UI/Modal';
import Button from '../../../../components/UI/Button';
import PaymentMethodSelect from '../../../../components/Selects/PaymentMethod';
import { dialogs } from '../../../../utils/dialogs';
import { formatCurrency, formatDate } from '../../../../utils/formatters';
import debtsAPI from '../../../../api/core/debt';
import type { DebtorCollection } from '../types';

interface RecordPeriodPaymentModalProps {
  isOpen: boolean;
  debtor: DebtorCollection | null;
  periodType: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPeriodPaymentModal: React.FC<RecordPeriodPaymentModalProps> = ({
  isOpen,
  debtor,
  periodType,
  onClose,
  onSuccess,
}) => {
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [methodId, setMethodId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setMethodId(null);
    }
  }, [isOpen]);

  if (!debtor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodId) {
      dialogs.error('Please select a payment method');
      return;
    }

    setSubmitting(true);
    try {
      const response = await debtsAPI.markPeriodPaid(
        debtor.borrowerId,
        periodType,
        paymentDate,
        methodId
      );
      if (response.status) {
        dialogs.success(`Recorded ${response.data.count} payment(s) successfully`);
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = debtor.totalPeriodAmount;
  const totalPaid = debtor.totalPaidInPeriod;
  const remaining = totalAmount - totalPaid;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Payment - ${debtor.borrowerName}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--card-secondary-bg)', border: '1px solid var(--border-color)' }}>
          <p><strong style={{ color: 'var(--text-primary)' }}>Debtor:</strong> <span style={{ color: 'var(--text-primary)' }}>{debtor.borrowerName}</span></p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Period:</strong> <span style={{ color: 'var(--text-primary)' }}>{periodType.charAt(0).toUpperCase() + periodType.slice(1)}</span></p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Total Amount Due:</strong> <span style={{ color: 'var(--debt-high)' }}>{formatCurrency(totalAmount)}</span></p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Already Paid:</strong> <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(totalPaid)}</span></p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Remaining:</strong> <span style={{ color: 'var(--success-color)' }}>{formatCurrency(remaining)}</span></p>
          <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            This will record payments for {debtor.debts.length} debt(s) for this period.
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Payment Date *
          </label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Payment Method *
          </label>
          <PaymentMethodSelect
            value={methodId}
            onChange={(id) => setMethodId(id)}
            placeholder="Select payment method..."
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={submitting || remaining <= 0.01}>
            {submitting ? 'Processing...' : remaining <= 0.01 ? 'Already Paid' : `Record Payment (${formatCurrency(remaining)})`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPeriodPaymentModal;