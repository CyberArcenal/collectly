// src/renderer/api/hooks/useUserMutations.ts
import { useState } from 'react';
import type { User, UserFormData } from '../../users/types/user.types';
import { userService } from '../api/userService';

export const useUserMutations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: UserFormData): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);

      // Map UserFormData to UserCreateData
      const createData = {
        username: userData.username,
        email: userData.email,
        first_name: userData.display_name?.split(' ')[0] || '',
        last_name: userData.display_name?.split(' ').slice(1).join(' ') || '',
        password: userData.password || 'TemporaryPass123!',
        password_confirmation: userData.password || 'TemporaryPass123!',
        phone_number: userData.department || '',
        user_type: userData.roles?.[0] || 'viewer',
      };

      const user = await userService.createUser(createData);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: number, userData: Partial<UserFormData>): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);

      const updateData: any = {};
      if (userData.username) updateData.username = userData.username;
      if (userData.email) updateData.email = userData.email;
      if (userData.display_name) {
        updateData.first_name = userData.display_name.split(' ')[0] || '';
        updateData.last_name = userData.display_name.split(' ').slice(1).join(' ') || '';
      }
      if (userData.department) updateData.phone_number = userData.department;
      if (userData.roles && userData.roles.length > 0) {
        updateData.user_type = userData.roles[0];
      }
      if (userData.status) {
        // Map frontend status to API status
        const statusMap: Record<string, string> = {
          'active': 'active',
          'inactive': 'suspended',
          'suspended': 'suspended',
        };
        updateData.status = statusMap[userData.status] || 'active';
      }

      const user = await userService.updateUser(id, updateData);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.deleteUser(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (id: number, status: 'active' | 'restricted' | 'suspended'): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await userService.updateUserStatus(id, status);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserType = async (id: number, user_type: string): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await userService.updateUserType(id, user_type);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to update user type');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkUpdateUsers = async (ids: number[], action: 'activate' | 'deactivate' | 'delete'): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.bulkUpdateUsers(ids, action);
    } catch (err: any) {
      setError(err.message || 'Failed to perform bulk action');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: { old_password: string; new_password: string; new_password_confirmation: string }): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.changePassword(data);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    updateUserType,
    bulkUpdateUsers,
    changePassword,
  };
};