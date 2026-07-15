export interface LoanApplicationCreateData {
  debtorId?: number | null;
  newDebtor?: {
    name: string;
    contact?: string;
    email?: string;
    address?: string;
    notes?: string;
  };
  requestedAmount: number;
  purpose: string;
  proposedDueDate: string;
  interestRate?: number | null;
}