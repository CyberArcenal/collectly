// src/renderer/layouts/Sidebar/components/SidebarMenuItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MenuItem } from '../types';

interface SidebarMenuItemProps {
  item: MenuItem;
  depth?: number;
  isActivePath: (path: string) => boolean;
  isDropdownActive: (items: MenuItem[]) => boolean;
  open?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  depth = 0,
  isActivePath,
  isDropdownActive,
  open = false,
  onToggle,
  onNavigate,
}) => {
  const hasChildren = !!item.children?.length;
  const Icon = item.icon;

  // Parent item (may children)
  if (hasChildren) {
    const isActive = isDropdownActive(item.children);
    return (
      <li className="mb-1">
        <div
          onClick={onToggle}
          className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-md'
              : 'text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle?.();
            }
          }}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={`w-5 h-5 ${
                isActive
                  ? 'text-white'
                  : 'text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]'
              }`}
            />
            <span className="font-medium">{item.name}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            } ${
              isActive
                ? 'text-white'
                : 'text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]'
            }`}
          />
        </div>
        {open && (
          <ul
            className="ml-4 mt-1 space-y-1 border-l-2 pl-3"
            style={{ borderColor: 'var(--primary-color)' }}
          >
            {item.children?.map((child) => (
              <SidebarMenuItem
                key={child.path}
                item={child}
                depth={depth + 1}
                isActivePath={isActivePath}
                isDropdownActive={isDropdownActive}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Leaf item (no children)
  const isActive = isActivePath(item.path);

  // Styling depends on depth: top-level (depth 0) vs child (depth > 0)
  const isTopLevel = depth === 0;

  const linkClasses = isTopLevel
    ? `group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-md'
          : 'text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]'
      }`
    : `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
        isActive
          ? 'text-[var(--primary-color)] bg-[var(--primary-color)]/10 font-semibold border-l-2 border-[var(--primary-color)] pl-2'
          : 'text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]'
      }`;

  const iconClasses = isTopLevel
    ? `w-5 h-5 ${
        isActive
          ? 'text-white'
          : 'text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]'
      }`
    : `w-4 h-4 ${
        isActive
          ? 'text-[var(--primary-color)]'
          : 'text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]'
      }`;

  return (
    <li className="mb-1">
      <Link to={item.path} onClick={onNavigate} className={linkClasses}>
        <div className="flex items-center gap-3">
          <Icon className={iconClasses} />
          <span className={isTopLevel ? 'font-medium' : ''}>{item.name}</span>
        </div>
        {isTopLevel && (
          <ChevronRight
            className={`w-4 h-4 transition-opacity duration-200 ${
              isActive
                ? 'opacity-100 text-white'
                : 'opacity-0 group-hover:opacity-50 text-[var(--sidebar-text)]'
            }`}
          />
        )}
      </Link>
    </li>
  );
};

export default SidebarMenuItem;