// src/renderer/pages/debtors/group/components/GroupList.tsx
import React from "react";
import { Plus, Edit, Trash2, Layers, Users, ChevronRight } from "lucide-react";
import type { DebtorGroup } from "../types";

interface GroupListProps {
  groups: DebtorGroup[];
  selectedGroup: DebtorGroup | null;
  onSelectGroup: (group: DebtorGroup) => void;
  onAddGroup: () => void;
  onEditGroup: (group: DebtorGroup) => void;
  onDeleteGroup: (id: number) => void;
  loading: boolean;
}

const GroupList: React.FC<GroupListProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  loading,
}) => {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] h-full flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-color)]">
        <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          Groups
          <span className="text-[var(--text-tertiary)] font-normal ml-1">
            ({groups.length})
          </span>
        </h3>
        <button
          onClick={onAddGroup}
          className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--primary-color)]"
          title="Add Group"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-[var(--primary-color)] border-t-transparent rounded-full" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No groups yet</p>
            <p className="text-xs mt-0.5">Click + to create one</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {groups.map((group) => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <li
                  key={group.id}
                  className={`group-item rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[var(--primary-color)]/10 border-l-3 border-l-[var(--primary-color)]"
                      : "hover:bg-[var(--card-hover-bg)]"
                  }`}
                  style={{
                    borderLeft: isSelected
                      ? `3px solid var(--primary-color)`
                      : "3px solid transparent",
                  }}
                  onClick={() => onSelectGroup(group)}
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color || "#3b82f6" }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {group.name}
                        </div>
                        {group.description && (
                          <div className="text-xs text-[var(--text-tertiary)] truncate">
                            {group.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGroup(group);
                        }}
                        className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] hover:text-yellow-500"
                        title="Edit group"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGroup(group.id);
                        }}
                        className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--danger-color)]"
                        title="Delete group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isSelected && (
                        <ChevronRight className="w-4 h-4 text-[var(--primary-color)]" />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GroupList;
