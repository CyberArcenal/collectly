// src/renderer/pages/loans/active/components/EditDebtModal.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import type { Debt, DebtUpdateData } from "../../../../api/core/debt";
import { dialogs } from "../../../../utils/dialogs";
import debtsAPI from "../../../../api/core/debt";

interface EditDebtModalProps {
  isOpen: boolean;
  debt: Debt | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  name: string;
  totalAmount: number;
  dueDate: string;
  interestRate: number | null;
  penaltyRate: number | null;
};

const EditDebtModal: React.FC<EditDebtModalProps> = ({ isOpen, debt, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>();

  useEffect(() => {
    if (isOpen && debt) {
      let dueDateStr = "";
      if (debt.dueDate) {
        const date = new Date(debt.dueDate);
        if (!isNaN(date.getTime())) {
          dueDateStr = date.toISOString().slice(0, 10);
        }
      }
      reset({
        name: debt.name ?? "",
        totalAmount: debt.totalAmount ?? 0,
        dueDate: dueDateStr,
        interestRate: debt.interestRate ?? null,
        penaltyRate: debt.penaltyRate ?? null,
      });
    }
  }, [isOpen, debt, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    if (!debt) {
      dialogs.error("No debt selected");
      return;
    }
    try {
      await debtsAPI.update(debt.id, data as DebtUpdateData);
      dialogs.success("Debt updated successfully");
      onSuccess();
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
            Edit Debt
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {debt ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Debt Name *
              </label>
              <input
                {...register("name", { required: "Name is required" })}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Total Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₱</span>
                <input
                  type="number"
                  step="0.01"
                  {...register("totalAmount", { required: true, valueAsNumber: true })}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Due Date *
              </label>
              <input
                type="date"
                {...register("dueDate", { required: true })}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("interestRate", { valueAsNumber: true })}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Penalty Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("penaltyRate", { valueAsNumber: true })}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

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
        ) : (
          <div className="text-center text-[var(--text-tertiary)] py-8">No debt data to edit</div>
        )}
      </div>
    </div>
  );
};

export default EditDebtModal;