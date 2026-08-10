// src/renderer/pages/sync/components/SyncStatusBadge.tsx

import React from "react";

interface SyncStatusBadgeProps {
  status: "idle" | "syncing" | "completed" | "failed";
  className?: string;
}

const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status, className = "" }) => {
  const config = {
    idle: { label: "Idle", color: "bg-gray-500/20 text-gray-400" },
    syncing: { label: "Syncing", color: "bg-yellow-500/20 text-yellow-500" },
    completed: { label: "Completed", color: "bg-green-500/20 text-green-500" },
    failed: { label: "Failed", color: "bg-red-500/20 text-red-500" },
  };

  const { label, color } = config[status] || config.idle;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color} ${className}`}>
      {label}
    </span>
  );
};

export default SyncStatusBadge;