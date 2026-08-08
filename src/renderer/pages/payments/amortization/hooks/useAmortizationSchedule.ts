// src/renderer/pages/payments/amortization/hooks/useAmortizationSchedule.ts

import { useState, useEffect, useCallback } from 'react';
import type { AmortizationEntry, AmortizationSchedule, PaymentFrequency } from '../types';
import type { Debt } from '../../../../api/core/debt';
import debtsAPI from '../../../../api/core/debt';

function computePMT(principal: number, ratePerPeriod: number, numberOfPeriods: number): number {
  if (ratePerPeriod === 0) return principal / numberOfPeriods;
  const factor = Math.pow(1 + ratePerPeriod, numberOfPeriods);
  return principal * ratePerPeriod * factor / (factor - 1);
}

function generateSchedule(
  principal: number,
  annualRate: number,
  startDate: Date,
  endDate: Date,
  frequency: PaymentFrequency
): AmortizationEntry[] {
  const periodsPerYear: Record<PaymentFrequency, number> = {
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    'semi-annual': 2,
    annual: 1,
  };

  let totalPeriods: number;
  if (frequency === 'weekly') {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalPeriods = Math.max(1, Math.ceil(diffDays / 7));
  } else {
    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    const periods = periodsPerYear[frequency];
    totalPeriods = Math.max(1, Math.round(totalMonths / (12 / periods)));
  }

  const ratePerPeriod = (annualRate / 100) / periodsPerYear[frequency];
  const payment = computePMT(principal, ratePerPeriod, totalPeriods);

  const entries: AmortizationEntry[] = [];
  let balance = principal;
  const currentDate = new Date(startDate);

  for (let i = 1; i <= totalPeriods; i++) {
    if (frequency === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
    else if (frequency === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
    else if (frequency === 'quarterly') currentDate.setMonth(currentDate.getMonth() + 3);
    else if (frequency === 'semi-annual') currentDate.setMonth(currentDate.getMonth() + 6);
    else if (frequency === 'annual') currentDate.setFullYear(currentDate.getFullYear() + 1);

    let paymentAmount = payment;
    const interest = balance * ratePerPeriod;
    let principalAmount = paymentAmount - interest;

    if (i === totalPeriods) {
      principalAmount = balance;
      paymentAmount = balance + interest;
    }

    if (principalAmount > balance) principalAmount = balance;
    if (paymentAmount > balance + interest) paymentAmount = balance + interest;

    const newBalance = balance - principalAmount;

    entries.push({
      period: i,
      paymentDate: currentDate.toISOString().slice(0, 10),
      paymentAmount: Math.round(paymentAmount * 100) / 100,
      interestAmount: Math.round(interest * 100) / 100,
      principalAmount: Math.round(principalAmount * 100) / 100,
      remainingBalance: Math.round(newBalance * 100) / 100,
    });

    balance = newBalance;
    if (balance <= 0.01) break;
  }

  return entries;
}

interface UseAmortizationScheduleReturn {
  debts: Debt[];
  schedule: AmortizationSchedule | null;
  loading: boolean;
  error: string | null;
  selectedDebtId: number | null;
  setSelectedDebtId: (id: number | null) => void;
  frequency: PaymentFrequency;
  setFrequency: (freq: PaymentFrequency) => void;
  refresh: () => void;
}

const useAmortizationSchedule = (): UseAmortizationScheduleReturn => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [schedule, setSchedule] = useState<AmortizationSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await debtsAPI.getAll({
        status: 'active',
        includeDeleted: false,
        limit: 500,
        sortBy: 'dueDate',
        sortOrder: 'ASC',
      });
      if (!response.status) throw new Error(response.message);
      const debtsData = response.data.data || [];
      setDebts(debtsData);
      if (!selectedDebtId && debtsData.length > 0) {
        setSelectedDebtId(debtsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load debts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDebtId]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  useEffect(() => {
    if (!selectedDebtId) {
      setSchedule(null);
      return;
    }

    const debt = debts.find(d => d.id === selectedDebtId);
    if (!debt) {
      setSchedule(null);
      return;
    }

    const startDate = new Date(debt.createdAt);
    const endDate = new Date(debt.dueDate);
    if (isNaN(endDate.getTime())) {
      setError('Invalid due date for selected debt');
      setSchedule(null);
      return;
    }

    const principal = debt.totalAmount;
    const annualRate = debt.interestRate || 0;

    const entries = generateSchedule(principal, annualRate, startDate, endDate, frequency);

    const totalPayments = entries.reduce((sum, e) => sum + e.paymentAmount, 0);
    const totalInterest = entries.reduce((sum, e) => sum + e.interestAmount, 0);

    setSchedule({
      debtId: debt.id,
      debtName: debt.name,
      borrowerName: debt.borrower?.name || 'Unknown',
      principal,
      annualInterestRate: annualRate,
      totalPeriods: entries.length,
      frequency,
      entries,
      totalPayments,
      totalInterest,
    });
    setError(null);
  }, [selectedDebtId, frequency, debts]);

  const refresh = useCallback(() => {
    fetchDebts();
  }, [fetchDebts]);

  return {
    debts,
    schedule,
    loading,
    error,
    selectedDebtId,
    setSelectedDebtId,
    frequency,
    setFrequency,
    refresh,
  };
};

export default useAmortizationSchedule;