// src/renderer/pages/loans/agreements/components/LoanAgreementSummaryCards.tsx
import React from "react";
import { FileText, FileSignature, FileCheck, FileArchive } from "lucide-react";

interface LoanAgreementSummaryCardsProps {
  total: number;
  draft: number;
  signed: number;
  withFiles: number;
}

const LoanAgreementSummaryCards: React.FC<LoanAgreementSummaryCardsProps> = ({
  total,
  draft,
  signed,
  withFiles,
}) => {
  const cards = [
    {
      title: "Total Agreements",
      value: total,
      icon: FileText,
      color: "bg-blue-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Draft",
      value: draft,
      icon: FileArchive,
      color: "bg-yellow-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "Signed",
      value: signed,
      icon: FileCheck,
      color: "bg-green-500",
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: "With Files",
      value: withFiles,
      icon: FileSignature,
      color: "bg-purple-500",
      format: (v: number) => v.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {card.format(card.value)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${card.color} bg-opacity-10`}>
              <card.icon className={`w-4 h-4 ${card.color.replace("bg-", "text-")}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoanAgreementSummaryCards;