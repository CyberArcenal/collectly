// src/renderer/pages/debtors/index.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Plus, 
  RefreshCw, 
  Filter, 
  Eye, 
  EyeOff,
  Download,
  UserPlus,
  X
} from "lucide-react";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showSuccess, showError } from "../../utils/notification";

import useDebtors from "./hooks/useDebtors";
import FilterBar from "./components/FilterBar";
import DebtorTable from "./components/DebtorTable";
import DebtorFormDialog from "./components/DebtorFormDialog";
import DebtorViewDialog from "./components/DebtorViewDialog";
import BulkActionsBar from "./components/BulkActionsBar";
import borrowersAPI from "../../api/core/borrower";
import { usePagination } from "../../contexts/PaginationContext";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import DebtorSummaryCards from "./components/DebtorSummaryCards";

const DebtorDirectory: React.FC = () => {
  const {
    debtors,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    filters,
    selectedDebtors,
    setSelectedDebtors,
    sortConfig,
    setPageSize,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleDebtorSelection,
    toggleSelectAll,
    handleSort,
    stats,
    fetchStats,
  } = useDebtors();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingDebtor, setEditingDebtor] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingDebtor, setViewingDebtor] = useState<any>(null);
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(filters.search || filters.status !== "active");

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

  const handlersRef = useRef({ onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  useEffect(() => {
    handlersRef.current = { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange };
  }, [handlePageChange, handlePageSizeChange]);

  const prevPageRef = useRef(currentPage);
  const prevTotalRef = useRef(totalItems);
  const prevLimitRef = useRef(pageSize);

  // Sync with global pagination context
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

  // Modal handlers
  const openAddForm = () => {
    setFormMode("add");
    setEditingDebtor(null);
    setFormOpen(true);
  };

  const openEditForm = (debtor: any) => {
    setFormMode("edit");
    setEditingDebtor(debtor);
    setFormOpen(true);
  };

  const openView = (debtor: any) => {
    setViewingDebtor(debtor);
    setViewOpen(true);
  };

  const handleDelete = async (debtor: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Debtor",
      message: `Are you sure you want to delete ${debtor.name}? This action can be reversed.`,
    });
    if (!confirmed) return;
    try {
      await borrowersAPI.delete(debtor.id);
      showSuccess("Debtor deleted successfully");
      reload();
      fetchStats();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleRestore = async (debtor: any) => {
    const confirmed = await dialogs.confirm({
      title: "Restore Debtor",
      message: `Restore ${debtor.name}?`,
    });
    if (!confirmed) return;
    try {
      await borrowersAPI.restore(debtor.id);
      showSuccess("Debtor restored");
      reload();
      fetchStats();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDebtors.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedDebtors.length} debtors?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedDebtors.map((id) => borrowersAPI.delete(id)));
      showSuccess(`${selectedDebtors.length} debtors deleted`);
      setSelectedDebtors([]);
      reload();
      fetchStats();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleBulkExport = async () => {
    if (selectedDebtors.length === 0) return;
    setExporting(true);
    try {
      const response = await borrowersAPI.export("csv", {
        ids: selectedDebtors,
      });
      if (response.status && response.data?.data) {
        const csvData = typeof response.data.data === "string" ? response.data.data : JSON.stringify(response.data.data);
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `debtors_export_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess("Export completed");
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const response = await borrowersAPI.export("csv", {
        search: filters.search || undefined,
        includeDeleted: filters.status === "deleted" || filters.status === "all",
      });
      if (response.status && response.data?.data) {
        const csvData = typeof response.data.data === "string"
          ? response.data.data
          : JSON.stringify(response.data.data);
        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename || `all_debtors_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess("Export completed");
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Debtor Directory
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage all borrowers, their contact details, and outstanding debts
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
            onClick={reload}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportAll}
            disabled={exporting || debtors.length === 0}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Export all"
          >
            <Download className="w-4 h-4" />
          </button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={openAddForm}
          >
            Add Debtor
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <DebtorSummaryCards
          total={stats.total}
          active={stats.active}
          deleted={stats.deleted}
          withEmail={stats.withEmail}
          withContact={stats.withContact}
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
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      )}

      {/* Bulk Actions */}
      {selectedDebtors.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedDebtors.length}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={() => setSelectedDebtors([])}
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
          <DebtorTable
            debtors={debtors}
            selectedDebtors={selectedDebtors}
            onToggleSelect={toggleDebtorSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={openView}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onRestore={handleRestore}
          />

          {debtors.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No debtors found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your filters" : "Start by adding your first debtor"}
              </p>
              {!hasFilters && (
                <button
                  onClick={openAddForm}
                  className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  Add Debtor
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DebtorFormDialog
        isOpen={formOpen}
        mode={formMode}
        debtorId={editingDebtor?.id || null}
        initialData={editingDebtor}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
      <DebtorViewDialog
        debtorId={viewingDebtor?.id}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={() => {
          setViewOpen(false);
          openEditForm(viewingDebtor);
        }}
      />
    </div>
  );
};

export default DebtorDirectory;