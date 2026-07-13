// src/renderer/pages/audit/hooks/useAuditLogs.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { AuditLogEntry } from "../../../api/core/audit";
import auditAPI from "../../../api/core/audit";

export interface AuditFilters {
  action: "all" | string;
  startDate?: string;
  endDate?: string;
  search: string;
  entity?: string;
  user?: string;
}

interface Summary {
  totalToday: number;
  byAction: Record<string, number>;
  mostActiveUser: { user: string; count: number } | null;
  mostAffectedEntity: { entity: string; count: number } | null;
}

interface Stats {
  total: number;
  avgPerDay: number;
  mostActiveDay: { day: string; count: number } | null;
  uniqueUsers: number;
}

export const getActionColor = (action: string): string => {
  const lower = action.toLowerCase();
  if (lower.includes("create")) return "#10b981";
  if (lower.includes("delete")) return "#ef4444";
  if (lower.includes("update") || lower.includes("edit")) return "#3b82f6";
  if (lower.includes("view")) return "#8b5cf6";
  if (lower.includes("export")) return "#f59e0b";
  if (lower.includes("login")) return "#6366f1";
  if (lower.includes("logout")) return "#64748b";
  return "#6b7280";
};

export const useAuditLogs = (initialFilters: AuditFilters) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalToday: 0,
    byAction: {},
    mostActiveUser: null,
    mostAffectedEntity: null,
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    avgPerDay: 0,
    mostActiveDay: null,
    uniqueUsers: 0,
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const computeSummary = (items: AuditLogEntry[]) => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = items.filter((log) => {
      const logDate = typeof log.timestamp === "string" 
        ? log.timestamp 
        : new Date(log.timestamp).toISOString();
      return logDate.startsWith(today);
    });

    const byAction: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};

    items.forEach((log) => {
      const action = log.action || "Unknown";
      byAction[action] = (byAction[action] || 0) + 1;
      const userName = log.user || "System";
      userCounts[userName] = (userCounts[userName] || 0) + 1;
      if (log.entity) {
        entityCounts[log.entity] = (entityCounts[log.entity] || 0) + 1;
      }
    });

    let mostActiveUser = null;
    let maxUserCount = 0;
    Object.entries(userCounts).forEach(([user, count]) => {
      if (count > maxUserCount) {
        maxUserCount = count;
        mostActiveUser = { user, count };
      }
    });

    let mostAffectedEntity = null;
    let maxEntityCount = 0;
    Object.entries(entityCounts).forEach(([entity, count]) => {
      if (count > maxEntityCount) {
        maxEntityCount = count;
        mostAffectedEntity = { entity, count };
      }
    });

    setSummary({
      totalToday: todayLogs.length,
      byAction,
      mostActiveUser,
      mostAffectedEntity,
    });
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await auditAPI.getStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit stats:", err);
    }
  }, [filters.startDate, filters.endDate]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const baseParams: any = { page: 1, limit: 1000 };

      let response;

      const hasSearch = filters.search && filters.search.trim() !== "";
      const hasAction = filters.action && filters.action !== "all";
      const hasEntity = filters.entity && filters.entity.trim() !== "";
      const hasUser = filters.user && filters.user.trim() !== "";
      const hasDateRange = filters.startDate && filters.endDate;

      if (hasSearch) {
        response = await auditAPI.search({
          searchTerm: filters.search.trim(),
          action: hasAction ? filters.action : undefined,
          startDate: filters.startDate,
          endDate: filters.endDate,
          user: hasUser ? filters.user : undefined,
          entity: hasEntity ? filters.entity : undefined,
          ...baseParams,
        });
      } else if (hasAction) {
        response = await auditAPI.getByAction({ action: filters.action, ...baseParams });
      } else if (hasEntity) {
        response = await auditAPI.getByEntity({ entity: filters.entity, ...baseParams });
      } else if (hasUser) {
        response = await auditAPI.getByUser({ user: filters.user, ...baseParams });
      } else if (hasDateRange) {
        response = await auditAPI.getByDateRange({
          startDate: filters.startDate,
          endDate: filters.endDate,
          ...baseParams,
        });
      } else {
        response = await auditAPI.getAll(baseParams);
      }

      if (!response.status) throw new Error(response.message || "Failed to fetch audit logs");

      const items = response.data?.data;
      setLogs(items);
      computeSummary(items);
      await fetchStats();
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching audit logs.");
    } finally {
      setLoading(false);
    }
  }, [filters, fetchStats]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchLogs(), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters, fetchLogs]);

  return {
    logs,
    filters,
    setFilters,
    loading,
    error,
    reload: fetchLogs,
    summary,
    stats,
  };
};