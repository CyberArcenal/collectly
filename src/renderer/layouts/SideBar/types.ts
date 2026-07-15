// src/renderer/layouts/Sidebar/types.ts
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../../contexts/AuthContext';

export interface MenuItem {
  path: string;
  name: string;
  icon: LucideIcon;
  category?: 'core' | 'analytics' | 'system';
  roles?: UserRole | UserRole[];
  children?: MenuItem[];
  hidden?: boolean;
}

export interface SidebarStats {
  totalOutstanding: number;
  overdueAmount: number;
  collectionRate: number;
  activeDebtors: number;
}

export interface SidebarState {
  openDropdowns: Record<string, boolean>;
  isOpen: boolean;
}

export interface SidebarContextValue {
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openDropdowns: Record<string, boolean>;
  toggleDropdown: (name: string) => void;
  isActivePath: (path: string) => boolean;
  isDropdownActive: (items: MenuItem[]) => boolean;
}