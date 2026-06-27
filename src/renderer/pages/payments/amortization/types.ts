// src/renderer/pages/payments/amortization/types.ts

export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface AmortizationEntry {
  period: number;
  paymentDate: string;         // YYYY-MM-DD
  paymentAmount: number;
  interestAmount: number;
  principalAmount: number;
  remainingBalance: number;
}

export interface AmortizationSchedule {
  debtId: number;
  debtName: string;
  borrowerName: string;
  principal: number;
  annualInterestRate: number;
  totalPeriods: number;
  frequency: PaymentFrequency;
  entries: AmortizationEntry[];
  totalPayments: number;
  totalInterest: number;
}

export interface AmortizationFilters {
  debtId: number | null;
  frequency: PaymentFrequency;
}