// src/main/ipc/utils/sync/sync.config.js
//@ts-check

/**
 * Shared configuration for sync IPC handlers.
 * Contains entity lists, required fields, and formatting sets.
 */

/** All entities that can be synced, in the correct processing order */
const ENTITIES = [
  'PaymentMethod',
  'Borrower',
  'Debt',
  'LoanAgreement',
  'LoanApplication',
  'PaymentTransaction',
  'PenaltyTransaction',
];

/** Required fields per entity (snake_case) – must match server-side validation */
const ENTITY_REQUIRED_FIELDS = {
  'PaymentMethod': ['name'],
  'Borrower': ['name'],
  'Debt': ['name', 'total_amount', 'due_date', 'borrower_id'],
  'LoanAgreement': ['debt_id'],
  'LoanApplication': ['requested_amount', 'debtor_name', 'purpose', 'proposed_due_date'],
  'PaymentTransaction': ['amount', 'payment_date', 'debt_id'],
  'PenaltyTransaction': ['amount', 'penalty_date', 'debt_id'],
};

/** Fields that expect only a date (YYYY-MM-DD), not a full datetime */
const DATE_ONLY_FIELDS = new Set([
  'due_date',
  'proposed_due_date',
  'loan_start_date',
  'agreement_date',
  'payment_date',
  'penalty_date',
]);

/** Decimal fields that must be rounded to 2 decimal places and sent as strings */
const DECIMAL_FIELDS = new Set([
  'total_amount',
  'paid_amount',
  'remaining_amount',
  'requested_amount',
  'interest_rate',
  'penalty_rate',
  'amount',
  'refund_amount',
  'principal_amount',
]);

module.exports = {
  ENTITIES,
  ENTITY_REQUIRED_FIELDS,
  DATE_ONLY_FIELDS,
  DECIMAL_FIELDS,
};