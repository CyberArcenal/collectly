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

export const getActionColor = (action: string): string => {
  const lower = action.toLowerCase();
  if (lower.includes("sale") || lower.includes("create")) return "var(--accent-green)";
  if (lower.includes("refund") || lower.includes("delete")) return "var(--accent-red)";
  if (lower.includes("inventory") || lower.includes("stock")) return "var(--accent-blue)";
  if (lower.includes("setting") || lower.includes("config")) return "var(--accent-amber)";
  return "var(--text-tertiary)";
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

  // Debounce timer for search
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const computeSummary = (items: AuditLogEntry[]) => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = items.filter((log) => {
      const logDate = typeof log.timestamp === "string" ? log.timestamp : new Date(log.timestamp).toISOString();
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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build common params
      const baseParams: any = {
        page: 1,
        limit: 1000, // or use a configurable limit
      };

      let response;

      // Determine which API method to call
      const hasSearch = filters.search && filters.search.trim() !== "";
      const hasAction = filters.action && filters.action !== "all";
      const hasEntity = filters.entity && filters.entity.trim() !== "";
      const hasUser = filters.user && filters.user.trim() !== "";
      const hasDateRange = filters.startDate && filters.endDate;

      if (hasSearch) {
        // Use search endpoint with searchTerm
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

      // Extract items from response (the structure might vary)
      const items = response.data?.items || response.data?.data || [];
      setLogs(items);
      computeSummary(items);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching audit logs.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced fetch for search changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If search is the only changed filter, debounce
    // We'll just debounce any filter change for simplicity
    debounceTimer.current = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
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
  };
};