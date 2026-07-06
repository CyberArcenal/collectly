// src/renderer/pages/users/components/UserTable.tsx
import React from "react";
import type { User } from "../../../api/core/user";
import { formatDate } from "../../../utils/formatters";
import { Eye, Edit, Trash2, RefreshCw, User as UserIcon, Mail, Phone } from "lucide-react";

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-500";
      case "restricted": return "bg-yellow-500/20 text-yellow-500";
      case "suspended": return "bg-red-500/20 text-red-500";
      case "deleted": return "bg-gray-500/20 text-gray-400";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getUserTypeDisplay = (type: string) => {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Unknown";
  };

  return (
    <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--border-color)" }}>
      <table className="min-w-full">
        <thead style={{ backgroundColor: "var(--card-secondary-bg)" }}>
          <tr>
            <th className="w-10 px-2 py-3 text-left">
              <input
                type="checkbox"
                checked={users.length > 0 && selectedUsers.length === users.length}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded"
                style={{ accentColor: "var(--primary-color)" }}
              />
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("full_name")}
            >
              <div className="flex items-center gap-1">User</div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("user_type")}
            >
              <div className="flex items-center gap-1">Type</div>
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer"
              onClick={() => onSort("status")}
            >
              <div className="flex items-center gap-1">Status</div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer" onClick={() => onSort("created_at")}>
              <div className="flex items-center gap-1">Created</div>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              onClick={() => onView(user)}
              className="hover:bg-[var(--card-hover-bg)] transition-colors border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <td className="px-2 py-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => { e.stopPropagation(); onToggleSelect(user.id); }}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--primary-color)" }}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-[var(--primary-color)]" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{user.full_name || `${user.first_name} ${user.last_name}`}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">@{user.username}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs bg-[var(--card-secondary-bg)]">
                  {getUserTypeDisplay(user.user_type)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(user.status)}`}>
                  {user.status_display || user.status}
                </span>
              </td>
              <td className="px-4 py-3">{user.phone_number || "—"}</td>
              <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{formatDate(user.created_at)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(user); }}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-[var(--accent-blue)]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(user); }}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-[var(--accent-amber)]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(user); }}
                    className={`p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors ${
                      user.status === "active" || user.status === "restricted"
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                    title={user.status === "active" || user.status === "restricted" ? "Suspend" : "Activate"}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(user); }}
                    className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--danger-color)]" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;