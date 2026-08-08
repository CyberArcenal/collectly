// src/main/services/SyncSnapshotService.js
//@ts-check
const crypto = require("crypto");
const { AppDataSource } = require("../main/db/data-source");

/**
 * SyncSnapshotService
 * 
 * Manages the sync_snapshots table which tracks the state of each entity
 * for change detection and UI status display.
 * 
 * This replaces the old SyncMetadataService, SyncConflictService, and SyncQueueService.
 */
class SyncSnapshotService {
  constructor() {
    this.repository = null;
    this.isInitialized = false;
  }

  /**
   * Get or initialize the repository
   */
  async getRepository() {
    if (!this.repository) {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      this.repository = AppDataSource.getRepository("SyncSnapshot");
      this.isInitialized = true;
    }
    return this.repository;
  }

  // ============================================================
  // 📋 READ OPERATIONS
  // ============================================================

  /**
   * Get snapshot for a specific entity
   * @param {string} entityName - Entity name (e.g., 'Borrower')
   * @returns {Promise<Object|null>}
   */
  async getSnapshot(entityName) {
    try {
      const repo = await this.getRepository();
      return await repo.findOne({ where: { entity: entityName } });
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to get snapshot for ${entityName}:`, error);
      return null;
    }
  }

  /**
   * Get all snapshots
   * @returns {Promise<Array>}
   */
  async getAllSnapshots() {
    try {
      const repo = await this.getRepository();
      return await repo.find({ order: { entity: "ASC" } });
    } catch (error) {
      console.error("[SyncSnapshotService] Failed to get all snapshots:", error);
      return [];
    }
  }

  /**
   * Get snapshots by status
   * @param {string} status - 'idle', 'syncing', 'completed', 'failed'
   * @returns {Promise<Array>}
   */
  async getSnapshotsByStatus(status) {
    try {
      const repo = await this.getRepository();
      return await repo.find({
        where: { syncStatus: status },
        order: { entity: "ASC" },
      });
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to get snapshots by status ${status}:`, error);
      return [];
    }
  }

  /**
   * Get sync summary for all entities
   * @param {Array<string>} entityNames - Optional filter
   * @returns {Promise<Array>}
   */
  async getSyncSummary(entityNames = null) {
    try {
      const repo = await this.getRepository();
      const query = repo.createQueryBuilder("snapshot");
      
      if (entityNames && entityNames.length > 0) {
        query.where("snapshot.entity IN (:...entityNames)", { entityNames });
      }
      
      const snapshots = await query.getMany();
      
      return snapshots.map((s) => ({
        entity: s.entity,
        status: s.syncStatus,
        lastSyncedAt: s.lastSyncedAt,
        recordCount: s.recordCount,
        hasPending: s.syncStatus === "syncing" || s.syncStatus === "failed",
        lastSyncTaskId: s.lastSyncTaskId,
      }));
    } catch (error) {
      console.error("[SyncSnapshotService] Failed to get sync summary:", error);
      return [];
    }
  }

  /**
   * Get count of entities with pending sync
   * @returns {Promise<number>}
   */
  async getPendingCount() {
    try {
      const repo = await this.getRepository();
      return await repo.count({
        where: [{ syncStatus: "syncing" }, { syncStatus: "failed" }],
      });
    } catch (error) {
      console.error("[SyncSnapshotService] Failed to get pending count:", error);
      return 0;
    }
  }

  // ============================================================
  // ✏️ WRITE OPERATIONS
  // ============================================================

  /**
   * Update or create snapshot after successful sync
   * @param {string} entityName - Entity name
   * @param {number} recordCount - Number of records at sync time
   * @param {string|null} dataHash - Optional hash of records
   * @param {string|null} taskId - Optional task ID
   * @returns {Promise<Object>}
   */
  async updateSnapshot(entityName, recordCount, dataHash = null, taskId = null) {
    try {
      const repo = await this.getRepository();
      const now = new Date();

      let snapshot = await repo.findOne({ where: { entity: entityName } });

      if (snapshot) {
        snapshot.lastSyncedAt = now;
        snapshot.recordCount = recordCount;
        if (dataHash) snapshot.dataHash = dataHash;
        if (taskId) snapshot.lastSyncTaskId = taskId;
        snapshot.syncStatus = "completed";
        snapshot.updatedAt = now;
        await repo.save(snapshot);
      } else {
        snapshot = repo.create({
          entity: entityName,
          lastSyncedAt: now,
          recordCount: recordCount,
          dataHash: dataHash,
          lastSyncTaskId: taskId,
          syncStatus: "completed",
        });
        await repo.save(snapshot);
      }

      console.log(`[SyncSnapshotService] Updated snapshot for ${entityName}: ${recordCount} records`);
      return snapshot;
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to update snapshot for ${entityName}:`, error);
      throw error;
    }
  }

  /**
   * Mark snapshot as syncing (start of sync)
   * @param {string} entityName - Entity name
   * @returns {Promise<Object>}
   */
  async markSyncing(entityName) {
    try {
      const repo = await this.getRepository();
      let snapshot = await repo.findOne({ where: { entity: entityName } });
      
      if (!snapshot) {
        snapshot = repo.create({
          entity: entityName,
          syncStatus: "syncing",
        });
      } else {
        snapshot.syncStatus = "syncing";
        snapshot.updatedAt = new Date();
      }
      await repo.save(snapshot);
      
      console.log(`[SyncSnapshotService] Marked ${entityName} as syncing`);
      return snapshot;
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to mark ${entityName} as syncing:`, error);
      throw error;
    }
  }

  /**
   * Mark all entities as syncing (for full sync)
   * @param {Array<string>} entityNames - List of entity names
   * @returns {Promise<Array>}
   */
  async markAllSyncing(entityNames) {
    const results = [];
    for (const entityName of entityNames) {
      try {
        const result = await this.markSyncing(entityName);
        results.push(result);
      } catch (error) {
        console.error(`[SyncSnapshotService] Failed to mark ${entityName} as syncing:`, error);
      }
    }
    return results;
  }

  /**
   * Mark snapshot as failed
   * @param {string} entityName - Entity name
   * @returns {Promise<Object>}
   */
  async markFailed(entityName) {
    try {
      const repo = await this.getRepository();
      let snapshot = await repo.findOne({ where: { entity: entityName } });
      
      if (snapshot) {
        snapshot.syncStatus = "failed";
        snapshot.updatedAt = new Date();
        await repo.save(snapshot);
        console.log(`[SyncSnapshotService] Marked ${entityName} as failed`);
      } else {
        snapshot = repo.create({
          entity: entityName,
          syncStatus: "failed",
        });
        await repo.save(snapshot);
        console.log(`[SyncSnapshotService] Created failed snapshot for ${entityName}`);
      }
      return snapshot;
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to mark ${entityName} as failed:`, error);
      throw error;
    }
  }

  /**
   * Mark all entities as failed
   * @param {Array<string>} entityNames - List of entity names
   * @returns {Promise<Array>}
   */
  async markAllFailed(entityNames) {
    const results = [];
    for (const entityName of entityNames) {
      try {
        const result = await this.markFailed(entityName);
        results.push(result);
      } catch (error) {
        console.error(`[SyncSnapshotService] Failed to mark ${entityName} as failed:`, error);
      }
    }
    return results;
  }

  /**
   * Reset snapshot to idle
   * @param {string} entityName - Entity name
   * @returns {Promise<Object>}
   */
  async resetSnapshot(entityName) {
    try {
      const repo = await this.getRepository();
      let snapshot = await repo.findOne({ where: { entity: entityName } });
      
      if (snapshot) {
        snapshot.syncStatus = "idle";
        snapshot.updatedAt = new Date();
        await repo.save(snapshot);
        console.log(`[SyncSnapshotService] Reset ${entityName} to idle`);
      }
      return snapshot;
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to reset ${entityName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a snapshot (for cleanup)
   * @param {string} entityName - Entity name
   * @returns {Promise<boolean>}
   */
  async deleteSnapshot(entityName) {
    try {
      const repo = await this.getRepository();
      const result = await repo.delete({ entity: entityName });
      console.log(`[SyncSnapshotService] Deleted snapshot for ${entityName}`);
      return result.affected > 0;
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to delete snapshot for ${entityName}:`, error);
      return false;
    }
  }

  // ============================================================
  // 🔍 CHANGE DETECTION
  // ============================================================

  /**
   * Compute hash of all records for an entity
   * Uses record IDs and updated_at timestamps for efficient change detection
   * @param {string} entityName - Entity name
   * @param {Array} records - List of records
   * @returns {string|null} - SHA-256 hash or null if no records
   */
  computeEntityHash(entityName, records) {
    if (!records || records.length === 0) {
      return null;
    }

    try {
      // Sort records by ID to ensure consistent hash
      const sorted = [...records].sort((a, b) => {
        const idA = a.id || a._id || 0;
        const idB = b.id || b._id || 0;
        return String(idA).localeCompare(String(idB));
      });

      const hash = crypto.createHash("sha256");
      
      // Include record count and each record's ID + updatedAt
      hash.update(`count:${sorted.length}`);
      
      for (const record of sorted) {
        const id = record.id || record._id || "";
        const updated = record.updatedAt || record.updated_at || "";
        const deleted = record.deletedAt || record.deleted_at || "";
        hash.update(`${id}:${updated}:${deleted}`);
      }
      
      return hash.digest("hex");
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to compute hash for ${entityName}:`, error);
      return null;
    }
  }

  /**
   * Check if an entity has changed since last sync
   * @param {string} entityName - Entity name
   * @param {Array} currentRecords - Current records from database
   * @returns {Promise<Object>}
   */
  async hasEntityChanged(entityName, currentRecords) {
    try {
      const snapshot = await this.getSnapshot(entityName);
      
      if (!snapshot) {
        // No snapshot - consider changed (never synced)
        return {
          changed: true,
          reason: "Never synced before",
          currentCount: currentRecords.length,
          previousCount: 0,
          currentHash: null,
          previousHash: null,
          hasSnapshot: false,
        };
      }

      const currentHash = this.computeEntityHash(entityName, currentRecords);
      
      // If no records and snapshot has records, consider changed (deletions)
      if (!currentHash && snapshot.recordCount > 0) {
        return {
          changed: true,
          reason: "All records deleted",
          currentCount: 0,
          previousCount: snapshot.recordCount,
          currentHash: null,
          previousHash: snapshot.dataHash,
          hasSnapshot: true,
        };
      }

      // Compare hash
      const changed = currentHash !== snapshot.dataHash;
      
      return {
        changed,
        reason: changed ? "Data has changed" : "No changes detected",
        currentCount: currentRecords.length,
        previousCount: snapshot.recordCount,
        currentHash,
        previousHash: snapshot.dataHash,
        hasSnapshot: true,
      };
    } catch (error) {
      console.error(`[SyncSnapshotService] Failed to check changes for ${entityName}:`, error);
      return {
        changed: true,
        reason: "Error checking changes",
        currentCount: currentRecords.length,
        previousCount: 0,
        hasSnapshot: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all entities with pending changes
   * @param {Array<string>} entityNames - List of entities to check
   * @param {Function} getRecordsFn - Function to get records for an entity
   * @returns {Promise<Array>}
   */
  async getPendingChanges(entityNames, getRecordsFn) {
    const results = [];

    for (const entityName of entityNames) {
      try {
        const records = await getRecordsFn(entityName);
        const changeStatus = await this.hasEntityChanged(entityName, records);
        if (changeStatus.changed) {
          results.push({
            entity: entityName,
            reason: changeStatus.reason,
            currentCount: changeStatus.currentCount,
            previousCount: changeStatus.previousCount,
            hasSnapshot: changeStatus.hasSnapshot,
            changed: true,
          });
        }
      } catch (error) {
        console.error(`[SyncSnapshotService] Failed to check ${entityName}:`, error);
        results.push({
          entity: entityName,
          reason: "Error checking changes",
          currentCount: 0,
          previousCount: 0,
          hasSnapshot: false,
          changed: true,
          error: error.message,
        });
      }
    }

    return results;
  }

  // ============================================================
  // 🧹 CLEANUP
  // ============================================================

  /**
   * Cleanup old snapshots (soft delete - mark as deleted)
   * @param {number} days - Age in days
   * @returns {Promise<number>}
   */
  async cleanupOldSnapshots(days = 90) {
    try {
      const repo = await this.getRepository();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      // Find old completed snapshots
      const oldSnapshots = await repo.find({
        where: {
          syncStatus: "completed",
          lastSyncedAt: { $lt: cutoff },
        },
      });

      // Instead of deleting, we could archive or just remove
      const count = oldSnapshots.length;
      for (const snapshot of oldSnapshots) {
        await repo.remove(snapshot);
      }

      console.log(`[SyncSnapshotService] Cleaned up ${count} old snapshots (>${days} days)`);
      return count;
    } catch (error) {
      console.error("[SyncSnapshotService] Failed to cleanup old snapshots:", error);
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new SyncSnapshotService();