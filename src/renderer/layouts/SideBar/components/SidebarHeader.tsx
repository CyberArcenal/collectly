// src/renderer/layouts/Sidebar/components/SidebarHeader.tsx
import React from 'react';
import { HandCoins } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';

interface SidebarHeaderProps {
  companyName?: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ companyName: propCompanyName }) => {
  const { getSetting } = useSettings();
  const companyName = propCompanyName || getSetting('general', 'company_name', 'Debt Manager');

  return (
    <div className="flex-shrink-0 border-b border-[var(--sidebar-border)] bg-[var(--card-secondary-bg)] p-5">
      <div className="flex items-center gap-3">
        <img
          src="./icon.png"
          alt="Collectly"
          className="w-10 h-10 object-contain rounded-lg shadow-md"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className =
              'w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center shadow-md';
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'w-6 h-6 text-white');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('stroke', 'currentColor');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('stroke-width', '2');
            path.setAttribute(
              'd',
              'M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V7a2 2 0 012-2h5.5a1 1 0 01.8.4l3.5 4.5a1 1 0 01.2.6V18a2 2 0 01-2 2z'
            );
            svg.appendChild(path);
            fallbackDiv.appendChild(svg);
            target.parentNode?.appendChild(fallbackDiv);
          }}
        />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-[var(--sidebar-text)]">
            {companyName}
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">Collection Platform</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;