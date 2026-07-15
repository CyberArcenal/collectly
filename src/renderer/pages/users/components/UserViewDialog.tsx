// src/renderer/pages/users/components/UserViewDialog.tsx
import React, { useState, useEffect, useCallback } from "react";
import { X, User, Mail, Phone, Calendar, Shield, AlertCircle, CheckCircle, Lock, Users } from "lucide-react";
import userAPI from "../../../api/core/user";
import type { User as UserType } from "../../../api/core/user";
import { formatDate } from "../../../utils/formatters";

interface UserViewDialogProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const UserViewDialog: React.FC<UserViewDialogProps> = ({ userId, isOpen, onClose, onEdit }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await userAPI.getById(userId);
      if (response.status) {
        setUser(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user details");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
    } else if (!isOpen) {
      setUser(null);
      setError(null);
    }
  }, [isOpen, userId, fetchUser]);

  if (!isOpen) return null;

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

  const statusBadge = user ? getStatusBadge(user.status) : getStatusBadge("active");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-2xl max-h-[90vh] shadow-xl border flex flex-col"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 truncate">
            <User className="w-4 h-4 text-[var(--primary-color)] flex-shrink-0" />
            {loading ? "Loading..." : user ? `${user.full_name || "User"}` : "User Details"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-[var(--danger-color)]">{error}</div>
          ) : user ? (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-[var(--text-primary)] truncate">
                    {user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] truncate">@{user.username}</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full mt-1 ${statusBadge.bg} ${statusBadge.text}`}>
                    {user.status === "active" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {user.status_display || user.status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                  <Mail className="w-4 h-4 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Email</p>
                    <p className="text-sm text-[var(--text-primary)]">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                  <Phone className="w-4 h-4 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-[var(--text-primary)]">{user.phone_number || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                  <Shield className="w-4 h-4 text-[var(--accent-amber)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">User Type</p>
                    <p className="text-sm text-[var(--text-primary)]">{user.user_type_display || user.user_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                  <Calendar className="w-4 h-4 text-[var(--accent-blue)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Created</p>
                    <p className="text-sm text-[var(--text-primary)]">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              {user.security_settings && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Lock className="w-3 h-3" /> Security Settings
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-secondary)]">2FA:</span>
                      <span className={user.security_settings.two_factor_enabled ? "text-[var(--success-color)]" : "text-[var(--text-tertiary)]"}>
                        {user.security_settings.two_factor_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-secondary)]">Recovery Email:</span>
                      <span className="text-[var(--text-primary)]">{user.security_settings.recovery_email || "Not set"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-secondary)]">New Device Alert:</span>
                      <span>{user.security_settings.alert_on_new_device ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--text-secondary)]">Failed Login Alert:</span>
                      <span>{user.security_settings.alert_on_failed_login ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-tertiary)]">No user data</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)] flex-shrink-0">
          {user && !user.deleted_at && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{ backgroundColor: "var(--primary-color)", color: "white" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-color)";
              }}
            >
              Edit User
            </button>
          )}
          <button
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserViewDialog;