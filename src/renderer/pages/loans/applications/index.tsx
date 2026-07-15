// src/renderer/pages/loans/applications/index.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import Button from "../../../components/UI/Button";
import useLoanApplications from "./hooks/useLoanApplications";
import ApplicationCard from "./components/ApplicationCard";
import ApplicationFormModal from "./components/ApplicationFormModal";
import ApplicationDetailModal from "./components/ApplicationDetailModal";
import ApprovalConfirmationModal from "./components/ApprovalConfirmationModal";
import { dialogs } from "../../../utils/dialogs";
import { usePagination } from "../../../contexts/PaginationContext";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import ApplicationSummaryCards from "./components/ApplicationSummaryCards";

const LoanApplicationsPage: React.FC = () => {
  const {
    applications,
    loading,
    totalItems,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    activeTab,
    setActiveTab,
    refresh,
    approve,
    reject,
    stats,
    fetchStats,
  } = useLoanApplications();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showStats, setShowStats] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "approve" | "reject";
    app: any;
  }>({ open: false, type: "approve", app: null });

  const { setPagination, clearPagination } = usePagination();

  // Stable pagination handlers
  const handlePageChange = useCallback(
    (newPage: number) => setCurrentPage(newPage),
    [setCurrentPage]
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1);
    },
    [setPageSize, setCurrentPage]
  );

  const handlersRef = useRef({
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  });
  useEffect(() => {
    handlersRef.current = {
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    };
  }, [handlePageChange, handlePageSizeChange]);

  const prevPageRef = useRef(currentPage);
  const prevTotalRef = useRef(totalItems);
  const prevLimitRef = useRef(pageSize);

  useEffect(() => {
    const pageChanged = prevPageRef.current !== currentPage;
    const totalChanged = prevTotalRef.current !== totalItems;
    const limitChanged = prevLimitRef.current !== pageSize;

    if (pageChanged || totalChanged || limitChanged) {
      prevPageRef.current = currentPage;
      prevTotalRef.current = totalItems;
      prevLimitRef.current = pageSize;

      setPagination({
        currentPage,
        totalItems,
        pageSize,
        onPageChange: handlersRef.current.onPageChange,
        onPageSizeChange: handlersRef.current.onPageSizeChange,
        pageSizeOptions: [9, 18, 27],
        showPageSize: true,
      });
    }
  }, [currentPage, totalItems, pageSize, setPagination]);

  useEffect(() => {
    return () => clearPagination();
  }, [clearPagination]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const openDetail = (app: any) => {
    setSelectedApp(app);
    setDetailOpen(true);
  };

  const handleApprove = (app: any) => {
    setConfirmModal({ open: true, type: "approve", app });
  };

  const handleReject = (app: any) => {
    setConfirmModal({ open: true, type: "reject", app });
  };

  const confirmAction = async (reason?: string) => {
    const { type, app } = confirmModal;
    try {
      if (type === "approve") {
        await approve(app.id);
        dialogs.success(`Application approved. Active loan created.`);
      } else {
        await reject(app.id, reason);
        dialogs.success(`Application rejected.`);
      }
      refresh();
      fetchStats();
      setConfirmModal({ open: false, type: "approve", app: null });
      setDetailOpen(false);
    } catch (err: any) {
      dialogs.error("Ops! Something went wrong while approving the application.");
    }
  };

  const handleTabChange = (tab: "pending" | "approved" | "rejected") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const tabs = [
    { id: "pending", label: "Pending", icon: Clock, color: "var(--warning-color)" },
    { id: "approved", label: "Approved", icon: CheckCircle, color: "var(--success-color)" },
    { id: "rejected", label: "Rejected", icon: XCircle, color: "var(--danger-color)" },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--primary-color)]" />
            Loan Applications
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Review and manage loan requests from debtors
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors"
            title={showStats ? "Hide summary" : "Show summary"}
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            onClick={() => setFormOpen(true)}
            variant="primary"
            size="sm"
            icon={Plus}
          >
            New Application
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && stats && (
        <ApplicationSummaryCards
          total={stats.total}
          pending={stats.pending}
          approved={stats.approved}
          rejected={stats.rejected}
          totalAmount={stats.totalRequestedAmount}
        />
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = stats?.[tab.id as keyof typeof stats] ?? 0;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" style={{ color: isActive ? tab.color : "var(--text-tertiary)" }} />
                {tab.label}
                <span className="text-xs bg-[var(--card-secondary-bg)] px-1.5 py-0.5 rounded-full text-[var(--text-tertiary)]">
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading / Empty State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
          <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p>No {activeTab} applications</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {activeTab === "pending"
              ? "All applications have been reviewed"
              : `No applications have been ${activeTab}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onView={openDetail}
              onApprove={handleApprove}
              onReject={handleReject}
              showActions={app.status === "pending"}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ApplicationFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          refresh();
          fetchStats();
        }}
      />
      <ApplicationDetailModal
        isOpen={detailOpen}
        application={selectedApp}
        onClose={() => setDetailOpen(false)}
        onApprove={() => handleApprove(selectedApp)}
        onReject={() => handleReject(selectedApp)}
      />
      <ApprovalConfirmationModal
        isOpen={confirmModal.open}
        application={confirmModal.app}
        type={confirmModal.type}
        onClose={() =>
          setConfirmModal({ open: false, type: "approve", app: null })
        }
        onConfirm={confirmAction}
      />
    </div>
  );
};

export default LoanApplicationsPage;