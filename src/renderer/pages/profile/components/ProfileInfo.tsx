// src/renderer/pages/profile/components/ProfileInfo.tsx
import React, { useState } from "react";
import { Mail, Phone, Shield, Save, X, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import type { User } from "../../../api/core/auth";
import userAPI from "../../../api/core/user";
import { showSuccess, showError } from "../../../utils/notification";
import { dialogs } from "../../../utils/dialogs";

interface ProfileInfoProps {
  user: User;
  onUpdate: () => void;
}

type FormData = {
  first_name: string;
  last_name: string;
  phone_number: string;
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await userAPI.update(user.id, {
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
      });
      showSuccess("Profile updated successfully");
      onUpdate();
      setIsEditing(false);
    } catch (err: any) {
      showError("Update failed", err.message);
    }
  };

  const fullName = user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Avatar and basic info */}
      <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-2xl font-bold shadow-md">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{fullName}</h2>
          <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> {user.email}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Shield className="w-3 h-3" />
              {user.user_type_display || user.user_type}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              user.status === "active"
                ? "bg-[var(--status-success-bg)] text-[var(--status-success-text)]"
                : "bg-[var(--status-inactive-bg)] text-[var(--status-inactive-text)]"
            }`}>
              {user.status_display || user.status}
            </span>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: "var(--card-secondary-bg)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--card-hover-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--card-secondary-bg)"}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {/* Edit form */}
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                {...register("first_name")}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                {...register("last_name")}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              {...register("phone_number")}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                reset();
              }}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: "var(--btn-secondary-bg)",
                color: "var(--btn-secondary-text)",
                border: "1px solid var(--btn-secondary-border)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)"}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: "var(--primary-color)" }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "var(--primary-hover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--primary-color)";
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">First Name</p>
            <p className="text-[var(--text-primary)] font-medium">{user.first_name || "—"}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Last Name</p>
            <p className="text-[var(--text-primary)] font-medium">{user.last_name || "—"}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Phone</p>
            <p className="text-[var(--text-primary)] font-medium">{user.phone_number || "—"}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--card-secondary-bg)" }}>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Username</p>
            <p className="text-[var(--text-primary)] font-medium">@{user.username}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;