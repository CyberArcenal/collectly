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
  // 🔄 FULL SYNC
  // ============================================================

  /**
   * Perform a full sync of all entities
   * @param {string} user - User performing the sync
   * @returns {Promise<Object>} Sync results
   */
  async fullSync(user = "system") {
    if (this.isSyncing) {
      throw new Error("Sync already in progress");
    }

    // Check availability
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
      conflicts: [],
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

      for (const entity of this.entities) {
        try {
          await this._syncEntity(entity, user);
          this.syncResults.success++;
        } catch (error) {
          this.syncResults.failed++;
          this.syncResults.errors.push({
            entity: entity.name,
            error: error.message,
          });
          await syncMetadataService.logError(entity.name, error.message);
        }
        this.syncResults.total++;
        this._updateProgress({
          completed: this.syncResults.total,
          currentEntity: null,
        });
      }

      // Auto-resolve conflicts after sync
      const conflictResult = await syncConflictService.autoResolveAll();
      this.syncResults.conflicts = conflictResult;

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
  // 🔄 INCREMENTAL SYNC (Based on queue)
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
  // 🔄 ENTITY SYNC
  // ============================================================

  /**
   * Sync a specific entity
   * @param {Object} entity - Entity configuration
   * @param {string} user - User performing the sync
   * @param {boolean} force - Force sync even if no changes
   * @returns {Promise<Object>}
   */
  async _syncEntity(entity, user = "system", force = false) {
    this._updateProgress({
      currentEntity: entity.name,
    });

    logger.info(`[SyncService] Syncing ${entity.name}...`);

    // Update status to syncing
    await syncMetadataService.updateSyncStatus(entity.name, "syncing");

    try {
      // Get last sync time
      const lastSync = await syncMetadataService.getLastSyncTime(entity.name);

      // Get repository and fetch changed records
      const { AppDataSource } = require("../main/db/data-source");
      const repo = AppDataSource.getRepository(entity.name);

      let qb = repo.createQueryBuilder(entity.name);

      if (!force && lastSync) {
        // Only get records changed since last sync
        qb = qb.where(
          `${entity.name}.updatedAt >= :since OR ${entity.name}.createdAt >= :since`,
          { since: lastSync },
        );

        // Include soft-deleted records
        if (repo.hasColumn("deletedAt")) {
          qb = qb.orWhere(`${entity.name}.deletedAt >= :since`, {
            since: lastSync,
          });
        }
      }

      const records = await qb.getMany();

      if (records.length === 0) {
        logger.info(`[SyncService] No changes for ${entity.name}`);
        await syncMetadataService.updateSyncStatus(entity.name, "completed");
        return { count: 0, message: "No changes" };
      }

      // Prepare data for server
      const data = records.map((record) => {
        const obj = {};
        for (const field of entity.fields) {
          if (record[field] !== undefined) {
            // Convert Dates to ISO strings
            if (record[field] instanceof Date) {
              obj[field] = record[field].toISOString();
            } else {
              obj[field] = record[field];
            }
          }
        }
        return obj;
      });

      // Send to server
      const url = await serverUrl();
      if (!url) throw new Error("Server URL not configured");
      onlineClient.setBaseUrl(url);

      const response = await onlineClient.post(
        `/api/v1/sync/${entity.endpoint}/`,
        {
          data,
          user: user,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Update metadata
      await syncMetadataService.updateSyncTime(entity.name, records.length);

      // Check for conflicts in response
      if (result.conflicts && result.conflicts.length > 0) {
        for (const conflict of result.conflicts) {
          await syncConflictService.createConflict(
            entity.name,
            conflict.id,
            conflict.local,
            conflict.server,
            new Date(conflict.localUpdatedAt),
            new Date(conflict.serverUpdatedAt),
            conflict.notes ||
              `Auto-detected conflict for ${entity.name}#${conflict.id}`,
          );
        }
        logger.warn(
          `[SyncService] ${result.conflicts.length} conflicts detected for ${entity.name}`,
        );
      }

      logger.info(`[SyncService] Synced ${records.length} ${entity.name}(s)`);
      return { count: records.length, conflicts: result.conflicts || [] };
    } catch (error) {
      logger.error(`[SyncService] Failed to sync ${entity.name}:`, error);
      await syncMetadataService.logError(entity.name, error.message);
      throw error;
    }
  }

  /**
   * Sync a specific entity by name (public method)
   * @param {string} entityName - Entity name
   * @param {string} user - User performing the sync
   * @param {boolean} force - Force sync
   * @returns {Promise<Object>}
   */
  async syncEntityByName(entityName, user = "system", force = false) {
    const entity = this.entities.find((e) => e.name === entityName);
    if (!entity) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    const availability = await this.isSyncAvailable();
    if (!availability.available) {
      throw new Error(`Sync not available: ${availability.message}`);
    }

    return await this._syncEntity(entity, user, force);
  }

  // ============================================================
  // 📊 SYNC STATUS
  // ============================================================

  /**
   * Get current sync status
   * @returns {Promise<Object>}
   */
  async getSyncStatus() {
    const metadata = await syncMetadataService.getAllMetadata();
    const queueStats = await syncQueueService.getStats();
    const conflictStats = await syncConflictService.getStats();

    return {
      isSyncing: this.isSyncing,
      progress: this.currentProgress,
      metadata,
      queue: queueStats,
      conflicts: conflictStats,
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
    };
  }

  // ============================================================
  // 🧹 CLEANUP
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
  // 📦 ENQUEUE RECORDS FOR SYNC
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
  // 🧪 TEST / DEBUG METHODS
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
    const entity = this.entities.find(e => e.name === entityName);
    if (!entity) {
      throw new Error(`Unknown entity: ${entityName}`);
    }

    const { AppDataSource } = require("../main/db/data-source");
    const repo = AppDataSource.getRepository(entityName);
    
    const records = await repo.find();
    
    return {
      entity: entityName,
      records: records.map(r => {
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
}

// Singleton instance
const syncService = new SyncService();
module.exports = syncService;
