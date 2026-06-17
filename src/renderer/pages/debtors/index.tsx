// src/renderer/pages/debtors/index.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Users, RefreshCw } from "lucide-react";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showSuccess, showError } from "../../utils/notification";

import useDebtors from "./hooks/useDebtors";
import FilterBar from "./components/FilterBar";
import DebtorTable from "./components/DebtorTable";
import DebtorFormDialog from "./components/DebtorFormDialog";
import DebtorViewDialog from "./components/DebtorViewDialog";
import borrowersAPI from "../../api/core/borrower";
import { usePagination } from "../../contexts/PaginationContext";

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
  } = useDebtors();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingDebtor, setEditingDebtor] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingDebtor, setViewingDebtor] = useState<any>(null);

  const { setPagination, clearPagination } = usePagination();

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
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <div
      className="rounded-md shadow-md border p-4 m-1"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--sidebar-text)" }}>
            Debtor Directory
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage all borrowers, their contact details, and outstanding debts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reload}
            disabled={loading}
            className="px-3 py-2 rounded-md flex items-center gap-1 transition-all"
            style={{
              backgroundColor: "var(--card-secondary-bg)",
              color: "var(--sidebar-text)",
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Button onClick={openAddForm} variant="success" icon={Plus}>
            Add Debtor
          </Button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />

      {selectedDebtors.length > 0 && (
        <div
          className="mb-4 p-3 rounded-md flex items-center justify-between"
          style={{
            backgroundColor: "var(--accent-blue-light)",
            border: "1px solid var(--accent-blue)",
          }}
        >
          <span className="text-sm font-medium">
            {selectedDebtors.length} debtor(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Loading / Error */}
      {(loading || error) && (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-color)]"></div>
              <p className="text-sm text-[var(--text-secondary)]">Loading debtors...</p>
            </div>
          )}
          {error && (
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-red-500">Error: {error}</p>
              <button
                onClick={reload}
                className="mt-3 px-4 py-2 bg-[var(--primary-color)] text-white rounded-md text-sm"
              >
                Retry
              </button>
            </div>
          )}
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
            <div
              className="text-center py-12 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Users className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium">No debtors found</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {filters.search || filters.status !== "active"
                  ? "Try adjusting your filters"
                  : "Start by adding your first debtor"}
              </p>
              <div className="mt-4">
                <Button onClick={openAddForm} variant="primary">
                  Add Debtor
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <DebtorFormDialog
        isOpen={formOpen}
        mode={formMode}
        debtorId={editingDebtor?.id || null}
        initialData={editingDebtor}
        onClose={() => setFormOpen(false)}
        onSuccess={reload}
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