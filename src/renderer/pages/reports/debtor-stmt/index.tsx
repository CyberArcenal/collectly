// src/renderer/pages/reports/debtor-stmt/index.tsx
import React, { useRef, useState } from "react";
import { FileText, Printer, RefreshCw, User, Eye, EyeOff } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import useDebtorStatement from "./hooks/useDebtorStatement";
import StatementPrintable from "./components/StatementPrintable";
import { useSettings } from "../../../contexts/SettingsContext";
import BorrowerSelect from "../../../components/Selects/Borrower";
import LoadingSpinner from "../../../components/Shared/LoadingSpinner";
import StatementSummaryCards from "./components/StatementSummaryCards";

const DebtorStatementPage: React.FC = () => {
  const { selectedDebtor, statement, loading, error, selectDebtor, clearSelection } = useDebtorStatement();
  const { getSetting } = useSettings();
  const companyName = getSetting("general", "company_name", "Debt Management System");
  const printRef = useRef<HTMLDivElement>(null);
  const [showStats, setShowStats] = useState(true);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Statement_${selectedDebtor?.name || "Debtor"}_${new Date().toISOString().slice(0, 10)}`,
  });

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-[var(--danger-color)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)]">
          <p className="text-sm">Error: {error}</p>
          <button
            onClick={clearSelection}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--primary-color)]" />
            Debtor Statement
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Generate and print detailed statements for debtors
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
          {selectedDebtor && (
            <>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5"
                style={{ backgroundColor: "var(--primary-color)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-color)";
                }}
              >
                <Printer className="w-4 h-4" />
                Print / PDF
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-secondary)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--card-hover-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <RefreshCw className="w-4 h-4" />
                New Statement
              </button>
            </>
          )}
        </div>
      </div>

      {/* Debtor Selector */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm">
        <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
          <User className="w-3 h-3 inline mr-1" />
          Select Debtor
        </label>
        <BorrowerSelect
          value={selectedDebtor?.id || null}
          onChange={(id, debtor) => {
            if (debtor) selectDebtor(debtor);
          }}
          placeholder="Search debtor by name, email, or contact..."
          activeOnly={true}
        />
        {selectedDebtor && (
          <div className="mt-2 text-xs text-[var(--text-tertiary)]">
            Selected: <span className="font-medium text-[var(--text-primary)]">{selectedDebtor.name}</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {showStats && statement && (
        <StatementSummaryCards
          totalBorrowed={statement.summary.totalBorrowed}
          totalPaid={statement.summary.totalPaid}
          totalPenalties={statement.summary.totalPenalties}
          outstanding={statement.summary.outstanding}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* No Selection State */}
      {!loading && !selectedDebtor && (
        <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] text-sm">
          <User className="w-8 h-8 mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p>No debtor selected</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Search and select a debtor to generate their statement
          </p>
        </div>
      )}

      {/* Statement Preview */}
      {statement && (
        <>
          {/* Hidden print area */}
          <div style={{ display: "none" }}>
            <div ref={printRef}>
              <StatementPrintable statement={statement} companyName={companyName} />
            </div>
          </div>

          {/* Visible preview */}
          <div
            className="rounded-xl border border-[var(--border-color)] overflow-hidden max-h-[70vh] overflow-y-auto"
            style={{ backgroundColor: "var(--card-secondary-bg)" }}
          >
            <StatementPrintable statement={statement} companyName={companyName} />
          </div>
        </>
      )}
    </div>
  );
};

export default DebtorStatementPage;