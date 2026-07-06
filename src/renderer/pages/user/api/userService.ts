// src/renderer/api/userService.ts
import userAPI, { type ChangePasswordData, type User, type UserCreateData, type UserUpdateData } from "../../../api/core/user";
import type { PaginatedResponse, UserFilters } from "../../users/types/user.types";


/**
 * Map API user to frontend user format
 */
function mapAPIUserToUser(apiUser: any): User {
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email || '',
    first_name: apiUser.first_name || '',
    last_name: apiUser.last_name || '',
    full_name: apiUser.full_name || `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim(),
    avatar: apiUser.avatar || null,
    user_type: apiUser.user_type || 'viewer',
    user_type_display: apiUser.user_type_display || '',
    status: apiUser.status || 'active',
    status_display: apiUser.status_display || '',
    phone_number: apiUser.phone_number || '',
    created_at: apiUser.created_at,
    updated_at: apiUser.updated_at,
    is_restricted: apiUser.is_restricted || false,
    is_suspended: apiUser.is_suspended || false,
    is_admin: apiUser.is_admin || false,
    is_manager: apiUser.is_manager || false,
    security_settings: apiUser.security_settings,
  };
}

/**
 * Map frontend filters to API query params
 */
function mapFiltersToParams(filters?: UserFilters): Record<string, any> {
  const params: Record<string, any> = {};

  if (filters?.search) params.search = filters.search;
  if (filters?.user_type) params.user_type = filters.user_type;
  if (filters?.status) params.status = filters.status;
  if (filters?.page) params.page = filters.page;
  if (filters?.page_size) params.page_size = filters.page_size;

  // Handle role mapping (frontend uses 'role', API uses 'user_type')
  if (filters?.role) {
    // Map frontend role to API user_type if needed
    const roleMap: Record<string, string> = {
      'admin': 'admin',
      'manager': 'manager',
      'collector': 'collector',
      'staff': 'staff',
      'viewer': 'viewer',
      'customer': 'customer',
    };
    params.user_type = roleMap[filters.role] || filters.role;
  }

  return params;
}

class UserService {
  /**
   * Get paginated list of users
   */
  async getUsers(
    page: number = 1,
    pageSize: number = 20,
    filters?: UserFilters
  ): Promise<PaginatedResponse<User>> {
    try {
      const params = {
        page,
        page_size: pageSize,
        ...mapFiltersToParams(filters),
      };

      const response = await userAPI.getAll(params);

      return {
        data: response.data.map(mapAPIUserToUser),
        pagination: {
          page: response.pagination?.current_page || page,
          limit: response.pagination?.page_size || pageSize,
          total: response.pagination?.count || response.data.length,
          total_pages: response.pagination?.total_pages || 1,
        }
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id: number): Promise<User> {
    try {
      const response = await userAPI.getById(id);
      return mapAPIUserToUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: UserCreateData): Promise<User> {
    try {
      const response = await userAPI.create(data);
      return mapAPIUserToUser(response.data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async updateUser(id: number, data: UserUpdateData): Promise<User> {
    try {
      const response = await userAPI.update(id, data);
      return mapAPIUserToUser(response.data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Soft delete a user
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await userAPI.delete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      await userAPI.changePassword(data);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Update user status (active/restricted/suspended)
   */
  async updateUserStatus(id: number, status: 'active' | 'restricted' | 'suspended'): Promise<User> {
    try {
      const response = await userAPI.update(id, { status });
      return mapAPIUserToUser(response.data);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Update user type/role
   */
  async updateUserType(id: number, user_type: string): Promise<User> {
    try {
      const response = await userAPI.update(id, { user_type });
      return mapAPIUserToUser(response.data);
    } catch (error) {
      console.error('Error updating user type:', error);
      throw error;
    }
  }

  /**
   * Bulk update users status
   */
  async bulkUpdateUsers(ids: number[], action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    try {
      // Map action to status
      const statusMap: Record<string, string> = {
        'activate': 'active',
        'deactivate': 'suspended',
      };

      if (action === 'delete') {
        // Soft delete each user
        for (const id of ids) {
          await this.deleteUser(id);
        }
      } else {
        const status = statusMap[action] || 'active';
        for (const id of ids) {
          await this.updateUserStatus(id, status as any);
        }
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }
}

export const userService = new UserService();