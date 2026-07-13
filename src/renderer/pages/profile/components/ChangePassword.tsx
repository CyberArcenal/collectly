// src/renderer/pages/profile/components/ChangePassword.tsx
import React, { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import userAPI from "../../../api/core/user";
import { showSuccess, showError } from "../../../utils/notification";

type FormData = {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
};

const ChangePassword: React.FC = () => {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { isSubmitting, errors } } = useForm<FormData>();

  const newPassword = watch("new_password");

  const onSubmit = async (data: FormData) => {
    try {
      await userAPI.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      });
      showSuccess("Password changed successfully");
      reset();
    } catch (err: any) {
      showError("Password change failed", err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Lock className="w-4 h-4 text-[var(--primary-color)]" />
        Change Password
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Old Password */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              {...register("old_password", { required: "Current password is required" })}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] pr-10"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.old_password && <p className="text-xs text-[var(--danger-color)] mt-1">{errors.old_password.message}</p>}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              {...register("new_password", {
                required: "New password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" },
              })}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] pr-10"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.new_password && <p className="text-xs text-[var(--danger-color)] mt-1">{errors.new_password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              {...register("new_password_confirmation", {
                required: "Please confirm your password",
                validate: (value) => value === newPassword || "Passwords do not match",
              })}
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] pr-10"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.new_password_confirmation && (
            <p className="text-xs text-[var(--danger-color)] mt-1">{errors.new_password_confirmation.message}</p>
          )}
        </div>

        <div className="flex justify-end">
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
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;