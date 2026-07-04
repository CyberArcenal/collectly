// src/renderer/layouts/Sidebar/components/SidebarMenuItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MenuItem } from '../types';

interface SidebarMenuItemProps {
  item: MenuItem;
  isActive: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  depth?: number;
  onNavigate?: () => void;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  isActive,
  isOpen = false,
  onToggle,
  depth = 0,
  onNavigate,
}) => {
  const hasChildren = !!item.children?.length;
  const Icon = item.icon;
  const paddingLeft = depth > 0 ? `pl-${depth * 3}` : '';

  if (hasChildren) {
    return (
      <li className="mb-1">
        <div
          onClick={onToggle}
          className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-md'
              : 'text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]'
          } ${paddingLeft}`}
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
              isOpen ? 'rotate-180' : ''
            } ${
              isActive
                ? 'text-white'
                : 'text-[var(--sidebar-text)] group-hover:text-[var(--primary-color)]'
            }`}
          />
        </div>
        {isOpen && (
          <ul
            className="ml-4 mt-1 space-y-1 border-l-2 pl-3"
            style={{ borderColor: 'var(--primary-color)' }}
          >
            {item.children?.map((child) => (
              <SidebarMenuItem
                key={child.path}
                item={child}
                isActive={false}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li className="mb-1">
      <Link
        to={item.path}
        onClick={onNavigate}
        className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-hover)] text-white shadow-md'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--primary-color)]'
        } ${paddingLeft}`}
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
        <ChevronRight
          className={`w-4 h-4 transition-opacity duration-200 ${
            isActive
              ? 'opacity-100 text-white'
              : 'opacity-0 group-hover:opacity-50 text-[var(--sidebar-text)]'
          }`}
        />
      </Link>
    </li>
  );
};

export default SidebarMenuItem;