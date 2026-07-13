// src/renderer/pages/payments/schedule/components/ViewModeToggle.tsx
import React from 'react';
import { CalendarDays, List } from 'lucide-react';

interface ViewModeToggleProps {
  mode: "calendar" | "list";
  onChange: (mode: "calendar" | "list") => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex gap-1 rounded-lg border p-0.5" style={{ borderColor: "var(--border-color)" }}>
      <button
        onClick={() => onChange("list")}
        className={`p-1.5 rounded transition-all ${
          mode === "list"
            ? "text-white"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
        style={{
          backgroundColor: mode === "list" ? "var(--primary-color)" : "transparent",
        }}
        title="List View"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange("calendar")}
        className={`p-1.5 rounded transition-all ${
          mode === "calendar"
            ? "text-white"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        }`}
        style={{
          backgroundColor: mode === "calendar" ? "var(--primary-color)" : "transparent",
        }}
        title="Calendar View"
      >
        <CalendarDays className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewModeToggle;