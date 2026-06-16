// src/components/Shared/InterestPeriodIndicator.tsx
import React, { useState, useEffect } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";

const InterestPeriodIndicator: React.FC = () => {
  const { getSetting } = useSettings();
  const [period, setPeriod] = useState<string>("per_annum");

  useEffect(() => {
    const fetchPeriod = async () => {
      const val = await getSetting("collections", "interest_calculation_period", "per_annum");
      setPeriod(val);
    };
    fetchPeriod();
  }, [getSetting]);

  const isPerMonth = period === "per_month";
  const label = isPerMonth ? "Per Month" : "Per Annum";
  const Icon = isPerMonth ? Calendar : CalendarDays;

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--card-hover-bg)] text-xs text-[var(--sidebar-text)] border border-[var(--border-color)]">
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </div>
  );
};

export default InterestPeriodIndicator;