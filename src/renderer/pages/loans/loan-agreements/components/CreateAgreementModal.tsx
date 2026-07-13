// src/renderer/pages/loans/agreements/components/CreateAgreementModal.tsx
import React, { useState, useEffect } from "react";
import { X, User, Calendar, FileText, Upload, Building, DollarSign } from "lucide-react";
import type { Debt } from "../../../../api/core/debt";
import loanAgreementsAPI from "../../../../api/core/loan_agreement";
import DebtSelect from "../../../../components/Selects/Debt";
import FileDropzone from "../../../../components/UI/FileDropzone";
import { dialogs } from "../../../../utils/dialogs";
import { formatCurrency } from "../../../../utils/formatters";

interface CreateAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAgreementModal: React.FC<CreateAgreementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [debtId, setDebtId] = useState<number | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [lenderName, setLenderName] = useState("");
  const [agreementDate, setAgreementDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [termsText, setTermsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDebtId(null);
      setSelectedDebt(null);
      setLenderName("");
      setAgreementDate(new Date().toISOString().slice(0, 10));
      setTermsText("");
      setFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDebtChange = (id: number | null, debt?: Debt) => {
    setDebtId(id);
    setSelectedDebt(debt || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtId) {
      dialogs.error("Please select a debt");
      return;
    }
    if (!lenderName.trim()) {
      dialogs.error("Lender name is required");
      return;
    }

    setSubmitting(true);
    try {
      let fileBuffer: Uint8Array | undefined;
      let fileName: string | undefined;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = new Uint8Array(arrayBuffer);
        fileName = file.name;
      }
      await loanAgreementsAPI.create({
        debtId,
        lenderName: lenderName.trim(),
        agreementDate,
        termsText: termsText.trim() || undefined,
        fileBuffer,
        fileName,
      });
      dialogs.success("Loan agreement created");
      onSuccess();
      onClose();
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
            Create Loan Agreement
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Debt Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <DollarSign className="w-3 h-3 inline mr-1" /> Select Loan *
            </label>
            <DebtSelect
              value={debtId}
              onChange={handleDebtChange}
              statusFilter="active"
              placeholder="Search active loan..."
            />
            {selectedDebt && (
              <div
                className="mt-2 p-2.5 rounded-lg text-xs grid grid-cols-2 gap-1"
                style={{ backgroundColor: "var(--card-secondary-bg)" }}
              >
                <div>
                  <span className="text-[var(--text-tertiary)]">Principal:</span>
                  <span className="ml-1 font-medium text-[var(--text-primary)]">
                    {formatCurrency(selectedDebt.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-tertiary)]">Interest:</span>
                  <span className="ml-1 text-[var(--text-primary)]">
                    {selectedDebt.interestRate || 0}% p.a.
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[var(--text-tertiary)]">Due Date:</span>
                  <span className="ml-1 text-[var(--text-primary)]">
                    {selectedDebt.dueDate ? new Date(selectedDebt.dueDate).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lender Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <Building className="w-3 h-3 inline mr-1" /> Lender Name *
            </label>
            <input
              type="text"
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder="e.g., Bank of the Philippines"
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
              required
            />
          </div>

          {/* Agreement Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" /> Agreement Date
            </label>
            <input
              type="date"
              value={agreementDate}
              onChange={(e) => setAgreementDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Terms */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <FileText className="w-3 h-3 inline mr-1" /> Terms (optional)
            </label>
            <textarea
              rows={3}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              placeholder="Additional terms and conditions..."
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <Upload className="w-3 h-3 inline mr-1" /> Upload Agreement File (optional)
            </label>
            <FileDropzone
              onFileSelect={setFile}
              currentFile={file}
              accept=".pdf,.doc,.docx"
              maxSizeMB={10}
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
                  Creating...
                </>
              ) : (
                "Create Draft"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgreementModal;