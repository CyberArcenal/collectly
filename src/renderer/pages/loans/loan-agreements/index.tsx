// src/renderer/pages/loans/agreements/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileText,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  X,
  Plus,
  Download,
} from "lucide-react";
import { useLoanAgreements } from "./hooks/useLoanAgreements";
import LoanAgreementsTable from "./components/LoanAgreementsTable";
import CreateAgreementModal from "./components/CreateAgreementModal";
import EditAgreementModal from "./components/EditAgreementModal";
import SignAgreementModal from "./components/SignAgreementModal";
import ViewAgreementModal from "./components/ViewAgreementModal";
import type { LoanAgreement } from "../../../api/core/loan_agreement";
import { dialogs } from "../../../utils/dialogs";
import loanAgreementsAPI from "../../../api/core/loan_agreement";
import Button from "../../../components/UI/Button";
import { usePagination } from "../../../contexts/PaginationContext";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import LoanAgreementSummaryCards from "./components/LoanAgreementSummaryCards";
import BulkActionsBar from "./components/BulkActionsBar";

const LoanAgreementsPage: React.FC = () => {
  const {
    agreements,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    filters,
    sortConfig,
    setCurrentPage,
    setPageSize,
    handleFilterChange,
    resetFilters,
    handleSort,
    reload,
    stats,
    fetchStats,
    selectedAgreements,
    setSelectedAgreements,
    toggleAgreementSelection,
    toggleSelectAll,
  } = useLoanAgreements();

  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<LoanAgreement | null>(null);
  const [signLoading, setSignLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(
    filters.search ||
    (filters.status && filters.status !== "all") ||
    filters.lenderName ||
    filters.dateFrom ||
    filters.dateTo
  );

  // Stable pagination handlers
  const handlePageChange = useCallback(
    (newPage: number) => setCurrentPage(newPage),
    [setCurrentPage]
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1);
    },
    [setPageSize, setCurrentPage]
  );

  const handlersRef = useRef({
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  });
  useEffect(() => {
    handlersRef.current = {
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    };
  }, [handlePageChange, handlePageSizeChange]);

  const prevPageRef = useRef(currentPage);
  const prevTotalRef = useRef(totalItems);
  const prevLimitRef = useRef(pageSize);

  useEffect(() => {
    const pageChanged = prevPageRef.current !== currentPage;
    const totalChanged = prevTotalRef.current !== totalItems;
    const limitChanged = prevLimitRef.current !== pageSize;

    if (pageChanged || totalChanged || limitChanged) {
      prevPageRef.current = currentPage;
      prevTotalRef.current = totalItems;
      prevLimitRef.current = pageSize;

      setPagination({
        currentPage,
        totalItems,
        pageSize,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [10, 25, 50, 100],
        showPageSize: true,
      });
    }
  }, [currentPage, totalItems, pageSize, setPagination]);

  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handlers
  const handleView = (agreement: LoanAgreement) => {
    setSelectedAgreement(agreement);
    setViewModalOpen(true);
  };

  const handleEdit = (agreement: LoanAgreement) => {
    if (agreement.status === "signed") {
      dialogs.error("Cannot edit a signed agreement");
      return;
    }
    setSelectedAgreement(agreement);
    setEditModalOpen(true);
  };

  const handleSign = (agreement: LoanAgreement) => {
    if (agreement.status === "signed") {
      dialogs.error("Agreement is already signed");
      return;
    }
    setSelectedAgreement(agreement);
    setSignModalOpen(true);
  };

  const handleSignConfirm = async () => {
    if (!selectedAgreement) return;
    setSignLoading(true);
    try {
      await loanAgreementsAPI.sign(selectedAgreement.id);
      dialogs.success("Agreement signed successfully");
      reload();
      fetchStats();
      setSignModalOpen(false);
      setSelectedAgreement(null);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setSignLoading(false);
    }
  };

  const handleDelete = async (agreement: LoanAgreement) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Agreement",
      message:
        agreement.status === "signed"
          ? "This agreement is signed. Are you sure you want to delete it? (This may affect legal records.)"
          : "Are you sure you want to delete this draft agreement?",
    });
    if (!confirmed) return;
    try {
      await loanAgreementsAPI.delete(
        agreement.id,
        "system",
        agreement.status === "signed"
      );
      dialogs.success("Agreement deleted");
      reload();
      fetchStats();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const handleDownload = async (agreement: LoanAgreement) => {
    if (!agreement.filePath) {
      dialogs.error("No file attached to this agreement");
      return;
    }
    try {
      const result = await window.backendAPI.openAgreementFile(
        agreement.filePath
      );
      if (!result.status) throw new Error(result.message);
    } catch (err: any) {
      dialogs.error("Could not open file: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAgreements.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedAgreements.length} agreement(s)?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(
        selectedAgreements.map((id) =>
          loanAgreementsAPI.delete(id, "system", false)
        )
      );
      dialogs.success(`${selectedAgreements.length} agreement(s) deleted`);
      setSelectedAgreements([]);
      reload();
      fetchStats();
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  const handleBulkExport = async () => {
    if (selectedAgreements.length === 0) return;
    setExporting(true);
    try {
      const selected = agreements.filter((a) =>
        selectedAgreements.includes(a.id)
      );
      const headers = [
        "ID",
        "Debt",
        "Borrower",
        "Lender",
        "Status",
        "Agreement Date",
        "Signed By",
        "Signed At",
      ];
      const rows = selected.map((a) => [
        a.id,
        a.debt?.name || "",
        a.debt?.borrower?.name || "",
        a.lenderName || "",
        a.status,
        a.agreementDate || "",
        a.signedBy || "",
        a.signedAt || "",
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agreements_${new Date().toISOString().slice(0, 19)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      dialogs.success("Export completed");
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const response = await loanAgreementsAPI.export("csv", {
        status: filters.status !== "all" ? filters.status : undefined,
        search: filters.search || undefined,
        lenderName: filters.lenderName || undefined,
        agreementDateFrom: filters.dateFrom || undefined,
        agreementDateTo: filters.dateTo || undefined,
        limit: 10000,
      });
      if (response.status && response.data?.data) {
        const blob = new Blob([response.data.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `all_agreements_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        dialogs.success("Export completed");
      }
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--primary-color)]" />
            Loan Agreements
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Create and manage loan agreements for active loans
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={showStats ? "Hide summary" : "Show summary"}
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportAll}
            disabled={exporting || agreements.length === 0}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Export all"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={reload}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            New Agreement
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <LoanAgreementSummaryCards
          total={stats.totalAgreements || 0}
          draft={stats.totalAgreements - (stats.signed || 0) || 0}
          signed={stats.signed || 0}
          withFiles={stats.withFiles || 0}
        />
      )}

      {/* Filters Bar */}
      {showFilters && (
        <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </span>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search by lender or terms..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="signed">Signed</option>
            </select>
            <input
              type="text"
              placeholder="Lender name"
              value={filters.lenderName || ""}
              onChange={(e) => handleFilterChange("lenderName", e.target.value)}
              className="px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="From"
              />
              <span className="text-[var(--text-tertiary)] text-sm">to</span>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-sm"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="To"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedAgreements.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedAgreements.length}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={() => setSelectedAgreements([])}
          exporting={exporting}
        />
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8 text-[var(--danger-color)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)]">
          <p className="text-sm">Error: {error}</p>
          <button
            onClick={reload}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <LoanAgreementsTable
            agreements={agreements}
            selectedAgreements={selectedAgreements}
            onToggleSelect={toggleAgreementSelection}
            onToggleSelectAll={toggleSelectAll}
            onView={handleView}
            onEdit={handleEdit}
            onSign={handleSign}
            onDelete={handleDelete}
            onDownload={handleDownload}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          {agreements.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No loan agreements found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your filters" : "Create a new agreement to get started"}
              </p>
              {!hasFilters && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  Create Agreement
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateAgreementModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
      <EditAgreementModal
        isOpen={editModalOpen}
        agreement={selectedAgreement}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAgreement(null);
        }}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
      <SignAgreementModal
        isOpen={signModalOpen}
        agreement={selectedAgreement}
        onClose={() => {
          setSignModalOpen(false);
          setSelectedAgreement(null);
        }}
        onConfirm={handleSignConfirm}
        isLoading={signLoading}
      />
      <ViewAgreementModal
        isOpen={viewModalOpen}
        agreement={selectedAgreement}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAgreement(null);
        }}
        onDownload={() =>
          selectedAgreement && handleDownload(selectedAgreement)
        }
      />
    </div>
  );
};

export default LoanAgreementsPage;