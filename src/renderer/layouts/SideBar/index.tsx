// src/renderer/layouts/Sidebar/Sidebar.tsx
import React, { useCallback } from 'react';
import SidebarHeader from './components/SidebarHeader';
import SidebarNav from './components/SidebarNav';
import SidebarStats from './components/SidebarStats';
import SidebarFooter from './components/SidebarFooter';
import { useSidebarStats } from './hooks/useSidebarStats';
import { useSidebarState } from './hooks/useSidebarState';
import { useMenuItems } from './hooks/useMenuItems';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { menuItems, groupedItems, categories } = useMenuItems();
  const { openDropdowns, toggleDropdown, isActivePath, isDropdownActive } =
    useSidebarState(menuItems);
  const { stats, loading } = useSidebarStats();

  const handleNavigate = useCallback(() => {
    // if (onClose) onClose();
  }, [onClose]);

  return (
    <div
      className={`
        fixed md:relative flex flex-col h-screen bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]
        shadow-lg transition-all duration-300 ease-in-out overflow-hidden
        ${isOpen ? 'w-64' : 'w-0'}
      `}
    >
      <SidebarHeader />
      <SidebarNav
        groupedItems={groupedItems}
        categories={categories}
        openDropdowns={openDropdowns}
        toggleDropdown={toggleDropdown}
        isActivePath={isActivePath}
        isDropdownActive={isDropdownActive}
        onNavigate={handleNavigate}
      />
      <SidebarStats stats={stats} loading={loading} />
      <SidebarFooter onNavigate={handleNavigate} />
    </div>
  );
};

export default Sidebar;