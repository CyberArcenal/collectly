// src/main/services/SyncService.js
//@ts-check
const { logger } = require("../utils/logger");
const syncMetadataService = require("./SyncMetadataService");
const syncQueueService = require("./SyncQueueService");
const syncConflictService = require("./SyncConflictService");
const onlineClient = require("../utils/onlineClient");
const { serverUrl, syncMode } = require("../utils/system");

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.currentProgress = {
      total: 0,
      completed: 0,
      failed: 0,
      currentEntity: null,
      status: "idle", // idle | syncing | completed | failed
    };
    this.progressCallbacks = [];
    this.syncResults = null;
    this.activeTasks = {}; // { taskId: { entity, status, progress } }

    // Entity configuration for syncing
    this.entities = [
      {
        name: "Borrower",
        table: "borrowers",
        endpoint: "borrowers",
        fields: [
          "id",
          "name",
          "contact",
          "email",
          "address",
          "notes",
          "deletedAt",
          "createdAt",
          "updatedAt",
        ],
        idField: "id",
      },
      {
        name: "Debt",
        table: "debts",
        endpoint: "debts",
        fields: [
          "id",
          "name",
          "totalAmount",
          "paidAmount",
          "remainingAmount",
          "dueDate",
          "status",
          "interestRate",
          "penaltyRate",
          "borrowerId",
          "deletedAt",
          "createdAt",
          "updatedAt",
        ],
        idField: "id",
      },
      {
        name: "PaymentTransaction",
        table: "payment_transactions",
        endpoint: "payments",
        fields: [
          "id",
          "amount",
          "paymentDate",
          "reference",
          "notes",
          "methodId",
          "debtId",
          "deletedAt",
          "recordedAt",
        ],
        idField: "id",
      },
      {
        name: "PenaltyTransaction",
        table: "penalty_transactions",
        endpoint: "penalties",
        fields: [
          "id",
          "amount",
          "penaltyDate",
          "reason",
          "debtId",
          "deletedAt",
          "createdAt",
        ],
        idField: "id",
      },
      {
        name: "LoanAgreement",
        table: "loan_agreements",
        endpoint: "loan-agreements",
        fields: [
          "id",
          "status",
          "agreementDate",
          "lenderName",
          "termsText",
          "filePath",
          "debtId",
          "deletedAt",
          "signedAt",
          "signedBy",
          "principalAmount",
          "interestRate",
          "penaltyRate",
          "dueDate",
          "purpose",
          "loanStartDate",
          "anniversaryDay",
        ],
        idField: "id",
      },
      {
        name: "LoanApplication",
        table: "loan_applications",
        endpoint: "loan-applications",
        fields: [
          "id",
          "debtorId",
          "debtorName",
          "debtorContact",
          "debtorEmail",
          "debtorAddress",
          "requestedAmount",
          "purpose",
          "proposedDueDate",
          "interestRate",
          "status",
          "approvedAt",
          "rejectedAt",
          "approvedBy",
          "rejectionReason",
          "deletedAt",
          "createdAt",
          "updatedAt",
        ],
        idField: "id",
      },
      {
        name: "PaymentMethod",
        table: "payment_methods",
        endpoint: "payment-methods",
        fields: [
          "id",
          "name",
          "description",
          "icon",
          "isDefault",
          "createdAt",
          "updatedAt",
        ],
        idField: "id",
      },
    ];
  }

  // ============================================================
  // 📋 PROGRESS TRACKING
  // ============================================================

  /**
   * Register a progress callback
   * @param {Function} callback - Function called with progress updates
   * @returns {Function} Unsubscribe function
   */
  onProgress(callback) {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Update progress and notify callbacks
   * @param {Object} update - Partial progress update
   */
  _updateProgress(update) {
    this.currentProgress = { ...this.currentProgress, ...update };
    for (const callback of this.progressCallbacks) {
      try {
        callback(this.currentProgress);
      } catch (err) {
        console.error("Progress callback error:", err);
      }
    }
  }

  /**
   * Update task progress
   * @param {string} taskId - Task ID
   * @param {Object} progress - Progress update
   */
  _updateTaskProgress(taskId, progress) {
    if (this.activeTasks[taskId]) {
      this.activeTasks[taskId] = { ...this.activeTasks[taskId], ...progress };
    }
  }

  // ============================================================
  // 🔍 CHECK SYNC REQUIREMENTS
  // ============================================================

  /**
   * Check if sync is available (online mode and server reachable)
   * @returns {Promise<{available: boolean, message?: string}>}
   */
  async isSyncAvailable() {
    try {
      const mode = await syncMode();
      if (mode === "offline") {
        return { available: false, message: "App is in offline mode" };
      }

      const url = await serverUrl();
      if (!url) {
        return { available: false, message: "Server URL not configured" };
      }

      onlineClient.setBaseUrl(url);
      const response = await onlineClient.get("/health/");
      if (!response.ok) {
        return { available: false, message: "Server not reachable" };
      }

      return { available: true };
    } catch (error) {
      return { available: false, message: error.message };
    }
  }

  // ============================================================
  // 🆕 TASK-BASED SYNC
  // ============================================================

  /**
   * Start a sync task for a specific entity
   * @param {string} entityName - Entity name
   * @param {Array} records - Records to sync
   * @param {string} user - User performing the sync
   * @param {boolean} force - Force sync even if no changes
   * @returns {Promise<{taskId: string, status: string, entity: string, total: number}>}
   */
  async startSyncTask(entityName, records, user = "system", force = false) {
    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      throw new Error(`Sync not available: ${availability.message}`);
    }

    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.post(`/api/v1/sync/${entityName}/`, {
      data: records,
      user: user,
      force: force,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const taskId = result.data?.taskId || result.taskId;

    // Track active task
    this.activeTasks[taskId] = {
      entity: entityName,
      status: "queued",
      total: result.data?.total || records.length,
      processed: 0,
      startedAt: new Date(),
    };

    this._updateProgress({
      status: "syncing",
      currentEntity: entityName,
      total: this.activeTasks[taskId].total,
      completed: 0,
    });

    return {
      taskId: taskId,
      status: result.data?.status || "queued",
      entity: entityName,
      total: result.data?.total || records.length,
    };
  }

  /**
   * Get task status from server
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>}
   */
  async getTaskStatus(taskId) {
    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      throw new Error(`Sync not available: ${availability.message}`);
    }

    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get(`/api/v1/sync/task/${taskId}/`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Task not found");
      }
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const data = result.data || result;

    // Update local task tracking
    if (this.activeTasks[taskId]) {
      this.activeTasks[taskId] = {
        ...this.activeTasks[taskId],
        status: data.status,
        processed: data.processed || data.processed || 0,
        result: data.result,
        error: data.error,
      };
    }

    // Update progress if task is running
    if (data.status === "running" || data.status === "queued") {
      this._updateProgress({
        status: "syncing",
        currentEntity: data.entity || this.activeTasks[taskId]?.entity,
        total: data.total || this.activeTasks[taskId]?.total || 0,
        completed: data.processed || this.activeTasks[taskId]?.processed || 0,
      });
    }

    // Check if task is complete
    if (data.status === "completed") {
      this._updateProgress({
        status: "completed",
        currentEntity: null,
        completed: data.total || this.activeTasks[taskId]?.total || 0,
      });
      // Clean up active task
      delete this.activeTasks[taskId];
    }

    if (data.status === "failed") {
      this._updateProgress({
        status: "failed",
        currentEntity: null,
      });
      // Clean up active task
      delete this.activeTasks[taskId];
    }

    return data;
  }

  /**
   * Poll task status until completion
   * @param {string} taskId - Task ID
   * @param {Function} onProgress - Callback for each progress update
   * @param {number} interval - Polling interval in ms
   * @param {number} timeout - Max time to poll in ms
   * @returns {Promise<Object>}
   */
  async pollTaskStatus(taskId, onProgress, interval = 1000, timeout = 300000) {
    const startTime = Date.now();

    while (true) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error("Task polling timed out");
      }

      try {
        const status = await this.getTaskStatus(taskId);
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === "completed") {
          return status;
        }

        if (status.status === "failed") {
          throw new Error(status.error || "Task failed");
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        // If task not found, it might have been completed and cleaned up
        if (error.message === "Task not found") {
          // Check if we have a result cached
          return {
            status: "completed",
            message: "Task completed (no longer tracked)",
          };
        }
        throw error;
      }
    }
  }

  /**
   * Get list of sync tasks
   * @param {string} entity - Filter by entity
   * @param {string} status - Filter by status
   * @param {number} limit - Max items
   * @returns {Promise<{items: Array, count: number}>}
   */
  async getTaskList(entity, status, limit = 50) {
    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      return { items: [], count: 0 };
    }

    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = new URLSearchParams();
    if (entity) query.append("entity", entity);
    if (status) query.append("status", status);
    if (limit) query.append("limit", limit);

    const response = await onlineClient.get(
      `/api/v1/sync/tasks/?${query.toString()}`,
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.data || result;
  }


  /**
 * Get the number of pending records for a given entity.
 * @param {string} entityName
 * @returns {Promise<number>}
 */
async getPendingCount(entityName) {
  const entity = this.entities.find(e => e.name === entityName);
  if (!entity) throw new Error(`Unknown entity: ${entityName}`);

  const lastSync = await syncMetadataService.getLastSyncTime(entityName);
  const { AppDataSource } = require("../main/db/data-source");
  const repo = AppDataSource.getRepository(entityName);

  const qb = repo.createQueryBuilder(entityName);
  if (lastSync) {
    qb.where(`${entityName}.updatedAt > :lastSync`, { lastSync })
      .orWhere(`${entityName}.createdAt > :lastSync`, { lastSync })
      .orWhere(`${entityName}.deletedAt > :lastSync`, { lastSync });
  }
  // If lastSync is null (never synced), count all records
  return await qb.getCount();
}

  // ============================================================
  // 🔄 FULL SYNC (Task-Based)
  // ============================================================

  /**
   * Perform a full sync of all entities (task-based)
   * @param {string} user - User performing the sync
   * @returns {Promise<Object>} Sync results with task IDs
   */
  async fullSync(user = "system", force = false) {
    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      throw new Error(`Sync not available: ${availability.message}`);
    }

    this.isSyncing = true;
    this.syncResults = {
      startedAt: new Date(),
      completedAt: null,
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      entities: {},
      tasks: [],
    };

    this._updateProgress({
      status: "syncing",
      total: this.entities.length,
      completed: 0,
      currentEntity: null,
    });

    try {
      // Initialize metadata for all entities
      const entityNames = this.entities.map((e) => e.name);
      await syncMetadataService.initializeEntities(entityNames);

      // Start tasks for each entity
      for (const entity of this.entities) {
        try {
          // Get all records for this entity
          const { records } = force 
        ? await this.getEntityRecords(entity.name) 
        : await this.getPendingRecords(entity.name);

          if (records.length === 0) {
            this.syncResults.entities[entity.name] = {
              status: "skipped",
              count: 0,
              message: "No records to sync",
            };
            this.syncResults.success++;
            this.syncResults.total++;
            continue;
          }

          // Start sync task
          const result = await this.startSyncTask(entity.name, records, user, force);

          this.syncResults.entities[entity.name] = {
            status: "task_queued",
            count: records.length,
            taskId: result.taskId,
          };
          this.syncResults.tasks.push({
            entity: entity.name,
            taskId: result.taskId,
            status: result.status,
          });
          this.syncResults.success++;
          this.syncResults.total++;

          this._updateProgress({
            completed: this.syncResults.total,
            currentEntity: null,
          });
        } catch (error) {
          this.syncResults.failed++;
          this.syncResults.errors.push({
            entity: entity.name,
            error: error.message,
          });
          this.syncResults.entities[entity.name] = {
            status: "failed",
            error: error.message,
          };
          await syncMetadataService.logError(entity.name, error.message);
        }
      }

      this.syncResults.completedAt = new Date();
      this._updateProgress({
        status: "completed",
      });

      logger.info(
        `[SyncService] Full sync completed: ${this.syncResults.success} succeeded, ${this.syncResults.failed} failed`,
      );
      return this.syncResults;
    } catch (error) {
      this.syncResults.completedAt = new Date();
      this._updateProgress({
        status: "failed",
      });
      logger.error("[SyncService] Full sync failed:", error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // ============================================================
  // 🔄 INCREMENTAL SYNC (Queue-based)
  // ============================================================

  /**
   * Perform incremental sync (process pending queue items)
   * @param {string} user - User performing the sync
   * @param {number} limit - Max items to process
   * @returns {Promise<Object>}
   */
  async incrementalSync(user = "system", limit = 50) {
    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      throw new Error(`Sync not available: ${availability.message}`);
    }

    this.isSyncing = true;
    this._updateProgress({
      status: "syncing",
      currentEntity: "Queue",
    });

    try {
      const results = await syncQueueService.processQueue(async (item) => {
        return await this._processQueueItem(item, user);
      }, limit);

      this._updateProgress({
        status: "completed",
      });

      logger.info(
        `[SyncService] Incremental sync completed: ${results.completed} succeeded, ${results.failed} failed`,
      );
      return results;
    } catch (error) {
      this._updateProgress({
        status: "failed",
      });
      logger.error("[SyncService] Incremental sync failed:", error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single queue item
   * @param {Object} item - Queue item
   * @param {string} user - User performing the action
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async _processQueueItem(item, user = "system") {
    try {
      const entity = this.entities.find((e) => e.name === item.entity);
      if (!entity) {
        return { success: false, error: `Unknown entity: ${item.entity}` };
      }

      const url = await serverUrl();
      if (!url) throw new Error("Server URL not configured");
      onlineClient.setBaseUrl(url);

      let endpoint = `/api/v1/sync/${entity.endpoint}/`;
      let method = "POST";
      let body = {
        data: [item.data],
        user: user,
        action: item.action,
      };

      // For delete actions, use DELETE method
      if (item.action === "delete") {
        endpoint = `/api/v1/sync/${entity.endpoint}/${item.entityId}/`;
        method = "DELETE";
        body = { user: user };
      }

      const response = await onlineClient.request(endpoint, {
        method,
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Server error: ${response.status} - ${errorText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // 📊 SYNC STATUS (Existing)
  // ============================================================

  /**
   * Get current sync status
   * @returns {Promise<Object>}
   */
  async getSyncStatus() {
    const metadata = await syncMetadataService.getAllMetadata();
    const queueStats = await syncQueueService.getStats();
    const conflictStats = await syncConflictService.getStats();

    // Include active task status
    const activeTasks = Object.values(this.activeTasks);

    const metadataWithPending = await Promise.all(
  metadata.map(async (item) => {
    const pendingCount = await this.getPendingCount(item.entity);
    return {
      ...item,
      pendingCount, // new field
    };
  })
);

    return {
      isSyncing: this.isSyncing,
      progress: this.currentProgress,
      metadata: metadataWithPending,
      queue: queueStats,
      conflicts: conflictStats,
      activeTasks: activeTasks,
      entities: metadata.map((m) => ({
        name: m.entity,
        status: m.status,
        lastSyncedAt: m.lastSyncedAt,
        totalSynced: m.totalSynced || 0,
        lastSyncCount: m.lastSyncCount || 0,
        hasPending: m.status === "syncing" || m.status === "failed",
      })),
    };
  }

  /**
   * Get sync summary (quick overview)
   * @returns {Promise<Object>}
   */
  async getSyncSummary() {
    const metadata = await syncMetadataService.getSyncSummary();
    const queuePending = await syncQueueService.countPending();
    const conflictPending = await syncConflictService.countPending();

    return {
      ...metadata,
      queuePending,
      conflictPending,
      isSyncing: this.isSyncing,
      lastSync: this.syncResults?.completedAt || null,
      activeTasks: Object.keys(this.activeTasks).length,
    };
  }

  // ============================================================
  // 🧹 CLEANUP (Existing)
  // ============================================================

  /**
   * Cleanup old sync data
   * @param {number} days - Age in days
   * @returns {Promise<Object>}
   */
  async cleanup(days = 30) {
    const queueDeleted = await syncQueueService.cleanup(days);
    const conflictDeleted = await syncConflictService.cleanup(days);

    return {
      queueDeleted,
      conflictDeleted,
    };
  }

  /**
   * Reset sync state (for troubleshooting)
   * @param {string|null} entity - Specific entity or null for all
   * @returns {Promise<Object>}
   */
  async resetSyncState(entity = null) {
    if (entity) {
      const entityConfig = this.entities.find((e) => e.name === entity);
      if (!entityConfig) {
        throw new Error(`Unknown entity: ${entity}`);
      }
      await syncMetadataService.resetSyncStatus(entity);
      await syncQueueService.clearEntity(entity);
      return { entity, reset: true };
    } else {
      const count = await syncMetadataService.resetAllSyncStatuses();
      return { reset: true, entitiesReset: count };
    }
  }

  // ============================================================
  // 📦 ENQUEUE RECORDS FOR SYNC (Existing)
  // ============================================================

  /**
   * Enqueue a record for sync (called when a record is created/updated/deleted)
   * @param {string} entityName - Entity name
   * @param {number} entityId - Record ID
   * @param {string} action - 'create', 'update', 'delete'
   * @param {Object} data - Record data
   * @returns {Promise<Object>}
   */
  async enqueueForSync(entityName, entityId, action, data = null) {
    const entity = this.entities.find((e) => e.name === entityName);
    if (!entity) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    // Only enqueue if not in offline mode
    const mode = await syncMode();
    if (mode === "offline") {
      // In offline mode, always enqueue for later sync
      return await syncQueueService.enqueue(entityName, entityId, action, data);
    }

    // In online mode, try to sync immediately, fallback to queue
    try {
      const availability = await this.isSyncAvailable();
      if (availability.available) {
        // Process immediately
        const item = {
          entity: entityName,
          entityId,
          action,
          data,
          maxRetries: 5,
        };
        const result = await this._processQueueItem(item, "system");
        if (result.success) {
          return { synced: true, message: "Record synced immediately" };
        }
        // If failed, fallback to queue
      }
    } catch (error) {
      // Fallback to queue
    }

    // Queue for later
    return await syncQueueService.enqueue(entityName, entityId, action, data);
  }

  // ============================================================
  // 🧪 TEST / DEBUG METHODS (Existing)
  // ============================================================

  /**
   * Force a sync test (for development)
   * @param {string} entityName - Entity name
   * @returns {Promise<Object>}
   */
  async testSync(entityName = "Borrower") {
    const entity = this.entities.find((e) => e.name === entityName);
    if (!entity) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    // Get all records (not just changed)
    const { AppDataSource } = require("../main/db/data-source");
    const repo = AppDataSource.getRepository(entity.name);
    const records = await repo.find();

    return {
      entity: entity.name,
      totalRecords: records.length,
      sample: records.slice(0, 3),
    };
  }

  /**
   * Get all records for a specific entity (for full sync)
   * @param {string} entityName
   * @returns {Promise<{ entity: string, records: Array }>}
   */
  async getEntityRecords(entityName) {
    const entity = this.entities.find((e) => e.name === entityName);
    if (!entity) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    const { AppDataSource } = require("../main/db/data-source");
    const repo = AppDataSource.getRepository(entityName);

    const records = await repo.find();

    return {
      entity: entityName,
      records: records.map((r) => {
        const obj = {};
        for (const field of entity.fields) {
          if (r[field] !== undefined) {
            if (r[field] instanceof Date) {
              obj[field] = r[field].toISOString();
            } else {
              obj[field] = r[field];
            }
          }
        }
        return obj;
      }),
    };
  }

  /**
 * Sync a specific entity by name (fetches pending records and starts a task)
 * @param {string} entityName
 * @param {string} user
 * @param {boolean} force - if true, sync all records, not just pending
 * @returns {Promise<{taskId: string, status: string, entity: string, total: number}>}
 */
async syncEntityByName(entityName, user = "system", force = false) {
  const { records } = force
    ? await this.getEntityRecords(entityName)
    : await this.getPendingRecords(entityName);

  if (records.length === 0) {
    throw new Error(`No pending records for ${entityName}`);
  }

  return await this.startSyncTask(entityName, records, user, force);
}

  /**
   * Get records that have changed since the last sync for a given entity.
   * @param {string} entityName
   * @returns {Promise<{ entity: string, records: Array, lastSync: Date | null }>}
   */
  async getPendingRecords(entityName) {
    const entity = this.entities.find((e) => e.name === entityName);
    if (!entity) throw new Error(`Unknown entity: ${entityName}`);

    const lastSync = await syncMetadataService.getLastSyncTime(entityName);
    const { AppDataSource } = require("../main/db/data-source");
    const repo = AppDataSource.getRepository(entityName);

    // Build a query that returns records where updatedAt > lastSync (or createdAt > lastSync, or deletedAt > lastSync)
    const qb = repo.createQueryBuilder(entityName);
    if (lastSync) {
      qb.where(`${entityName}.updatedAt > :lastSync`, { lastSync })
        .orWhere(`${entityName}.createdAt > :lastSync`, { lastSync })
        .orWhere(`${entityName}.deletedAt > :lastSync`, { lastSync });
    }
    // If lastSync is null (never synced), return all records
    const records = await qb.getMany();

    // Transform to plain objects (same as getEntityRecords)
    const transformed = records.map((r) => {
      const obj = {};
      for (const field of entity.fields) {
        if (r[field] !== undefined) {
          obj[field] =
            r[field] instanceof Date ? r[field].toISOString() : r[field];
        }
      }
      return obj;
    });

    return { entity: entityName, records: transformed, lastSync };
  }

  /**
   * Get active sync tasks
   * @returns {Object}
   */
  getActiveTasks() {
    return this.activeTasks;
  }

  /**
   * Clear active tasks (for cleanup)
   */
  clearActiveTasks() {
    this.activeTasks = {};
  }
}

// Singleton instance
const syncService = new SyncService();
module.exports = syncService;
