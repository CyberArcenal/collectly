// src/renderer/pages/reports/aging/components/AgingSummaryTable.tsx
import React from "react";
import { ChevronRight } from "lucide-react";
import type { AgingBucket } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface AgingSummaryTableProps {
  buckets: AgingBucket[];
  totalOutstanding: number;
  onBucketClick: (bucket: AgingBucket) => void;
}

const AgingSummaryTable: React.FC<AgingSummaryTableProps> = ({
  buckets,
  totalOutstanding,
  onBucketClick,
}) => {
  const totalCount = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)]">
          <tr>
            <th className="text-left py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Bucket
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Count
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Amount
            </th>
            <th className="text-right py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              % of Total
            </th>
            <th className="text-center py-2.5 px-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket, idx) => (
            <tr
              key={idx}
              className="border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors"
            >
              <td className="py-2.5 px-3 text-[var(--text-primary)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{
                    backgroundColor: idx === 0 ? "#ef4444" :
                                    idx === 1 ? "#f97316" :
                                    idx === 2 ? "#eab308" :
                                    "#3b82f6"
                  }} />
                  {bucket.range}
                </div>
              </td>
              <td className="py-2.5 px-3 text-right text-[var(--text-primary)]">
                {bucket.count}
              </td>
              <td className="py-2.5 px-3 text-right font-medium" style={{ color: "var(--debt-high)" }}>
                {formatCurrency(bucket.totalAmount)}
              </td>
              <td className="py-2.5 px-3 text-right text-[var(--text-primary)]">
                {bucket.percentage.toFixed(1)}%
              </td>
              <td className="py-2.5 px-3 text-center">
                <button
                  onClick={() => onBucketClick(bucket)}
                  className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                  style={{ color: "var(--accent-blue)" }}
                >
                  View Details
                  <ChevronRight className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-[var(--card-secondary-bg)] border-t border-[var(--border-color)] font-semibold">
          <tr>
            <td className="py-2.5 px-3 text-[var(--text-primary)]">Total</td>
            <td className="py-2.5 px-3 text-right text-[var(--text-primary)]">{totalCount}</td>
            <td className="py-2.5 px-3 text-right text-[var(--text-primary)]">{formatCurrency(totalOutstanding)}</td>
            <td className="py-2.5 px-3 text-right text-[var(--text-primary)]">100%</td>
            <td className="py-2.5 px-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default AgingSummaryTable;