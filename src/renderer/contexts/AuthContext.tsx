// src/renderer/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authAPI from '../api/core/auth';
import type { User, LoginResult } from '../api/core/auth';
import tokenStorage from '../api/utils/tokenStorage';

// ============================================================
// TYPES
// ============================================================

export type UserRole = 'admin' | 'manager' | 'collector' | 'staff' | 'viewer';

export type Permission =
  | 'manage_users'
  | 'manage_settings'
  | 'view_reports'
  | 'manage_debts'
  | 'manage_payments'
  | 'manage_borrowers';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCollector: boolean;
  isStaff: boolean;
  isViewer: boolean;
}

// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ------------------------------------------------------------
  // Helper: Load user from token
  // ------------------------------------------------------------
  const loadUserFromToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await authAPI.verifyToken(token);
      if (response.status && response.data.valid) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Save user in tokenStorage as well
        await tokenStorage.setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to verify token:', error);
      return false;
    }
  }, []);

  // ------------------------------------------------------------
  // Init: Check for existing token on mount
  // ------------------------------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const accessToken = await tokenStorage.getAccessToken();
        if (accessToken) {
          const valid = await loadUserFromToken(accessToken);
          if (!valid) {
            // Token invalid or expired – try refresh
            const refreshed = await refreshToken();
            if (!refreshed) {
              await tokenStorage.clearTokens();
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          // No access token, check for refresh token
          const refresh = await tokenStorage.getRefreshToken();
          if (refresh) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              await tokenStorage.clearTokens();
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        await tokenStorage.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [loadUserFromToken]);

  // ------------------------------------------------------------
  // Login
  // ------------------------------------------------------------
  const login = async (email: string, password: string): Promise<LoginResult> => {
    const response = await authAPI.login({ email, password });
    if (response.status) {
      // If 2FA required, we don't set tokens yet – just return the response
      if ('requires_2fa' in response && response.requires_2fa) {
        return response; // Caller will handle 2FA flow
      }
      // Direct login success
      const loginResponse = response as {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: User;
      };
      await tokenStorage.setTokens(
        loginResponse.accessToken,
        loginResponse.refreshToken,
        loginResponse.expiresIn,
        loginResponse.user
      );
      setUser(loginResponse.user);
      setIsAuthenticated(true);
      return response;
    }
    throw new Error(response.message || 'Login failed');
  };

  // ------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------
  const logout = async (): Promise<void> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await tokenStorage.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // ------------------------------------------------------------
  // Refresh Token
  // ------------------------------------------------------------
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refresh = await tokenStorage.getRefreshToken();
      if (!refresh) return false;

      const response = await authAPI.refreshToken(refresh);
      if (response.status) {
        const { access, refresh: newRefresh } = response.data;
        // Update both tokens
        await tokenStorage.setTokens(access, newRefresh);
        // Re-verify the new access token to get user data
        const verified = await loadUserFromToken(access);
        return verified;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [loadUserFromToken]);

  // ------------------------------------------------------------
  // Role & Permission Helpers
  // ------------------------------------------------------------
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const allowed = Array.isArray(roles) ? roles : [roles];
      return allowed.includes(user.user_type as UserRole);
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      // Define permission -> role mapping
      const permissions: Record<Permission, UserRole[]> = {
        manage_users: ['admin'],
        manage_settings: ['admin', 'manager'],
        view_reports: ['admin', 'manager', 'collector'],
        manage_debts: ['admin', 'manager', 'collector', 'staff'],
        manage_payments: ['admin', 'manager', 'collector', 'staff'],
        manage_borrowers: ['admin', 'manager', 'collector', 'staff'],
      };
      const requiredRoles = permissions[permission] || [];
      return requiredRoles.some((role) => hasRole(role));
    },
    [user, hasRole]
  );

  // Convenience booleans
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isCollector = hasRole('collector');
  const isStaff = hasRole('staff');
  const isViewer = hasRole('viewer');

  // ============================================================
  // Context Value
  // ============================================================
  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    hasRole,
    hasPermission,
    isAdmin,
    isManager,
    isCollector,
    isStaff,
    isViewer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================
// HOOK
// ============================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;