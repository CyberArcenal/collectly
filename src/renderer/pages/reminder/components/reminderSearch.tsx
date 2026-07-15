// src/renderer/pages/notification/components/reminderSearch.tsx
import React from "react";
import { Search } from "lucide-react";

interface NotificationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const NotificationSearch: React.FC<NotificationSearchProps> = ({
  value,
  onChange,
  placeholder = "Search by recipient email, subject, or content...",
}) => {
  return (
    <div className="relative w-full sm:w-80">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
};