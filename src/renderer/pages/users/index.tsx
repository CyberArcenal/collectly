// src/renderer/pages/users/index.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Users, RefreshCw, Filter, Eye, EyeOff, Download, X } from "lucide-react";
import Button from "../../components/UI/Button";
import { dialogs } from "../../utils/dialogs";
import { showSuccess, showError } from "../../utils/notification";

import useUsers from "./hooks/useUsers";
import FilterBar from "./components/FilterBar";
import UserTable from "./components/UserTable";
import UserFormDialog from "./components/UserFormDialog";
import UserViewDialog from "./components/UserViewDialog";
import userAPI from "../../api/core/user";
import { usePagination } from "../../contexts/PaginationContext";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import BulkActionsBar from "./components/BulkActionsBar";
import UserSummaryCards from "./components/UserSummaryCards";

const UserManagement: React.FC = () => {
  const {
    users,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    filters,
    selectedUsers,
    setSelectedUsers,
    sortConfig,
    setPageSize,
    setCurrentPage,
    reload,
    handleFilterChange,
    resetFilters,
    toggleUserSelection,
    toggleSelectAll,
    handleSort,
    stats,
    fetchStats,
    exportUsers,
  } = useUsers();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { setPagination, clearPagination } = usePagination();

  const hasFilters = !!(filters.search || filters.user_type || filters.status);

  const handlePageChange = useCallback((newPage: number) => setCurrentPage(newPage), [setCurrentPage]);
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, [setPageSize, setCurrentPage]);

  const handlersRef = useRef({ onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange });
  useEffect(() => {
    handlersRef.current = { onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange };
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

  const openAddForm = () => {
    setFormMode("add");
    setEditingUser(null);
    setFormOpen(true);
  };

  const openEditForm = (user: any) => {
    setFormMode("edit");
    setEditingUser(user);
    setFormOpen(true);
  };

  const openView = (user: any) => {
    setViewingUser(user);
    setViewOpen(true);
  };

  const handleDelete = async (user: any) => {
    const confirmed = await dialogs.confirm({
      title: "Delete User",
      message: `Are you sure you want to delete ${user.full_name || user.username}? This action can be reversed.`,
    });
    if (!confirmed) return;
    try {
      await userAPI.delete(user.id);
      showSuccess("User deleted successfully");
      reload();
      fetchStats();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const statusMap: Record<string, string> = {
        active: "suspended",
        restricted: "active",
        suspended: "active",
      };
      const newStatus = statusMap[user.status] || "active";
      await userAPI.update(user.id, { status: newStatus });
      showSuccess(`User status updated to ${newStatus}`);
      reload();
      fetchStats();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    const confirmed = await dialogs.confirm({
      title: "Bulk Delete",
      message: `Delete ${selectedUsers.length} users?`,
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedUsers.map((id) => userAPI.delete(id)));
      showSuccess(`${selectedUsers.length} users deleted`);
      setSelectedUsers([]);
      reload();
      fetchStats();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleBulkExport = async () => {
    if (selectedUsers.length === 0) return;
    setExporting(true);
    try {
      await exportUsers(selectedUsers);
      setSelectedUsers([]);
    } catch (err: any) {
      showError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      await exportUsers();
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
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--primary-color)]" />
            User Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage system users, roles, and permissions
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
            disabled={exporting || users.length === 0}
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
          <Button onClick={openAddForm} variant="primary" size="sm" icon={Plus}>
            Add User
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <UserSummaryCards
          total={stats.total}
          active={stats.active}
          suspended={stats.suspended}
          admin={stats.admin}
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
            onReset={resetFilters}
          />
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedUsers.length}
          onDelete={handleBulkDelete}
          onExport={handleBulkExport}
          onClearSelection={() => setSelectedUsers([])}
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

      {/* Content */}
      {!loading && !error && (
        <>
          <UserTable
            users={users}
            selectedUsers={selectedUsers}
            onToggleSelect={toggleUserSelection}
            onToggleSelectAll={toggleSelectAll}
            onSort={handleSort}
            sortConfig={sortConfig}
            onView={openView}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />

          {users.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p>No users found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hasFilters ? "Try adjusting your filters" : "Start by adding your first user"}
              </p>
              {!hasFilters && (
                <button
                  onClick={openAddForm}
                  className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  Add User
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <UserFormDialog
        isOpen={formOpen}
        mode={formMode}
        userId={editingUser?.id || null}
        initialData={editingUser}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          reload();
          fetchStats();
        }}
      />
      <UserViewDialog
        userId={viewingUser?.id}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={() => {
          setViewOpen(false);
          openEditForm(viewingUser);
        }}
      />
    </div>
  );
};

export default UserManagement;