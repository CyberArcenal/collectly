// src/renderer/pages/debtors/credit-check/index.tsx
import React from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import useCreditCheck from "./hooks/useCreditCheck";
import CreditScoreDisplay from "./components/CreditScoreDisplay";
import CreditReportPreview from "./components/CreditReportPreview";
import PreviousChecksLog from "./components/PreviousChecksLog";
import BorrowerSelect from "../../../components/Selects/Borrower";

const CreditCheckPage: React.FC = () => {
  const {
    selectedDebtor,
    setSelectedDebtor,
    creditScore,
    checkingCredit,
    performCheck,
    report,
    downloadReport,
    previousChecks,
    loadingLogs,
    hasMoreLogs,
    loadMoreLogs,
  } = useCreditCheck();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--primary-color)]" />
            Credit Check
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Assess borrower creditworthiness and view credit history
          </p>
        </div>
        <button
          onClick={() => {
            if (selectedDebtor) {
              performCheck(selectedDebtor);
            }
          }}
          disabled={!selectedDebtor || checkingCredit}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
          style={{
            backgroundColor: "var(--primary-color)",
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = "var(--primary-hover)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--primary-color)";
          }}
        >
          <RefreshCw className={`w-4 h-4 ${checkingCredit ? "animate-spin" : ""}`} />
          {checkingCredit ? "Checking..." : "Run Credit Check"}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Selector & History */}
        <div className="space-y-4">
          {/* Debtor Selector Card */}
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
            <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Select Debtor
            </label>
            <BorrowerSelect
              value={selectedDebtor?.id || null}
              onChange={(id, debtor) => setSelectedDebtor(debtor || null)}
              placeholder="Search by name, email, or contact..."
              activeOnly={true}
            />
            {selectedDebtor && (
              <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                Selected: <span className="font-medium text-[var(--text-primary)]">{selectedDebtor.name}</span>
              </div>
            )}
          </div>

          {/* Previous Checks Log */}
          <PreviousChecksLog
            logs={previousChecks}
            loading={loadingLogs}
            hasMore={hasMoreLogs}
            onLoadMore={loadMoreLogs}
          />
        </div>

        {/* Right Column: Credit Score & Report */}
        <div className="lg:col-span-2 space-y-4">
          <CreditScoreDisplay
            score={creditScore}
            checking={checkingCredit}
            onCheck={() => selectedDebtor && performCheck(selectedDebtor)}
            debtorName={selectedDebtor?.name}
            debtorId={selectedDebtor?.id}
          />
          <CreditReportPreview report={report} onDownload={downloadReport} />
        </div>
      </div>
    </div>
  );
};

export default CreditCheckPage;