// src/renderer/pages/UserManagement/components/user-management/UserFilter.tsx
import React from 'react';
import type { UserFilters } from '../../../users/types/user.types';

interface UserFilterProps {
  filters: UserFilters;
  onFilterChange: (filters: UserFilters) => void;
  onReset: () => void;
}

export const UserFilter: React.FC<UserFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const userTypes = ['viewer', 'customer', 'staff', 'collector', 'manager', 'admin'];
  const statuses = ['active', 'restricted', 'suspended', 'deleted'];

  const handleChange = (key: keyof UserFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filter Users</h3>
        <button
          onClick={onReset}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Search
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search by name, email, or username..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* User Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            User Type
          </label>
          <select
            value={filters.user_type || ''}
            onChange={(e) => handleChange('user_type', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {userTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};