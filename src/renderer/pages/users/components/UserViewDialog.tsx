// src/renderer/pages/users/components/UserViewDialog.tsx
import React, { useState, useEffect, useCallback } from "react";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
import { User, Mail, Phone, Calendar, Shield, AlertCircle } from "lucide-react";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`User Profile: ${user ? user.full_name : 'Loading...'}`} size="lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : user ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="w-16 h-16 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.full_name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[var(--primary-color)]" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.full_name || `${user.first_name} ${user.last_name}`}</h3>
              <p className="text-sm text-[var(--text-secondary)]">@{user.username}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
              <Mail className="w-5 h-5 text-[var(--accent-blue)]" />
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
              <Phone className="w-5 h-5 text-[var(--accent-blue)]" />
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Phone</p>
                <p className="font-medium">{user.phone_number || "Not provided"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
              <Shield className="w-5 h-5 text-[var(--accent-amber)]" />
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">User Type</p>
                <p className="font-medium">{user.user_type_display || user.user_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)]">
              <AlertCircle className="w-5 h-5 text-[var(--accent-amber)]" />
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Status</p>
                <p className="font-medium">{user.status_display || user.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-[var(--card-secondary-bg)] md:col-span-2">
              <Calendar className="w-5 h-5 text-[var(--accent-blue)]" />
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">Created At</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>
          {user.security_settings && (
            <div className="p-3 rounded-md bg-[var(--card-secondary-bg)]">
              <h4 className="text-sm font-semibold mb-2">Security Settings</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>2FA: {user.security_settings.two_factor_enabled ? "Enabled" : "Disabled"}</span>
                <span>Recovery Email: {user.security_settings.recovery_email || "Not set"}</span>
                <span>Alert on new device: {user.security_settings.alert_on_new_device ? "Yes" : "No"}</span>
                <span>Alert on failed login: {user.security_settings.alert_on_failed_login ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--text-tertiary)]">No user data.</div>
      )}
      <div className="flex justify-end gap-2 pt-4 border-t mt-4" style={{ borderColor: "var(--border-color)" }}>
        {user && !user.deleted_at && onEdit && (
          <Button variant="primary" onClick={onEdit}>Edit User</Button>
        )}
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
};

export default UserViewDialog;