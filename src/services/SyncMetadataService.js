// src/main/services/SyncMetadataService.js
//@ts-check
const { logger } = require("../utils/logger");

class SyncMetadataService {
  constructor() {
    this.metadataRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const SyncMetadata = require("../entities/SyncMetadata");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.metadataRepository = AppDataSource.getRepository(SyncMetadata);
    console.log("SyncMetadataService initialized");
  }

  async getRepository() {
    if (!this.metadataRepository) {
      await this.initialize();
    }
    return this.metadataRepository;
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {import("typeorm").Repository<any>}
   */
  _getRepo(qr) {
    const SyncMetadata = require("../entities/SyncMetadata");
    const hasManager = qr && typeof qr === "object" && !!qr.manager;

    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(SyncMetadata);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(SyncMetadata);
  }

  // ============================================================
  // 📋 READ OPERATIONS
  // ============================================================

  /**
   * Get last sync time for an entity
   * @param {string} entity - Entity name (e.g., 'Borrower')
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Date | null>}
   */
  async getLastSyncTime(entity, qr = null) {
    try {
      const repo = this._getRepo(qr);
      const record = await repo.findOne({ where: { entity } });
      return record ? record.lastSyncedAt : null;
    } catch (error) {
      console.error(`[SyncMetadataService] Failed to get last sync time for ${entity}:`, error);
      return null;
    }
  }

  /**
   * Get sync status for an entity
   * @param {string} entity - Entity name
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async getSyncStatus(entity, qr = null) {
    try {
      const repo = this._getRepo(qr);
      const record = await repo.findOne({ where: { entity } });
      
      if (!record) {
        return {
          entity,
          status: 'idle',
          lastSyncedAt: null,
          lastSyncCount: 0,
          totalSynced: 0,
          hasPending: false,
        };
      }

      return {
        entity: record.entity,
        status: record.status,
        lastSyncedAt: record.lastSyncedAt,
        lastSyncCount: record.lastSyncCount,
        totalSynced: record.totalSynced,
        errorMessage: record.errorMessage,
        hasPending: record.status === 'syncing' || record.status === 'failed',
      };
    } catch (error) {
      console.error(`[SyncMetadataService] Failed to get sync status for ${entity}:`, error);
      return {
        entity,
        status: 'error',
        lastSyncedAt: null,
        lastSyncCount: 0,
        totalSynced: 0,
        hasPending: false,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Get all sync metadata records
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async getAllMetadata(qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.find({
        order: { entity: 'ASC' },
      });
    } catch (error) {
      console.error('[SyncMetadataService] Failed to get all metadata:', error);
      return [];
    }
  }

  /**
   * Get entity with pending sync (failed or syncing)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async getPendingEntities(qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.find({
        where: [
          { status: 'failed' },
          { status: 'syncing' },
        ],
        order: { updatedAt: 'DESC' },
      });
    } catch (error) {
      console.error('[SyncMetadataService] Failed to get pending entities:', error);
      return [];
    }
  }

  // ============================================================
  // ✏️ WRITE OPERATIONS
  // ============================================================

  /**
   * Update sync time for an entity after successful sync
   * @param {string} entity - Entity name
   * @param {number} count - Number of records synced
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async updateSyncTime(entity, count, qr = null) {
    try {
      const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      let record = await repo.findOne({ where: { entity } });
      const now = new Date();

      if (!record) {
        // Create new record
        const SyncMetadata = require("../entities/SyncMetadata");
        record = repo.create({
          entity,
          lastSyncedAt: now,
          lastSyncCount: count,
          totalSynced: count,
          status: 'completed',
          errorMessage: null,
        });
        await saveDb(repo, record, { queryRunner: qr });
      } else {
        // Update existing record
        record.lastSyncedAt = now;
        record.lastSyncCount = count;
        record.totalSynced = (record.totalSynced || 0) + count;
        record.status = 'completed';
        record.errorMessage = null;
        record.updatedAt = now;
        await updateDb(repo, record, { queryRunner: qr });
      }

      logger.info(`[SyncMetadata] Updated sync time for ${entity}: ${count} records`);
      return record;
    } catch (error) {
      console.error(`[SyncMetadataService] Failed to update sync time for ${entity}:`, error);
      throw error;
    }
  }

  /**
   * Update sync status for an entity
   * @param {string} entity - Entity name
   * @param {string} status - 'idle', 'syncing', 'completed', 'failed'
   * @param {string|null} errorMessage - Optional error message
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async updateSyncStatus(entity, status, errorMessage = null, qr = null) {
    try {
      const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      let record = await repo.findOne({ where: { entity } });

      if (!record) {
        const SyncMetadata = require("../entities/SyncMetadata");
        record = repo.create({
          entity,
          status,
          errorMessage,
          lastSyncedAt: status === 'completed' ? new Date() : null,
        });
        await saveDb(repo, record, { queryRunner: qr });
      } else {
        record.status = status;
        record.errorMessage = errorMessage;
        record.updatedAt = new Date();
        
        if (status === 'completed') {
          record.lastSyncedAt = new Date();
        }
        if (status === 'syncing') {
          record.lastSyncStartedAt = new Date();
        }
        
        await updateDb(repo, record, { queryRunner: qr });
      }

      logger.info(`[SyncMetadata] Updated status for ${entity}: ${status}`);
      return record;
    } catch (error) {
      console.error(`[SyncMetadataService] Failed to update sync status for ${entity}:`, error);
      throw error;
    }
  }

  /**
   * Log sync error for an entity
   * @param {string} entity - Entity name
   * @param {string} errorMessage - Error message
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async logError(entity, errorMessage, qr = null) {
    return this.updateSyncStatus(entity, 'failed', errorMessage, qr);
  }

  /**
   * Reset sync status for an entity (for retry)
   * @param {string} entity - Entity name
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async resetSyncStatus(entity, qr = null) {
    return this.updateSyncStatus(entity, 'idle', null, qr);
  }

  /**
   * Reset all sync statuses (for full sync)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<number>}
   */
  async resetAllSyncStatuses(qr = null) {
    try {
      const { updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      const result = await repo.update(
        { status: 'failed' },
        { status: 'idle', errorMessage: null, updatedAt: new Date() }
      );

      logger.info(`[SyncMetadata] Reset ${result.affected} failed sync statuses`);
      return result.affected || 0;
    } catch (error) {
      console.error('[SyncMetadataService] Failed to reset sync statuses:', error);
      throw error;
    }
  }

  // ============================================================
  // 🧪 UTILITY METHODS
  // ============================================================

  /**
   * Check if an entity has pending sync
   * @param {string} entity - Entity name
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<boolean>}
   */
  async hasPendingSync(entity, qr = null) {
    try {
      const status = await this.getSyncStatus(entity, qr);
      return status.status === 'syncing' || status.status === 'failed';
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize metadata for all entities
   * @param {Array<string>} entities - List of entity names
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<number>}
   */
  async initializeEntities(entities, qr = null) {
    try {
      const repo = this._getRepo(qr);
      let created = 0;

      for (const entity of entities) {
        const exists = await repo.findOne({ where: { entity } });
        if (!exists) {
          const SyncMetadata = require("../entities/SyncMetadata");
          const record = repo.create({
            entity,
            status: 'idle',
            lastSyncedAt: null,
            lastSyncCount: 0,
            totalSynced: 0,
          });
          await repo.save(record);
          created++;
        }
      }

      logger.info(`[SyncMetadata] Initialized ${created} entities`);
      return created;
    } catch (error) {
      console.error('[SyncMetadataService] Failed to initialize entities:', error);
      throw error;
    }
  }

  /**
   * Get sync summary (total synced, pending, failed)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async getSyncSummary(qr = null) {
    try {
      const repo = this._getRepo(qr);
      const all = await repo.find();

      const summary = {
        totalEntities: all.length,
        totalSynced: 0,
        pending: 0,
        failed: 0,
        completed: 0,
        idle: 0,
        entities: {},
      };

      for (const record of all) {
        summary.totalSynced += record.totalSynced || 0;
        summary[record.status] = (summary[record.status] || 0) + 1;
        summary.entities[record.entity] = {
          status: record.status,
          lastSyncedAt: record.lastSyncedAt,
          totalSynced: record.totalSynced || 0,
          lastSyncCount: record.lastSyncCount || 0,
        };
      }

      return summary;
    } catch (error) {
      console.error('[SyncMetadataService] Failed to get sync summary:', error);
      return {
        totalEntities: 0,
        totalSynced: 0,
        pending: 0,
        failed: 0,
        completed: 0,
        idle: 0,
        entities: {},
      };
    }
  }
}

// Singleton instance
const syncMetadataService = new SyncMetadataService();
module.exports = syncMetadataService;