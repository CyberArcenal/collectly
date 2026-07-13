// src/renderer/pages/debtors/group/components/GroupMembers.tsx
import React, { useState } from "react";
import {
  User,
  X,
  UserPlus,
  CheckSquare,
  Square,
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import type { GroupMemberWithDebtor } from "../../../../api/core/group";
import type { Borrower } from "../../../../api/core/borrower";

interface GroupMembersProps {
  groupName: string;
  groupColor?: string;
  members: GroupMemberWithDebtor[];
  loading: boolean;
  availableDebtors: Borrower[];
  loadingDebtors: boolean;
  onView: (debtor: any) => void;
  onAssign: (debtorId: number) => void;
  onRemove: (debtorId: number) => void;
  onBulkAssign: (debtorIds: number[]) => void;
  onRefresh: () => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const GroupMembers: React.FC<GroupMembersProps> = ({
  groupName,
  groupColor = "#3b82f6",
  members,
  loading,
  availableDebtors,
  loadingDebtors,
  onView,
  onAssign,
  onRemove,
  onBulkAssign,
  onRefresh,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDebtorIds, setSelectedDebtorIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const memberIds = new Set(members.map((m) => m.debtorId));

  const filteredAvailable = availableDebtors.filter(
    (d) =>
      !memberIds.has(d.id) &&
      (d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.contact && d.contact.includes(searchTerm)))
  );

  const toggleDebtorSelection = (id: number) => {
    setSelectedDebtorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDebtorIds.length === filteredAvailable.length) {
      setSelectedDebtorIds([]);
    } else {
      setSelectedDebtorIds(filteredAvailable.map((d) => d.id));
    }
  };

  const handleBulkAssign = () => {
    if (selectedDebtorIds.length === 0) return;
    onBulkAssign(selectedDebtorIds);
    setSelectedDebtorIds([]);
    setShowAssignModal(false);
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] h-full flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: groupColor }}
          />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {groupName}
          </h3>
          <span className="text-xs text-[var(--text-tertiary)] bg-[var(--card-secondary-bg)] px-2 py-0.5 rounded-full">
            {members.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1"
            style={{ backgroundColor: "var(--primary-color)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-color)";
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-[var(--primary-color)] border-t-transparent rounded-full" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No members in this group</p>
            <p className="text-xs mt-0.5">Click "Assign" to add debtors</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {members.map((member) => (
              <li
                key={member.debtorId}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer group"
                onClick={() => onView({ id: member.debtorId })}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                    {getInitials(member.debtor.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {member.debtor.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                      {member.debtor.email && (
                        <span className="flex items-center gap-0.5">
                          <Mail className="w-2.5 h-2.5" />
                          {member.debtor.email}
                        </span>
                      )}
                      {member.debtor.contact && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          {member.debtor.contact}
                        </span>
                      )}
                      {!member.debtor.email && !member.debtor.contact && (
                        <span>No contact info</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(member.debtorId);
                  }}
                  className="p-1 rounded hover:bg-[var(--danger-color)]/10 transition-colors text-[var(--text-tertiary)] hover:text-[var(--danger-color)] opacity-0 group-hover:opacity-100"
                  title="Remove from group"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl w-full max-w-md max-h-[90vh] shadow-xl border flex flex-col"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[var(--primary-color)]" />
                Assign Debtors to {groupName}
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden p-4">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search debtors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Select All */}
              {filteredAvailable.length > 0 && (
                <div className="flex items-center gap-2 px-1 py-1.5 border-b border-[var(--border-color)] mb-1">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {selectedDebtorIds.length === filteredAvailable.length ? (
                      <CheckSquare className="w-4 h-4 text-[var(--primary-color)]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Select All
                  </button>
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    ({selectedDebtorIds.length}/{filteredAvailable.length})
                  </span>
                </div>
              )}

              {/* Debtor List */}
              <div className="max-h-60 overflow-y-auto space-y-1">
                {loadingDebtors ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin h-5 w-5 border-2 border-[var(--primary-color)] border-t-transparent rounded-full" />
                  </div>
                ) : filteredAvailable.length === 0 ? (
                  <div className="text-center py-6 text-[var(--text-tertiary)]">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No unassigned debtors found</p>
                    <p className="text-xs mt-0.5">
                      {searchTerm ? "Try a different search term" : "All debtors are already in this group"}
                    </p>
                  </div>
                ) : (
                  filteredAvailable.map((debtor) => (
                    <div
                      key={debtor.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                      onClick={() => toggleDebtorSelection(debtor.id)}
                    >
                      <button onClick={(e) => { e.stopPropagation(); toggleDebtorSelection(debtor.id); }}>
                        {selectedDebtorIds.includes(debtor.id) ? (
                          <CheckSquare className="w-4 h-4 text-[var(--primary-color)]" />
                        ) : (
                          <Square className="w-4 h-4 text-[var(--text-tertiary)]" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {debtor.name}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] truncate">
                          {debtor.email || debtor.contact || "No contact info"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowAssignModal(false)}
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
                onClick={handleBulkAssign}
                disabled={selectedDebtorIds.length === 0}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--primary-color)",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = "var(--primary-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-color)";
                }}
              >
                Assign {selectedDebtorIds.length > 0 ? `(${selectedDebtorIds.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMembers;