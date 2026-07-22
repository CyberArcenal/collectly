// src/renderer/pages/debtors/group/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Layers, RefreshCw, Users } from "lucide-react";
import useDebtorGroups from "./hooks/useDebtorGroups";
import GroupList from "./components/GroupList";
import GroupMembers from "./components/GroupMembers";
import GroupFormDialog from "./components/GroupFormDialog";
import GroupSummaryCards from "./components/GroupSummaryCards";
import { dialogs } from "../../../utils/dialogs";
import DebtorViewDialog from "../components/DebtorViewDialog";
import { showError } from "../../../utils/notification";
import { usePagination } from "../../../contexts/PaginationContext";
import Pagination from "../../../components/UI/Pagination";

const DebtorGroupsPage: React.FC = () => {
  const {
    groups,
    loadingGroups,
    selectedGroup,
    setSelectedGroup,
    groupMembers,
    loadingMembers,
    membersPagination,
    membersCurrentPage,
    setMembersCurrentPage,
    membersPageSize,
    setMembersPageSize,
    availableDebtors,
    loadingDebtors,
    createGroupModalOpen,
    openCreateGroupModal,
    closeCreateGroupModal,
    editGroupModalOpen,
    editingGroup,
    groupsCurrentPage,
    groupsPageSize,
    groupsTotalItems,
    setGroupsCurrentPage,
    setGroupsPageSize,
    openEditGroupModal,
    closeEditGroupModal,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    assignDebtor,
    removeDebtor,
    bulkAssign,
    refresh,
    stats,
    loadingStats,
  } = useDebtorGroups();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingDebtor, setViewingDebtor] = useState<any>(null);
  const { setPagination, clearPagination } = usePagination();

  // --------------------------------------------
  // 1. GLOBAL PAGINATION for GROUPS (only when no group selected)
  // --------------------------------------------
  const handlePageChange = useCallback(
    (newPage: number) => setGroupsCurrentPage(newPage),
    [setGroupsCurrentPage]
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setGroupsPageSize(newSize);
      setGroupsCurrentPage(1);
    },
    [setGroupsPageSize, setGroupsCurrentPage]
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

  // 🔹 Show global pagination ONLY when NO group is selected
  useEffect(() => {
    if (!selectedGroup) {
      setPagination({
        currentPage: groupsCurrentPage,
        totalItems: groupsTotalItems,
        pageSize: groupsPageSize,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [5, 10, 25, 50],
        showPageSize: true,
      });
    } else {
      clearPagination(); // hide global pagination when a group is selected
    }
  }, [selectedGroup, groupsCurrentPage, groupsTotalItems, groupsPageSize, setPagination, clearPagination]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  // --------------------------------------------
  // 2. VIEW DEBTOR
  // --------------------------------------------
  const openView = async (debtor: any) => {
    if (!debtor.id) {
      showError("Ops! Something went wrong.");
      return;
    }
    setViewingDebtor(debtor);
    setViewOpen(true);
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--primary-color)]" />
            Debtor Groups / Segments
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Organize debtors into groups for targeted collections and reporting
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loadingGroups}
          className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${loadingGroups ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Summary Cards */}
      <GroupSummaryCards stats={stats} loading={loadingStats} />

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Left: Group List */}
        <div className="md:col-span-1 min-h-0">
          <GroupList
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            onAddGroup={openCreateGroupModal}
            onEditGroup={openEditGroupModal}
            onDeleteGroup={handleDeleteGroup}
            loading={loadingGroups}
          />
        </div>

        {/* Right: Group Members */}
        <div className="md:col-span-2 min-h-0 flex flex-col">
          {selectedGroup ? (
            <>
              <div className="flex-1 overflow-hidden">
                <GroupMembers
                  groupName={selectedGroup.name}
                  groupColor={selectedGroup.color}
                  members={groupMembers}
                  loading={loadingMembers}
                  availableDebtors={availableDebtors}
                  loadingDebtors={loadingDebtors}
                  onView={openView}
                  onAssign={assignDebtor}
                  onRemove={async (debtorId: number) => {
                    if (
                      await dialogs.confirm({
                        title: "Remove Member",
                        message:
                          "Are you sure you want to remove this member from the group?",
                      })
                    ) {
                      removeDebtor(debtorId);
                    }
                  }}
                  onBulkAssign={bulkAssign}
                  onRefresh={refresh}
                />
              </div>
              {/* 🔹 INLINE PAGINATION for MEMBERS (only when needed) */}
              {membersPagination.totalPages > 1 && (
                <div className="mt-3 flex-shrink-0">
                  <Pagination
                    variant="compact"
                    currentPage={membersCurrentPage}
                    totalItems={membersPagination.totalItems}
                    pageSize={membersPageSize}
                    onPageChange={setMembersCurrentPage}
                    onPageSizeChange={(size) => {
                      setMembersPageSize(size);
                      setMembersCurrentPage(1);
                    }}
                    pageSizeOptions={[5, 10, 25, 50]}
                    showPageSize={true}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center">
              <div className="text-center text-[var(--text-tertiary)]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No Group Selected</p>
                <p className="text-xs mt-1">
                  Select a group from the left panel to view its members
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <GroupFormDialog
        isOpen={createGroupModalOpen}
        mode="create"
        group={null}
        onClose={closeCreateGroupModal}
        onSubmit={handleCreateGroup}
      />
      <GroupFormDialog
        isOpen={editGroupModalOpen}
        mode="edit"
        group={editingGroup}
        onClose={closeEditGroupModal}
        onSubmit={(data) => {
          if (editingGroup) {
            return handleUpdateGroup(editingGroup.id, data);
          }
          return Promise.resolve();
        }}
      />

      <DebtorViewDialog
        debtorId={viewingDebtor?.id}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
};

export default DebtorGroupsPage;