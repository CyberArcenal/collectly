// src/renderer/pages/reports/aging/components/BucketDrillDownModal.tsx
import React, { useState, useEffect, useCallback } from "react";
import { X, User, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { usePagination } from "../../../../contexts/PaginationContext";
import type { Debt } from "../../../../api/core/debt";
import debtsAPI from "../../../../api/core/debt";
import { formatCurrency, formatDate } from "../../../../utils/formatters";

interface BucketDrillDownModalProps {
  isOpen: boolean;
  bucketRange: string;
  asOfDate: string;
  onClose: () => void;
}

const BucketDrillDownModal: React.FC<BucketDrillDownModalProps> = ({
  isOpen,
  bucketRange,
  asOfDate,
  onClose,
}) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });

  const { setPagination: setGlobalPagination, clearPagination } = usePagination();

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtsAPI.getDebtsInBucket(bucketRange, asOfDate, page, pageSize);
      if (!response.status) throw new Error(response.message);
      setDebts(response.data.data);
      const meta = {
        page: response.data.pagination.page,
        totalPages: response.data.pagination.pages,
        totalItems: response.data.pagination.total,
        pageSize: response.data.pagination.limit,
      };
      setPagination(meta);
      // Sync global pagination
      setGlobalPagination({
        currentPage: meta.page,
        totalItems: meta.totalItems,
        pageSize: meta.pageSize,
        onPageChange: (p) => setPage(p),
        onPageSizeChange: (s) => { setPageSize(s); setPage(1); },
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bucketRange, asOfDate, page, pageSize, setGlobalPagination]);

  useEffect(() => {
    if (isOpen) {
      fetchDebts();
    }
    return () => {
      clearPagination();
    };
  }, [isOpen, fetchDebts, clearPagination]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-3xl max-h-[90vh] shadow-xl border flex flex-col"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--warning-color)]" />
            Debts in {bucketRange}
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
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full" />
            </div>
          )}
          {error && (
            <div className="text-center py-4 text-[var(--danger-color)]">Error: {error}</div>
          )}
          {!loading && !error && debts.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
              No debts in this bucket.
            </div>
          )}
          {!loading && !error && debts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Debt Name
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="text-right py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="text-right py-2 px-3 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Days Past Due
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((debt) => {
                    const daysPastDue = Math.max(0, Math.floor(
                      (new Date(asOfDate).getTime() - new Date(debt.dueDate).getTime()) / (1000 * 3600 * 24)
                    ));
                    return (
                      <tr key={debt.id} className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors">
                        <td className="py-2 px-3 text-[var(--text-primary)]">{debt.name}</td>
                        <td className="py-2 px-3 text-[var(--text-primary)]">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-[var(--text-tertiary)]" />
                            {debt.borrower?.name || "—"}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-medium" style={{ color: "var(--debt-high)" }}>
                          {formatCurrency(debt.remainingAmount)}
                        </td>
                        <td className="py-2 px-3 text-[var(--text-primary)]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                            {formatDate(debt.dueDate)}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right text-[var(--text-primary)]">
                          {daysPastDue}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

export default BucketDrillDownModal;