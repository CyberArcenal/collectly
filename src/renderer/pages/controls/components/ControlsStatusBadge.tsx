// src/renderer/pages/controls/components/ControlsStatusBadge.tsx
import React from "react";

interface ControlsStatusBadgeProps {
  status: boolean;
  label: string;
}

const ControlsStatusBadge: React.FC<ControlsStatusBadgeProps> = ({ status, label }) => {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        status
          ? "bg-green-500/20 text-green-500"
          : "bg-red-500/20 text-red-500"
      }`}
    >
      {label}: {status ? "Enabled" : "Disabled"}
    </span>
  );
};

export default ControlsStatusBadge;