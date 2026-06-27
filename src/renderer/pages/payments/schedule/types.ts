
export interface ScheduledPayment {
  debtId: number;
  debtName: string;
  borrowerId: number;
  borrowerName: string;
  dueDate: string | Date;
  amountDue: number;
  contact: string | null;
  email: string | null;
}

export interface PaymentScheduleFilters {
  dateRange: "30" | "60" | "90" | "all";
  viewMode: "calendar" | "list";
}

// Optional: Add pagination type if needed elsewhere
export interface PaymentSchedulePagination {
  page: number;
  limit: number;
  totalItems: number;
}