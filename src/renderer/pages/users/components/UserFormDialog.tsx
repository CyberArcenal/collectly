// src/renderer/pages/users/components/UserFormDialog.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, User as UserIcon, Mail, Phone, Shield, Lock } from "lucide-react";
import { dialogs } from "../../../utils/dialogs";
import userAPI from "../../../api/core/user";
import type { User, UserCreateData, UserUpdateData } from "../../../api/core/user";

interface UserFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  userId: number | null;
  initialData: Partial<User> | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: string;
  status: string;
  password?: string;
};

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  mode,
  userId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { username: "", email: "", first_name: "", last_name: "", phone_number: "", user_type: "viewer", status: "active" },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          username: initialData.username || "",
          email: initialData.email || "",
          first_name: initialData.first_name || "",
          last_name: initialData.last_name || "",
          phone_number: initialData.phone_number || "",
          user_type: initialData.user_type || "viewer",
          status: initialData.status || "active",
        });
      } else {
        reset({ username: "", email: "", first_name: "", last_name: "", phone_number: "", user_type: "viewer", status: "active" });
      }
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === "add") {
        const createData: UserCreateData = {
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          password: data.password || "TempPass123!",
          password_confirmation: data.password || "TempPass123!",
          phone_number: data.phone_number,
          user_type: data.user_type,
        };
        await userAPI.create(createData);
        dialogs.success("User created successfully");
      } else {
        if (!userId) throw new Error("User ID missing");
        const updateData: UserUpdateData = {
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number,
          user_type: data.user_type,
          status: data.status as any,
        };
        await userAPI.update(userId, updateData);
        dialogs.success("User updated successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      dialogs.error(err.message || "Failed to save user");
    }
  };

  const userTypes = ["viewer", "customer", "staff", "collector", "manager", "admin"];
  const statuses = ["active", "restricted", "suspended"];

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
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[var(--primary-color)]" />
            {mode === "add" ? "Add New User" : "Edit User"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                <UserIcon className="w-3 h-3 inline mr-1" /> Username *
              </label>
              <input
                {...register("username", { required: "Username is required" })}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
              {errors.username && <p className="text-xs text-[var(--danger-color)] mt-1">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                <Mail className="w-3 h-3 inline mr-1" /> Email *
              </label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              />
              {errors.email && <p className="text-xs text-[var(--danger-color)] mt-1">{errors.email.message}</p>}
            </div>

            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                <Phone className="w-3 h-3 inline mr-1" /> Phone Number
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

            {/* Password (only for add) */}
            {mode === "add" && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  <Lock className="w-3 h-3 inline mr-1" /> Password *
                </label>
                <input
                  type="password"
                  {...register("password", { required: mode === "add" ? "Password is required" : false })}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
                {errors.password && <p className="text-xs text-[var(--danger-color)] mt-1">{errors.password.message}</p>}
              </div>
            )}

            {/* User Type */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                <Shield className="w-3 h-3 inline mr-1" /> User Type
              </label>
              <select
                {...register("user_type")}
                className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
              >
                {userTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Status (edit only) */}
            {mode === "edit" && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
                mode === "add" ? "Create User" : "Update User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormDialog;