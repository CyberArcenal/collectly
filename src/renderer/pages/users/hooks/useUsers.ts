// src/renderer/pages/users/hooks/useUsers.ts
import { useState, useEffect, useCallback, useRef } from "react";
import userAPI from "../../../api/core/user";
import type { User } from "../../../api/core/user";
import type { UserFilters } from "../types/user.types";

export interface UserFiltersLocal {
  search: string;
  user_type: string;
  status: string;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  admin: number;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  filters: UserFiltersLocal;
  selectedUsers: number[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<number[]>>;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: string; direction: "asc" | "desc" }>>;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
  reload: () => void;
  fetchStats: () => Promise<void>;
  handleFilterChange: (key: keyof UserFiltersLocal, value: string) => void;
  resetFilters: () => void;
  toggleUserSelection: (id: number) => void;
  toggleSelectAll: () => void;
  handleSort: (key: string) => void;
  stats: UserStats | null;
  exportUsers: (ids?: number[]) => Promise<void>;
}

const useUsers = (initialFilters?: Partial<UserFiltersLocal>): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "created_at",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<UserFiltersLocal>({
    search: "",
    user_type: "",
    status: "",
    ...initialFilters,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await userAPI.getAll({ page: 1, page_size: 100 });
      if (response.status) {
        const usersData = response.data || [];
        const total = usersData.length;
        const active = usersData.filter((u: User) => u.status === "active").length;
        const suspended = usersData.filter((u: User) => u.status === "suspended").length;
        const admin = usersData.filter((u: User) => u.user_type === "admin").length;
        setStats({ total, active, suspended, admin });
      }
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: UserFilters = {
        page: currentPage,
        page_size: pageSize,
        search: filters.search || undefined,
        user_type: filters.user_type || undefined,
        status: filters.status || undefined,
      };

      const response = await userAPI.getAll(params);

      if (!response.status) throw new Error(response.message || "Failed to fetch users");

      const usersData = response.data;
      const pagination = response.pagination;

      if (mountedRef.current) {
        setUsers(usersData);
        setTotalItems(pagination?.count || usersData.length);
      }
      setError(null);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || "Failed to load users");
        console.error(err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentPage, pageSize, filters.search, filters.user_type, filters.status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const exportUsers = useCallback(async (ids?: number[]) => {
    const usersToExport = ids ? users.filter(u => ids.includes(u.id)) : users;
    if (usersToExport.length === 0) {
      alert("No users to export");
      return;
    }

    const headers = ["ID", "Username", "Email", "Full Name", "User Type", "Status", "Phone", "Created At"];
    const rows = usersToExport.map(u => [
      u.id,
      u.username,
      u.email,
      u.full_name || `${u.first_name} ${u.last_name}`.trim(),
      u.user_type_display || u.user_type,
      u.status_display || u.status,
      u.phone_number || "",
      u.created_at,
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [users]);

  const handleFilterChange = useCallback((key: keyof UserFiltersLocal, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: "", user_type: "", status: "" });
    setCurrentPage(1);
  }, []);

  const toggleUserSelection = useCallback((id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  }, [users, selectedUsers]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  }, []);

  const reload = useCallback(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  return {
    users,
    loading,
    error,
    totalItems,
    currentPage,
    pageSize,
    filters,
    selectedUsers,
    setSelectedUsers,
    sortConfig,
    setSortConfig,
    setPageSize: setPageSizeHandler,
    setCurrentPage,
    reload,
    fetchStats,
    handleFilterChange,
    resetFilters,
    toggleUserSelection,
    toggleSelectAll,
    handleSort,
    stats,
    exportUsers,
  };
};

export default useUsers;