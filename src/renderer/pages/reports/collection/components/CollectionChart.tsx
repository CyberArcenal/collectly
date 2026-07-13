// src/renderer/pages/reports/collection/components/CollectionChart.tsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CollectionDataPoint } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface CollectionChartProps {
  data: CollectionDataPoint[];
}

const CollectionChart: React.FC<CollectionChartProps> = ({ data }) => {
  // Get theme colors
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666';
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#ddd';
  const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
  const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
  const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim() || '#10b981';
  const accentBlue = getComputedStyle(document.documentElement).getPropertyValue('--accent-blue').trim() || '#3b82f6';

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Collection Trend</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: textSecondary }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            width={80}
            tick={{ fontSize: 11, fill: textSecondary }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: cardBg,
              borderColor: borderColor,
              color: textPrimary,
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend
            wrapperStyle={{ color: textPrimary, fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="actualCollected"
            stroke={successColor}
            name="Actual Collected"
            strokeWidth={2}
            dot={{ r: 4, fill: successColor }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="expectedCollected"
            stroke={accentBlue}
            name="Expected Collection"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: accentBlue }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CollectionChart;