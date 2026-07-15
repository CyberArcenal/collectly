// src/renderer/pages/reports/expected/components/ExpectedChart.tsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ExpectedReport } from "../types";
import { formatCurrency } from "../../../../utils/formatters";

interface ExpectedChartProps {
  report: ExpectedReport;
}

const ExpectedChart: React.FC<ExpectedChartProps> = ({ report }) => {
  // Get theme colors
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666';
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#ddd';
  const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
  const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#0e9d7c';

  const data = report.data.map(d => ({ period: d.date, amount: d.amount }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        Expected Payments by {report.groupBy}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
          <XAxis
            dataKey="period"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 11, fill: textSecondary }}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v)}
            width={80}
            tick={{ fontSize: 11, fill: textSecondary }}
          />
          <Tooltip
            formatter={(v: number) => formatCurrency(v)}
            labelFormatter={(label) => `Period: ${label}`}
            contentStyle={{
              backgroundColor: cardBg,
              borderColor: borderColor,
              color: textPrimary,
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend wrapperStyle={{ color: textPrimary, fontSize: '12px' }} />
          <Bar
            dataKey="amount"
            fill={primaryColor}
            name="Expected Amount"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpectedChart;