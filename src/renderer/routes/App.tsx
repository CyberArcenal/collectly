// src/renderer/routes/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "../layouts/Layout";
import AuditTrailPage from "../pages/AuditTrail";
import SettingsPage from "../pages/Settings";
import { useEffect, useState } from "react";
import { LicenseModal } from "../components/Shared/LicenseModal";
import { Help } from "../pages/help";
import DebtDashboard from "../pages/dashboard/components/DebtDashboard";
import DebtorDirectory from "../pages/debtors";
import CreditCheckPage from "../pages/debtors/credit-check";
import DebtorGroupsPage from "../pages/debtors/group";
import ActiveLoansPage from "../pages/loans/active";
import OverdueLoansPage from "../pages/loans/overdue";
import ClosedLoansPage from "../pages/loans/closed";
import LoanApplicationsPage from "../pages/loans/applications";
import PaymentSchedulePage from "../pages/payments/schedule";
import TransactionsPage from "../pages/payments/transactions";
import PaymentMethodsPage from "../pages/payments/methods";
import AgingAnalysisPage from "../pages/reports/aging";
import CollectionReportPage from "../pages/reports/collection";
import DebtorStatementPage from "../pages/reports/debtor-stmt";
import ExpectedPaymentsPage from "../pages/reports/expected";
import DevicesPage from "../pages/devices";
import NotificationLogPage from "../pages/reminder";
import SyncPage from "../pages/sync";
import LoanAgreementsPage from "../pages/loans/loan-agreements";
import { NotificationToastListener } from "../components/Shared/NotificationToastListener";
import AmortizationPage from "../pages/payments/amortization";
import CollectionPage from "../pages/payments/collection";
// Auth pages
import LoginPage from "../pages/auth/Login";
import Verify2FAPage from "../pages/auth/Verify2FA";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "../components/Shared/ProtectedRoute";
import UserManagement from "../pages/users";

function App() {
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const { isAuthenticated } = useAuth();

  // Unauthorized listener (existing)
  useEffect(() => {
    if (window.backendAPI?.notifyAppReady) {
      window.backendAPI.notifyAppReady();
    }
  }, []);

  // ✅ Listen for auth:unauthorized event
  useEffect(() => {
    const unsubscribe = window.backendAPI?.on?.("auth:unauthorized", () => {
      // Navigate to login - we can't use useNavigate here directly, but we can use window.location
      // or use a ref to navigate. For simplicity, we'll reload to login.
      // In a more complex app, you'd use useNavigate, but since this is a top-level component,
      // we can use window.location.
      window.location.href = "/login";
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAccept = () => {
    setLicenseAccepted(true);
  };

  const handleCommercialRequest = () => {
    if ((window as any).backendAPI?.openExternal) {
      (window as any).backendAPI.openExternal(
        "mailto:cyberarcenal1@gmail.com?subject=Commercial%20License%20Inquiry",
      );
    } else {
      window.open(
        "mailto:cyberarcenal1@gmail.com?subject=Commercial%20License%20Inquiry",
        "_blank",
      );
    }
  };

  // Show license modal if not accepted
  if (!licenseAccepted && !localStorage.getItem("Debtify_license_accepted")) {
    return (
      <LicenseModal
        onAccept={handleAccept}
        onCommercialRequest={handleCommercialRequest}
      />
    );
  }

  return (
    <Routes>
      {/* Public routes (no layout, no auth required) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-2fa" element={<Verify2FAPage />} />
      <Route path="/help" element={<Help />} />

      {/* Protected routes with layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Core POS - accessible by all authenticated users */}
        <Route path="dashboard" element={<DebtDashboard />} />

        {/* System - admin/manager only */}
        <Route
          path="system/audit"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <AuditTrailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="system/settings"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Notification logs - collector+ */}
        <Route
          path="notification-logs"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <NotificationLogPage />
            </ProtectedRoute>
          }
        />

        {/* Debtors - staff+ */}
        <Route
          path="debtors/list"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector", "staff"]}>
              <DebtorDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="debtors/credit-check"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <CreditCheckPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="debtors/group"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <DebtorGroupsPage />
            </ProtectedRoute>
          }
        />

        {/* Loans - staff+ */}
        <Route
          path="loans/active"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector", "staff"]}>
              <ActiveLoansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="loans/overdue"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <OverdueLoansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="loans/closed"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <ClosedLoansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="loans/applications"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <LoanApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans/agreements"
          element={
            <ProtectedRoute roles={["admin", "manager", "staff"]}>
              <LoanAgreementsPage />
            </ProtectedRoute>
          }
        />

        {/* Payments - staff+ */}
        <Route
          path="payments/schedule"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector", "staff"]}>
              <PaymentSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments/collection"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <CollectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments/plan"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <AmortizationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments/transactions"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector", "staff"]}>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payments/methods"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <PaymentMethodsPage />
            </ProtectedRoute>
          }
        />

        {/* Reports - collector+ */}
        <Route
          path="reports/aging"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <AgingAnalysisPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/collection"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <CollectionReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/debtor-stmt"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <DebtorStatementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/expected"
          element={
            <ProtectedRoute roles={["admin", "manager", "collector"]}>
              <ExpectedPaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* Devices - admin/manager */}
        <Route
          path="devices"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <DevicesPage />
            </ProtectedRoute>
          }
        />

        {/* Sync - admin/manager */}
        <Route
          path="/sync"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <SyncPage />
            </ProtectedRoute>
          }
        />

        <Route path="/users" element={<UserManagement />} />

        {/* 404 Page */}
        <Route path="*" element={<div>Not found page</div>} />
      </Route>
    </Routes>
  );
}

export default App;
