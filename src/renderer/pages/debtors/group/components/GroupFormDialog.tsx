// src/renderer/pages/debtors/group/components/GroupFormDialog.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import type { DebtorGroup } from "../types";

interface GroupFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  group: DebtorGroup | null;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => Promise<void> | void;
}

const presetColors = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#dc2626", // Red
  "#8b5cf6", // Purple
  "#ec4898", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#84cc16", // Lime
];

const GroupFormDialog: React.FC<GroupFormDialogProps> = ({
  isOpen,
  mode,
  group,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", description: "", color: "#3b82f6" },
  });

  const selectedColor = watch("color");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && group) {
        reset({
          name: group.name,
          description: group.description || "",
          color: group.color || "#3b82f6",
        });
      } else {
        reset({ name: "", description: "", color: "#3b82f6" });
      }
    }
  }, [isOpen, mode, group, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: { name: string; description: string; color: string }) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-md shadow-xl border"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {mode === "create" ? "Create New Group" : "Edit Group"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Group Name *
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              placeholder="e.g., VIP Borrowers"
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
            {errors.name && (
              <p className="text-xs text-[var(--danger-color)] mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Brief description of this group..."
              className="w-full px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    selectedColor === c
                      ? "border-[var(--primary-color)] ring-2 ring-offset-1 ring-[var(--primary-color)]"
                      : "border-transparent hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setValue("color", c)}
                />
              ))}
              <div className="relative">
                <input
                  {...register("color")}
                  type="color"
                  className="w-7 h-7 rounded-full border border-[var(--border-color)] cursor-pointer p-0"
                />
              </div>
            </div>
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
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
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
                <span className="flex items-center gap-1.5">
                  <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </span>
              ) : mode === "create" ? (
                "Create Group"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupFormDialog;