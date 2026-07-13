// src/renderer/pages/debtors/credit-check/components/CreditScoreDisplay.tsx
import React from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { CreditScore } from "../types";

interface CreditScoreDisplayProps {
  score: CreditScore | null;
  checking: boolean;
  onCheck: () => void;
  debtorName?: string;
  debtorId?: number;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "Low": return "text-green-500 bg-green-500/10 border-green-500/20";
    case "Medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case "High": return "text-red-500 bg-red-500/10 border-red-500/20";
    default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
  }
};

const getScoreColor = (scoreNum: number) => {
  if (scoreNum >= 700) return "text-green-500";
  if (scoreNum >= 500) return "text-yellow-500";
  return "text-red-500";
};

const getRiskIcon = (risk: string) => {
  switch (risk) {
    case "Low": return <CheckCircle className="w-5 h-5" />;
    case "Medium": return <AlertTriangle className="w-5 h-5" />;
    case "High": return <XCircle className="w-5 h-5" />;
    default: return <Shield className="w-5 h-5" />;
  }
};

const CreditScoreDisplay: React.FC<CreditScoreDisplayProps> = ({
  score,
  checking,
  onCheck,
  debtorName,
  debtorId,
}) => {
  if (!debtorName) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 text-center shadow-sm">
        <Shield className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)] opacity-50" />
        <p className="text-sm text-[var(--text-tertiary)]">
          Select a debtor to perform credit check
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--primary-color)]" />
          Credit Score
        </h3>
        <span className="text-xs text-[var(--text-tertiary)]">
          ID: #{debtorId}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-secondary)]">Debtor</p>
          <p className="font-medium text-[var(--text-primary)] truncate">{debtorName}</p>
        </div>
        <button
          onClick={onCheck}
          disabled={checking}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
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
          {checking ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Checking...
            </>
          ) : (
            "Run Check"
          )}
        </button>
      </div>

      {score && (
        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-6">
            {/* Score */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(score.score)}`}>
                {score.score}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                Score (300-850)
              </div>
            </div>

            {/* Risk Level */}
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${getRiskColor(score.riskLevel)}`}>
              {getRiskIcon(score.riskLevel)}
              {score.riskLevel} Risk
            </div>

            {/* Remarks */}
            <div className="flex-1 text-sm text-[var(--text-secondary)]">
              {score.remarks}
            </div>
          </div>

          <div className="mt-3 text-[10px] text-[var(--text-tertiary)] text-right">
            Last checked: {new Date(score.dateChecked).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditScoreDisplay;