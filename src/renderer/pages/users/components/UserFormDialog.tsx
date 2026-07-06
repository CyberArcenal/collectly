// src/renderer/pages/users/components/UserFormDialog.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "../../../components/UI/Modal";
import Button from "../../../components/UI/Button";
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
      reset();
    }
  }, [initialData, reset]);

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
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "Add New User" : "Edit User"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Username *
            </label>
            <input
              {...register("username", { required: "Username is required" })}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Email *
            </label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              First Name
            </label>
            <input
              {...register("first_name")}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Last Name
            </label>
            <input
              {...register("last_name")}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Phone Number
            </label>
            <input
              {...register("phone_number")}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              User Type
            </label>
            <select
              {...register("user_type")}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            >
              {userTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 border rounded-md"
              style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
          {mode === "add" && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--sidebar-text)" }}>
                Password *
              </label>
              <input
                type="password"
                {...register("password", { required: mode === "add" ? "Password is required" : false })}
                className="w-full px-3 py-2 border rounded-md"
                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--sidebar-text)" }}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="success" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "add" ? "Create User" : "Update User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormDialog;