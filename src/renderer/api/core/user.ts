// src/renderer/api/user.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface User {
  deleted_at: any;
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

export interface UserCreateData {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  password_confirmation?: string;
  phone_number?: string;
  user_type?: string;
  avatar?: string; // base64 image
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user_type?: string;
  status?: string;
  avatar?: string | null;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface UserResponse {
  status: boolean;
  message: string;
  data: User;
}

export interface UsersResponse {
  status: boolean;
  message: string;
  pagination?: {
    next: string | null;
    previous: string | null;
    count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
  };
  data: User[];
}

export interface DeleteUserResponse {
  status: boolean;
  message: string;
  data: null;
}

export interface ChangePasswordResponse {
  status: boolean;
  message: string;
  data: null;
}

// ----------------------------------------------------------------------
// 🧠 UserAPI Class (Online-Only)
// ----------------------------------------------------------------------

class UserAPI {
  /**
   * Ensure the user IPC is available
   */
  private async call(method: string, params: any = {}): Promise<any> {
    if (!window.backendAPI?.user) {
      throw new Error("Electron API (user) not available");
    }
    const response = await window.backendAPI.user({ method, params });
    return response;
  }

  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get paginated list of users
   * @param params.page - Page number
   * @param params.page_size - Items per page
   */
  async getAll(params?: { page?: number; page_size?: number }): Promise<UsersResponse> {
    const response = await this.call("getAllUsers", params || {});
    return response;
  }

  /**
   * Get a single user by ID
   * @param id - User ID
   */
  async getById(id: number): Promise<UserResponse> {
    const response = await this.call("getUserById", { id });
    return response;
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Create a new user
   * @param data - UserCreateData
   */
  async create(data: UserCreateData): Promise<UserResponse> {
    const response = await this.call("createUser", { data });
    return response;
  }

  /**
   * Update an existing user (full or partial)
   * @param id - User ID
   * @param data - UserUpdateData
   */
  async update(id: number, data: UserUpdateData): Promise<UserResponse> {
    const response = await this.call("updateUser", { id, data });
    return response;
  }

  /**
   * Soft delete a user
   * @param id - User ID
   */
  async delete(id: number): Promise<DeleteUserResponse> {
    const response = await this.call("deleteUser", { id });
    return response;
  }

  /**
   * Change user password
   * @param data - ChangePasswordData
   */
  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    const response = await this.call("changePassword", { data });
    return response;
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.user);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const userAPI = new UserAPI();
export default userAPI;