// src/renderer/pages/payments/methods/components/MethodCard.tsx
import React from 'react';
import { Edit, Trash2, Star, CreditCard } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { PaymentMethod } from '../../../../api/core/payment_method';

interface MethodCardProps {
  method: PaymentMethod;
  usageCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isAdmin?: boolean;
}

const MethodCard: React.FC<MethodCardProps> = ({
  method,
  usageCount,
  onEdit,
  onDelete,
  onSetDefault,
  isAdmin = true,
}) => {
  const IconComponent = (Icons as any)[method.icon] || CreditCard;

  return (
    <div
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 hover:shadow-md transition-shadow relative group"
    >
      {/* Default badge */}
      {method.isDefault && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-medium text-[var(--warning-color)] bg-[var(--warning-color)]/10 px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 fill-current" />
          Default
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor: method.isDefault ? "var(--warning-color)" + "20" : "var(--accent-blue-light)",
            color: method.isDefault ? "var(--warning-color)" : "var(--accent-blue)",
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">{method.name}</h3>
          {method.description && (
            <p className="text-sm text-[var(--text-secondary)] truncate">{method.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--text-tertiary)]">
              Used in {usageCount} transaction{usageCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-0.5 flex-shrink-0">
            {!method.isDefault && (
              <button
                onClick={(e) => { e.stopPropagation(); onSetDefault(); }}
                className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--warning-color)]"
                title="Set as default"
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--danger-color)]"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MethodCard;