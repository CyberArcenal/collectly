// src/renderer/pages/users/components/UserTable.tsx
import React from "react";
import type { User } from "../../../api/core/user";
import { formatDate } from "../../../utils/formatters";
import { Eye, Edit, Trash2, RefreshCw, User as UserIcon, Mail, Phone, Shield, Calendar } from "lucide-react";

interface UserTableProps {
  users: User[];
  selectedUsers: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return { bg: "bg-[var(--status-success-bg)]", text: "text-[var(--status-success-text)]" };
    case "restricted":
      return { bg: "bg-[var(--status-partial-bg)]", text: "text-[var(--status-partial-text)]" };
    case "suspended":
      return { bg: "bg-[var(--status-overdue-bg)]", text: "text-[var(--status-overdue-text)]" };
    case "deleted":
      return { bg: "bg-[var(--status-inactive-bg)]", text: "text-[var(--status-inactive-text)]" };
    default:
      return { bg: "bg-[var(--status-inactive-bg)]", text: "text-[var(--status-inactive-text)]" };
  }
};

const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortConfig,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && !allSelected;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="py-2.5 px-3 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={onToggleSelectAll}
                className="rounded border-[var(--border-color)] cursor-pointer"
              />
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("full_name")}
            >
              <div className="flex items-center gap-1">User</div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("user_type")}
            >
              <div className="flex items-center gap-1">Type</div>
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("status")}
            >
              <div className="flex items-center gap-1">Status</div>
            </th>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Contact
            </th>
            <th
              className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider cursor-pointer hover:text-[var(--primary-color)]"
              onClick={() => onSort("created_at")}
            >
              <div className="flex items-center gap-1">Created</div>
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const statusBadge = getStatusBadge(user.status);
            const fullName = user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;

            return (
              <tr
                key={user.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer"
                onClick={() => onView(user)}
              >
                <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onToggleSelect(user.id)}
                    className="rounded border-[var(--border-color)] cursor-pointer"
                  />
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                      {getInitials(fullName)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text-primary)] text-sm truncate max-w-[120px]">
                        {fullName}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                        <Mail className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[100px]">{user.email}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--card-secondary-bg)] text-[var(--text-secondary)]">
                    {user.user_type_display || user.user_type}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 text-[10px] rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                    {user.status_display || user.status}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="text-sm text-[var(--text-secondary)]">
                    {user.phone_number || (
                      <span className="text-[var(--text-tertiary)] text-xs">No phone</span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {formatDate(user.created_at)}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => onView(user)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-yellow-500" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(user)}
                      className={`p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors ${
                        user.status === "active" || user.status === "restricted"
                          ? "text-[var(--warning-color)]"
                          : "text-[var(--success-color)]"
                      }`}
                      title={user.status === "active" || user.status === "restricted" ? "Suspend" : "Activate"}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--danger-color)]" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;