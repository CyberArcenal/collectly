// src/renderer/pages/payments/collection/types.ts

export type PeriodType = 'weekly' | 'monthly' | 'semi-annual' | 'yearly';

export interface DebtPeriodItem {
  debtId: number;
  debtName: string;
  borrowerId: number;
  borrowerName: string;
  periodAmount: number;
  totalPaidInPeriod: number;
  isPaid: boolean;
  nextDueDate: string;
  remainingBalance: number;
  contact: string | null;
  email: string | null;
}

export interface DebtorCollection {
  borrowerId: number;
  borrowerName: string;
  contact: string | null;
  email: string | null;
  debts: DebtPeriodItem[];
  totalPeriodAmount: number;
  totalPaidInPeriod: number;
  allPaid: boolean;
}

export interface CollectionScheduleResponse {
  periodType: PeriodType;
  periodLabel: string;
  asOfDate: string;
  debtors: DebtorCollection[];
  totalDue: number;
  totalDebtors: number;
}