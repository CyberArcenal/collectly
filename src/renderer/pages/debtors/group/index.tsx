// src/renderer/pages/debtors/group/index.tsx
import React, { useState } from "react";
import { Layers, RefreshCw, Users } from "lucide-react";
import useDebtorGroups from "./hooks/useDebtorGroups";
import GroupList from "./components/GroupList";
import GroupMembers from "./components/GroupMembers";
import GroupFormDialog from "./components/GroupFormDialog";
import { dialogs } from "../../../utils/dialogs";
import DebtorViewDialog from "../components/DebtorViewDialog";
import DebtorFormDialog from "../components/DebtorFormDialog";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";

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
    openEditGroupModal,
    closeEditGroupModal,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    assignDebtor,
    removeDebtor,
    bulkAssign,
    refresh,
  } = useDebtorGroups();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingDebtor, setViewingDebtor] = useState<any>(null);

  const openView = (debtor: any) => {
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
          <RefreshCw className={`w-4 h-4 ${loadingGroups ? "animate-spin" : ""}`} />
        </button>
      </div>

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
                        message: "Are you sure you want to remove this member from the group?",
                      })
                    ) {
                      removeDebtor(debtorId);
                    }
                  }}
                  onBulkAssign={bulkAssign}
                  onRefresh={refresh}
                />
              </div>
              {/* Pagination for members */}
              {membersPagination.totalPages > 1 && (
                <div className="mt-3 flex-shrink-0">
                  {/* Will use the global pagination or inline */}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] flex items-center justify-center">
              <div className="text-center text-[var(--text-tertiary)]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No Group Selected</p>
                <p className="text-xs mt-1">Select a group from the left panel to view its members</p>
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
          // Return a resolved promise or just return undefined
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