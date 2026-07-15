// src/renderer/pages/reports/expected/components/DetailsModal.tsx
import React from "react";
import { X, User, DollarSign, FileText } from "lucide-react";
import { formatCurrency } from "../../../../utils/formatters";

interface DetailsModalProps {
  isOpen: boolean;
  title: string;
  details: Array<{ debtName: string; debtorName: string; amount: number }>;
  onClose: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, title, details, onClose }) => {
  if (!isOpen) return null;

  const total = details.reduce((sum, d) => sum + d.amount, 0);

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
            Expected Payments - {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {details.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
              No details available.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Debt
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Debtor
                      </th>
                      <th className="text-right py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((d, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors">
                        <td className="py-2 px-3 text-[var(--text-primary)]">{d.debtName}</td>
                        <td className="py-2 px-3 text-[var(--text-primary)]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[var(--text-tertiary)]" />
                            {d.debtorName}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-medium" style={{ color: "var(--debt-high)" }}>
                          {formatCurrency(d.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--card-secondary-bg)] border-t border-[var(--border-color)] font-semibold">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 text-[var(--text-primary)]">Total</td>
                      <td className="py-2 px-3 text-right" style={{ color: "var(--debt-high)" }}>
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-[var(--border-color)] flex-shrink-0">
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;