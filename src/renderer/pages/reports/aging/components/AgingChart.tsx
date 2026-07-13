// src/renderer/pages/reports/aging/components/AgingChart.tsx
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { AgingBucket } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AgingChartProps {
  buckets: AgingBucket[];
}

const AgingChart: React.FC<AgingChartProps> = ({ buckets }) => {
  // Use theme colors
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#2e7d32';
  const primaryLight = getComputedStyle(document.documentElement).getPropertyValue('--primary-light').trim() || 'rgba(46, 125, 50, 0.2)';

  const data = {
    labels: buckets.map(b => b.range),
    datasets: [
      {
        label: "Outstanding Amount (PHP)",
        data: buckets.map(b => b.totalAmount),
        backgroundColor: primaryLight,
        borderColor: primaryColor,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
          font: { size: 11 },
        },
      },
      title: {
        display: true,
        text: "Aging Summary by Bucket",
        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333',
        font: { size: 14, weight: 'bold' },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `₱${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => `₱${value.toLocaleString()}`,
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666',
        },
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#eee',
        },
      },
      x: {
        ticks: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666',
        },
        grid: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#eee',
        },
      },
    },
  };

  return (
    <div className="w-full h-80">
      <Bar data={data} options={options} />
    </div>
  );
};

export default AgingChart;