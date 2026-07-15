// src/renderer/api/types/user.types.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  user_type: "viewer" | "customer" | "staff" | "collector" | "manager" | "admin";
  user_type_display: string;
  status: "active" | "restricted" | "suspended" | "deleted";
  status_display: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  is_restricted: boolean;
  is_suspended: boolean;
  is_admin: boolean;
  is_manager: boolean;
  security_settings?: {
    id: number;
    two_factor_enabled: boolean;
    recovery_email: string | null;
    recovery_phone: string | null;
    alert_on_new_device: boolean;
    alert_on_password_change: boolean;
    alert_on_failed_login: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface UserFilters {
  search?: string;
  user_type?: string;
  status?: string;
  role?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface UserCreateData {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  password_confirmation?: string;
  phone_number?: string;
  user_type?: string;
  avatar?: string;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user_type?: string;
  status?: "active" | "restricted" | "suspended" | "deleted";
  avatar?: string | null;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UserFormData {
  email: string;
  full_name: string;
  username: string;
  password?: string;
  user_type: string;
  status: 'active' | 'restricted' | 'suspended';
  phone_number?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}