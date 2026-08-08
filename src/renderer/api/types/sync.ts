// src/renderer/api/types/sync.ts

/**
 * Task Progress - from server's GET /task/{id}/
 */
export interface TaskProgress {
  taskId: string;
  userId?: number;
  username?: string;
  entity: string;
  batchId?: string;
  status: "queued" | "running" | "completed" | "failed";
  total: number;
  processed: number;
  failed: number;
  currentEntity: string | null;
  result: {
    entities?: Record<string, { saved: number; failed: number; errors: any[] }>;
    duplicates?: Array<{ record_id: any; server_data: any; entity: string }>;
    total_processed?: number;
    total_failed?: number;
    [key: string]: any;
  };
  error: string | null;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Sync Summary - from server's GET /status/
 */
export interface UserSyncSummary {
  user: string;
  userId: number;
  totalEntities: number;
  syncedEntities: number;
  pendingSyncs: number;
  totalRecordsSynced: number;
  lastSync: string | null;
  entities: EntitySyncStatus[];
  // Additional fields from local merge (optional)
  localSnapshots?: any[];
  pendingChangesCount?: number;
  source?: string;
}

/**
 * Entity Sync Status - per entity in UserSyncSummary
 */
export interface EntitySyncStatus {
  entity: string;
  status: "idle" | "syncing" | "completed" | "failed";
  lastSyncedAt: string | null;
  totalSynced: number;
  lastSyncCount: number;
  lastSyncIp: string | null;
  lastSyncUserAgent: string | null;
  hasError: boolean;
  errorMessage: string | null;
  // Additional local fields
  recordCount?: number;
  localRecordCount?: number;
  localStatus?: string;
  hasLocalChanges?: boolean;
}

/**
 * Full Sync Request
 */
export interface FullSyncRequest {
  entities: Record<string, { records: any[] }>;
  metadata?: {
    client_user?: string;
    device_id?: string;
    app_version?: string;
  };
}

/**
 * Full Sync Response
 */
export interface FullSyncResponse {
  taskId: string;
  status: string;
  entities: string[];
  totalRecords: number;
}

/**
 * Pending Change - local change detection
 */
export interface PendingChange {
  entity: string;
  reason: string;
  currentCount: number;
  previousCount: number;
  hasSnapshot: boolean;
  error?: string;
}

/**
 * Sync Progress (for UI)
 */
export interface SyncProgress {
  status: "idle" | "syncing" | "completed" | "failed";
  total: number;
  completed: number;
  failed: number;
  currentEntity: string | null;
}

/**
 * Sync Snapshot (local entity state)
 */
export interface SyncSnapshot {
  id: number;
  entity: string;
  lastSyncedAt: string | null;
  recordCount: number;
  dataHash: string | null;
  lastSyncTaskId: string | null;
  syncStatus: "idle" | "syncing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}