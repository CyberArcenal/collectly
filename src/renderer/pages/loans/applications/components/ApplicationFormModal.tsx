// src/renderer/pages/loans/applications/components/ApplicationFormModal.tsx
import React, { useState, useEffect } from "react";
import { X, User, DollarSign, FileText, Calendar, Users, TrendingUp } from "lucide-react";
import type { Borrower } from "../../../../api/core/borrower";
import borrowersAPI from "../../../../api/core/borrower";
import loanApplicationsAPI from "../../../../api/core/loan_application";
import BorrowerSelect from "../../../../components/Selects/Borrower";
import { dialogs } from "../../../../utils/dialogs";

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  debtorType: "existing" | "new";
  debtorId: number | null;
  newDebtorName: string;
  newDebtorContact: string;
  newDebtorEmail: string;
  newDebtorAddress: string;
  requestedAmount: number;
  purpose: string;
  proposedDueDate: string;
  interestRate: number;
};

const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    debtorType: "existing",
    debtorId: null,
    newDebtorName: "",
    newDebtorContact: "",
    newDebtorEmail: "",
    newDebtorAddress: "",
    requestedAmount: 0,
    purpose: "",
    proposedDueDate: new Date().toISOString().slice(0, 10),
    interestRate: 0,
  });
  const [existingDebtors, setExistingDebtors] = useState<Borrower[]>([]);
  const [loadingDebtors, setLoadingDebtors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && formData.debtorType === "existing") {
      const loadDebtors = async () => {
        setLoadingDebtors(true);
        try {
          const res = await borrowersAPI.getAll({ limit: 1000, includeDeleted: false });
          if (res.status) setExistingDebtors(res.data.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingDebtors(false);
        }
      };
      loadDebtors();
    }
  }, [isOpen, formData.debtorType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.requestedAmount <= 0) {
      dialogs.error("Requested amount must be greater than zero");
      return;
    }
    if (!formData.purpose.trim()) {
      dialogs.error("Purpose is required");
      return;
    }
    if (!formData.proposedDueDate) {
      dialogs.error("Due date is required");
      return;
    }
    if (formData.debtorType === "existing" && !formData.debtorId) {
      dialogs.error("Please select a debtor");
      return;
    }
    if (formData.debtorType === "new" && !formData.newDebtorName.trim()) {
      dialogs.error("New debtor name is required");
      return;
    }

    setSubmitting(true);
    try {
      const createData: any = {
        requestedAmount: formData.requestedAmount,
        purpose: formData.purpose,
        proposedDueDate: formData.proposedDueDate,
        interestRate: formData.interestRate || null,
      };
      if (formData.debtorType === "existing") {
        createData.debtorId = formData.debtorId;
      } else {
        createData.newDebtor = {
          name: formData.newDebtorName,
          contact: formData.newDebtorContact || null,
          email: formData.newDebtorEmail || null,
          address: formData.newDebtorAddress || null,
        };
      }
      const response = await loanApplicationsAPI.create(createData);
      if (response.status) {
        dialogs.success("Loan application submitted successfully");
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-2xl max-h-[90vh] shadow-xl border flex flex-col"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--primary-color)]" />
            New Loan Application
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Debtor Type */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <Users className="w-3 h-3 inline mr-1" /> Debtor Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  value="existing"
                  checked={formData.debtorType === "existing"}
                  onChange={() =>
                    setFormData({ ...formData, debtorType: "existing", debtorId: null })
                  }
                  className="accent-[var(--primary-color)]"
                />
                Existing Debtor
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="radio"
                  value="new"
                  checked={formData.debtorType === "new"}
                  onChange={() => setFormData({ ...formData, debtorType: "new" })}
                  className="accent-[var(--primary-color)]"
                />
                New Debtor
              </label>
            </div>
          </div>

          {/* Debtor Selection */}
          {formData.debtorType === "existing" ? (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Select Debtor *
              </label>
              <BorrowerSelect
                value={formData.debtorId}
                onChange={(id) => setFormData({ ...formData, debtorId: id })}
                placeholder="Search and select a debtor..."
                activeOnly={true}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={formData.newDebtorName}
                  onChange={(e) =>
                    setFormData({ ...formData, newDebtorName: e.target.value })
                  }
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
                  Contact
                </label>
                <input
                  value={formData.newDebtorContact}
                  onChange={(e) =>
                    setFormData({ ...formData, newDebtorContact: e.target.value })
                  }
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
                  Email
                </label>
                <input
                  type="email"
                  value={formData.newDebtorEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, newDebtorEmail: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Address
                </label>
                <textarea
                  value={formData.newDebtorAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, newDebtorAddress: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Loan Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                <DollarSign className="w-3 h-3 inline mr-1" /> Requested Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">₱</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.requestedAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requestedAmount: parseFloat(e.target.value) || 0,
                    })
                  }
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
                <TrendingUp className="w-3 h-3 inline mr-1" /> Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interestRate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interestRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
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
              <FileText className="w-3 h-3 inline mr-1" /> Purpose *
            </label>
            <textarea
              required
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              rows={2}
              placeholder="e.g., Business expansion, Education, Medical expenses..."
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              <Calendar className="w-3 h-3 inline mr-1" /> Proposed Due Date *
            </label>
            <input
              type="date"
              required
              value={formData.proposedDueDate}
              onChange={(e) =>
                setFormData({ ...formData, proposedDueDate: e.target.value })
              }
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
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
              disabled={submitting}
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
              {submitting ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationFormModal;