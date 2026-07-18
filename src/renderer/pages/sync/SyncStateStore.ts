export type SyncEntityKey =
  | "borrowers"
  | "debts"
  | "payment_transactions"
  | "penalty_transactions"
  | "loan_applications"
  | "notifications";

export interface SyncEntityDefinition {
  key: SyncEntityKey;
  label: string;
  description: string;
}

export interface PendingRecord {
  id: string;
  title: string;
  detail: string;
}

export interface SyncTaskInfo {
  taskId: string;
  entityKey: SyncEntityKey;
  status: "running" | "completed" | "failed" | "canceled";
  startedAt: number;
  updatedAt: number;
  current: number;
  total: number;
  errorMessage?: string;
}

export interface PersistedSyncState {
  lastSyncTimestamps: Record<SyncEntityKey, string>;
  pendingRecords: Record<SyncEntityKey, number>;
  activeTasks: Record<SyncEntityKey, SyncTaskInfo>;
}

const STORAGE_KEY = "collectly_sync_state_v1";

export const SYNC_ENTITIES: SyncEntityDefinition[] = [
  {
    key: "borrowers",
    label: "Borrowers",
    description: "Customer and borrower details waiting to be synced.",
  },
  {
    key: "debts",
    label: "Debts",
    description: "Loan and payment obligations pending server sync.",
  },
  {
    key: "payment_transactions",
    label: "Payment Transactions",
    description: "Payment records that have not been pushed to the server.",
  },
  {
    key: "penalty_transactions",
    label: "Penalty Transactions",
    description: "Penalty updates queued for sync.",
  },
  {
    key: "loan_applications",
    label: "Loan Applications",
    description: "Loan applications pending final submission.",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Queued notifications and reminders waiting to sync.",
  },
];

const defaultPendingRecords: Record<SyncEntityKey, number> = {
  borrowers: 2,
  debts: 0,
  payment_transactions: 4,
  penalty_transactions: 1,
  loan_applications: 3,
  notifications: 0,
};

const defaultState: PersistedSyncState = {
  lastSyncTimestamps: {},
  pendingRecords: defaultPendingRecords,
  activeTasks: {},
};

function safeParseState(raw: string | null): PersistedSyncState {
  if (!raw) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSyncState>;
    return {
      lastSyncTimestamps: {
        ...defaultState.lastSyncTimestamps,
        ...(parsed.lastSyncTimestamps || {}),
      },
      pendingRecords: {
        ...defaultPendingRecords,
        ...(parsed.pendingRecords || {}),
      },
      activeTasks: parsed.activeTasks || {},
    };
  } catch {
    return defaultState;
  }
}

export function loadSyncState(): PersistedSyncState {
  if (typeof window === "undefined" || !window.localStorage) {
    return defaultState;
  }

  return safeParseState(window.localStorage.getItem(STORAGE_KEY));
}

export function saveSyncState(state: PersistedSyncState): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearSyncState(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getPendingCount(entityKey: SyncEntityKey): number {
  const state = loadSyncState();
  return state.pendingRecords[entityKey] ?? 0;
}

export function getPendingRecords(entityKey: SyncEntityKey): PendingRecord[] {
  const count = getPendingCount(entityKey);
  return Array.from({ length: count }, (_, index) => ({
    id: `${entityKey}-${index + 1}`,
    title: `${entityKey.replace(/_/g, " ")} record #${index + 1}`,
    detail: `Locally saved ${entityKey.replace(/_/g, " ")} waiting to sync.`,
  }));
}

export function createTaskInfo(
  entityKey: SyncEntityKey,
  total: number,
): SyncTaskInfo {
  return {
    taskId: `${entityKey}-${Date.now()}`,
    entityKey,
    status: "running",
    startedAt: Date.now(),
    updatedAt: Date.now(),
    current: 0,
    total,
  };
}

export function updatePendingCount(
  state: PersistedSyncState,
  entityKey: SyncEntityKey,
  newCount: number,
): PersistedSyncState {
  return {
    ...state,
    pendingRecords: {
      ...state.pendingRecords,
      [entityKey]: newCount,
    },
  };
}

export function updateLastSyncTimestamp(
  state: PersistedSyncState,
  entityKey: SyncEntityKey,
  timestamp: string,
): PersistedSyncState {
  return {
    ...state,
    lastSyncTimestamps: {
      ...state.lastSyncTimestamps,
      [entityKey]: timestamp,
    },
  };
}

export function updateTaskInfo(
  state: PersistedSyncState,
  task: SyncTaskInfo,
): PersistedSyncState {
  return {
    ...state,
    activeTasks: {
      ...state.activeTasks,
      [task.entityKey]: task,
    },
  };
}

export function removeTaskInfo(
  state: PersistedSyncState,
  entityKey: SyncEntityKey,
): PersistedSyncState {
  const activeTasks = { ...state.activeTasks };
  delete activeTasks[entityKey];
  return {
    ...state,
    activeTasks,
  };
}
