// src/renderer/pages/sync/components/SyncChangeIndicator.tsx

import React from "react";

interface SyncChangeIndicatorProps {
  currentCount: number;
  previousCount: number;
  className?: string;
}

const SyncChangeIndicator: React.FC<SyncChangeIndicatorProps> = ({
  currentCount,
  previousCount,
  className = "",
}) => {
  const diff = currentCount - previousCount;
  if (diff === 0) return null;

  const isPositive = diff > 0;
  const color = isPositive ? "text-blue-500" : "text-red-500";
  const icon = isPositive ? "↑" : "↓";

  return (
    <span className={`text-xs font-medium ${color} ${className}`}>
      {icon} {Math.abs(diff)}
    </span>
  );
};

export default SyncChangeIndicator;