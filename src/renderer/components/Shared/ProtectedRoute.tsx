// src/renderer/components/Shared/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import type { UserRole } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole | UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const { isOfflineMode, isOnlineMode } = useSettings();
  const location = useLocation();

  // If offline mode, bypass authentication
  if (isOfflineMode()) {
    return <>{children}</>;
  }

  // If online mode, check authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary-color)]" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (roles && user) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const hasAccess = allowedRoles.some(role => user.user_type === role);
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};