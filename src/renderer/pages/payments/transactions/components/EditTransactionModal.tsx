// src/renderer/pages/payments/transactions/components/EditTransactionModal.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, DollarSign, Calendar, Hash, FileText } from "lucide-react";
import type { PaymentTransaction } from "../../../../api/core/payment_transaction";
import { dialogs } from "../../../../utils/dialogs";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: PaymentTransaction | null;
  onClose: () => void;
  onSave: (id: number, data: any) => Promise<void>;
}

type FormData = {
  amount: number;
  paymentDate: string;
  reference: string;
  notes: string;
};

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave,
}) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

  useEffect(() => {
    if (transaction) {
      let paymentDateStr = "";
      if (transaction.paymentDate) {
        const date = new Date(transaction.paymentDate);
        if (!isNaN(date.getTime())) paymentDateStr = date.toISOString().slice(0, 10);
      }
      reset({
        amount: transaction.amount,
        paymentDate: paymentDateStr,
        reference: transaction.reference || "",
        notes: transaction.notes || "",
      });
    }
  }, [transaction, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    if (!transaction) return;
    try {
      await onSave(transaction.id, data);
      dialogs.success("Transaction updated");
      onClose();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-md shadow-xl border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            Edit Transaction
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <DollarSign className="w-3 h-3 inline mr-1" /> Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₱</span>
              <input
                type="number"
                step="0.01"
                {...register("amount", { required: true, valueAsNumber: true })}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <Calendar className="w-3 h-3 inline mr-1" /> Payment Date *
            </label>
            <input
              type="date"
              {...register("paymentDate", { required: true })}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <Hash className="w-3 h-3 inline mr-1" /> Reference
            </label>
            <input
              {...register("reference")}
              placeholder="e.g., OR-2024-001"
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <FileText className="w-3 h-3 inline mr-1" /> Notes
            </label>
            <textarea
              {...register("notes")}
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
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
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: "var(--primary-color)" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--primary-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-color)";
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;