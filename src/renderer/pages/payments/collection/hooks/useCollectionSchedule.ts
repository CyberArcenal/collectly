// src/renderer/pages/payments/collection/hooks/useCollectionSchedule.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import debtsAPI from '../../../../api/core/debt';
import type { CollectionScheduleResponse, PeriodType, DebtorCollection } from '../types';

interface UseCollectionScheduleReturn {
  data: CollectionScheduleResponse | null;
  paginatedDebtors: DebtorCollection[];
  loading: boolean;
  error: string | null;
  periodType: PeriodType;
  setPeriodType: (type: PeriodType) => void;
  refresh: () => void;
  // Pagination
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

const useCollectionSchedule = (): UseCollectionScheduleReturn => {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [data, setData] = useState<CollectionScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtsAPI.getCollectionSchedule(periodType);
      if (!response.status) throw new Error(response.message);
      setData(response.data);
      // Reset to page 1 when period changes
      setPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to load collection schedule');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const refresh = useCallback(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Compute paginated debtors
  const paginatedDebtors = useMemo(() => {
    if (!data) return [];
    const start = (page - 1) * limit;
    const end = start + limit;
    return data.debtors.slice(start, end);
  }, [data, page, limit]);

  // Pagination metadata
  const pagination = useMemo(() => {
    const totalItems = data?.debtors.length || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    return {
      page,
      totalPages,
      totalItems,
      limit,
    };
  }, [data, page, limit]);

  return {
    data,
    paginatedDebtors,
    loading,
    error,
    periodType,
    setPeriodType,
    refresh,
    page,
    setPage,
    limit,
    setLimit,
    pagination,
  };
};

export default useCollectionSchedule;