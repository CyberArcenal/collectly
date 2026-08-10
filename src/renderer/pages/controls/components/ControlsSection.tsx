// src/renderer/pages/controls/components/ControlsSection.tsx
import React, { type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ControlsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const ControlsSection: React.FC<ControlsSectionProps> = ({
  title,
  description,
  children,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
      <div
        className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:bg-[var(--card-hover-bg)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {description}
            </p>
          )}
        </div>
        <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="p-4">
          {/* ✅ Improved grid: auto-rows-fr para pantay ang taas ng cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlsSection;