// src/renderer/pages/payments/methods/index.tsx
import React, { useState } from "react";
import { CreditCard, Plus, RefreshCw, Eye, EyeOff } from "lucide-react";
import Button from "../../../components/UI/Button";
import usePaymentMethods from "./hooks/usePaymentMethods";
import MethodCard from "./components/MethodCard";
import MethodFormModal from "./components/MethodFormModal";
import { dialogs } from "../../../utils/dialogs";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import PaymentMethodSummaryCards from "./components/PaymentMethodSummaryCards";

const PaymentMethodsPage: React.FC = () => {
  const {
    methods,
    stats,
    loading,
    refresh,
    create,
    update,
    setDefault,
    remove,
  } = usePaymentMethods();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [showStats, setShowStats] = useState(true);

  const handleCreate = async (data: any) => {
    await create(data);
    setFormOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (editingMethod) {
      await update(editingMethod.id, data);
      setEditingMethod(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    await setDefault(id);
  };

  const handleDelete = async (methodId: number) => {
    try {
      await remove(methodId);
    } catch (err: any) {
      dialogs.error(err.message);
    }
  };

  // Compute summary stats
  const totalMethods = methods.length;
  const defaultMethod = methods.find(m => m.isDefault);
  const totalTransactions = Object.values(stats).reduce((sum, s) => sum + (s.transactionCount || 0), 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--primary-color)]" />
            Payment Methods
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage payment methods for collections and transactions
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
            Add Method
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {showStats && !loading && (
        <PaymentMethodSummaryCards
          totalMethods={totalMethods}
          defaultMethodName={defaultMethod?.name || null}
          totalTransactions={totalTransactions}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* Empty State */}
      {!loading && methods.length === 0 && (
        <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p>No payment methods</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Click "Add Method" to create one.</p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Add Method
          </button>
        </div>
      )}

      {/* Grid of Methods */}
      {!loading && methods.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {methods.map((method) => {
            const methodStats = stats[method.id];
            return (
              <MethodCard
                key={method.id}
                method={method}
                usageCount={methodStats?.transactionCount || 0}
                onEdit={() => setEditingMethod(method)}
                onDelete={async () => {
                  if (
                    !(await dialogs.confirm({
                      title: "Confirm Delete",
                      message: `Are you sure you want to delete the payment method "${method.name}"?`,
                      icon: 'danger'
                    }))
                  ) {
                    return;
                  }
                  await handleDelete(method.id);
                }}
                onSetDefault={() => handleSetDefault(method.id)}
                isAdmin={true}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MethodFormModal
        isOpen={formOpen}
        mode="create"
        method={null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
      <MethodFormModal
        isOpen={!!editingMethod}
        mode="edit"
        method={editingMethod}
        onClose={() => setEditingMethod(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
};

export default PaymentMethodsPage;