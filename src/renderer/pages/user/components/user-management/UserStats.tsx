// src/renderer/pages/UserManagement/components/user-management/UserStats.tsx
import React from 'react';

interface UserStatsProps {
  stats: {
    total: number;
    active: number;
    restricted: number;
    suspended: number;
    admins: number;
    managers: number;
    collectors: number;
    staff: number;
    viewers: number;
  };
}

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-sm text-gray-400">Total Users</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-green-900 border-opacity-50">
        <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        <div className="text-sm text-gray-400">Active</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-yellow-900 border-opacity-50">
        <div className="text-2xl font-bold text-yellow-400">{stats.restricted}</div>
        <div className="text-sm text-gray-400">Restricted</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-red-900 border-opacity-50">
        <div className="text-2xl font-bold text-red-400">{stats.suspended}</div>
        <div className="text-sm text-gray-400">Suspended</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-purple-900 border-opacity-50">
        <div className="text-2xl font-bold text-purple-400">{stats.admins}</div>
        <div className="text-sm text-gray-400">Admins</div>
      </div>
    </div>
  );
};