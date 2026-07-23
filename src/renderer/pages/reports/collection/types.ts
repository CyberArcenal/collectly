// src/renderer/pages/reports/collection/types.ts
export interface CollectionDataPoint {
  date: string;               // YYYY-MM-DD
  actualCollected: number;
  expectedCollected: number;
}

export interface CollectionReport {
  payments_by_debtor: { debtorId: number; debtorName: string; totalPaid: number; transactionCount: number; lastPaymentDate: string; }[];
  data_points: CollectionDataPoint[];
  average_per_day: number;
  collection_rate: number;
  total_expected: number;
  total_actual: number;
  period: {
    from: string;
    to: string;
  };
  totalActual: number;
  totalExpected: number;
  collectionRate: number;
  averagePerDay: number;
  dataPoints: CollectionDataPoint[];
  paymentsByDebtor: Array<{
    debtorId: number;
    debtorName: string;
    totalPaid: number;
    transactionCount: number;
    lastPaymentDate: string;
  }>;
}