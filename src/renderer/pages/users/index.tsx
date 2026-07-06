// src/renderer/pages/users/index.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Users, RefreshCw } from "lucide-react";
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
  } = useUsers();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);

  const { setPagination, clearPagination } = usePagination();

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--sidebar-text)" }}>
            User Management
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage system users, roles, and permissions
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
            Add User
          </Button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />

      {selectedUsers.length > 0 && (
        <div
          className="mb-4 p-3 rounded-md flex items-center justify-between"
          style={{
            backgroundColor: "var(--accent-blue-light)",
            border: "1px solid var(--accent-blue)",
          }}
        >
          <span className="text-sm font-medium">
            {selectedUsers.length} user(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Delete Selected
          </button>
        </div>
      )}

      {(loading || error) && (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-color)]"></div>
              <p className="text-sm text-[var(--text-secondary)]">Loading users...</p>
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
            <div
              className="text-center py-12 border rounded-md"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Users className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {filters.search || filters.user_type || filters.status
                  ? "Try adjusting your filters"
                  : "Start by adding your first user"}
              </p>
              <div className="mt-4">
                <Button onClick={openAddForm} variant="primary">
                  Add User
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <UserFormDialog
        isOpen={formOpen}
        mode={formMode}
        userId={editingUser?.id || null}
        initialData={editingUser}
        onClose={() => setFormOpen(false)}
        onSuccess={reload}
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