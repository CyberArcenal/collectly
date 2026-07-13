// src/renderer/pages/loans/agreements/components/EditAgreementModal.tsx
import React, { useState, useEffect } from "react";
import { X, Building, Calendar, FileText, Upload, Trash2 } from "lucide-react";
import loanAgreementsAPI, { type LoanAgreement } from "../../../../api/core/loan_agreement";
import FileDropzone from "../../../../components/UI/FileDropzone";
import { dialogs } from "../../../../utils/dialogs";

interface EditAgreementModalProps {
  isOpen: boolean;
  agreement: LoanAgreement | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAgreementModal: React.FC<EditAgreementModalProps> = ({
  isOpen,
  agreement,
  onClose,
  onSuccess,
}) => {
  const [lenderName, setLenderName] = useState("");
  const [agreementDate, setAgreementDate] = useState("");
  const [termsText, setTermsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (agreement && isOpen) {
      setLenderName(agreement.lenderName || "");
      let dateStr = "";
      if (agreement.agreementDate) {
        const date = new Date(agreement.agreementDate);
        if (!isNaN(date.getTime())) {
          dateStr = date.toISOString().slice(0, 10);
        }
      }
      setAgreementDate(dateStr);
      setTermsText(agreement.termsText || "");
      setFile(null);
      setRemoveFile(false);
    }
  }, [agreement, isOpen]);

  if (!isOpen || !agreement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await loanAgreementsAPI.update(agreement.id, {
        lenderName: lenderName.trim(),
        agreementDate,
        termsText: termsText.trim() || undefined,
        fileBuffer,
        fileName,
        removeFile: removeFile && !file,
      });
      dialogs.success("Agreement updated");
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
            Edit Loan Agreement
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Lender Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              <Building className="w-3 h-3 inline mr-1" /> Lender Name *
            </label>
            <input
              type="text"
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
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
              <Upload className="w-3 h-3 inline mr-1" /> Agreement File
            </label>
            <FileDropzone
              onFileSelect={(selectedFile) => {
                setFile(selectedFile);
                if (selectedFile) setRemoveFile(false);
              }}
              currentFile={file}
              accept=".pdf,.doc,.docx"
              maxSizeMB={10}
            />
            {agreement.filePath && !file && !removeFile && (
              <div className="mt-2 p-2.5 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeFile}
                    onChange={(e) => setRemoveFile(e.target.checked)}
                    className="accent-[var(--danger-color)]"
                  />
                  <span className="text-[var(--text-secondary)]">Remove current file</span>
                </label>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                  Current: {agreement.filePath.split("/").pop()}
                </p>
              </div>
            )}
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

export default EditAgreementModal;