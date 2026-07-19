// src/main/services/SyncConflictService.js
//@ts-check
const { logger } = require("../utils/logger");

class SyncConflictService {
  constructor() {
    this.conflictRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const SyncConflict = require("../entities/SyncConflict");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.conflictRepository = AppDataSource.getRepository(SyncConflict);
    console.log("SyncConflictService initialized");
  }

  async getRepository() {
    if (!this.conflictRepository) {
      await this.initialize();
    }
    return this.conflictRepository;
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {import("typeorm").Repository<any>}
   */
  _getRepo(qr) {
    const SyncConflict = require("../entities/SyncConflict");
    const hasManager = qr && typeof qr === "object" && !!qr.manager;

    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(SyncConflict);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(SyncConflict);
  }

  // ============================================================
  // 📋 READ OPERATIONS
  // ============================================================

  /**
   * Get a conflict by ID
   * @param {number} id
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async getById(id, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.findOne({ where: { id } });
    } catch (error) {
      console.error(`[SyncConflictService] Failed to get conflict ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all conflicts for a specific entity and entity ID
   * @param {string} entity
   * @param {number} entityId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async getByEntity(entity, entityId, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.find({
        where: { entity, entityId },
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(`[SyncConflictService] Failed to get conflicts for ${entity}#${entityId}:`, error);
      return [];
    }
  }

  /**
   * Get pending conflicts (resolution = 'pending')
   * @param {number} limit - Max items to return
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async getPending(limit = 50, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.find({
        where: { resolution: "pending" },
        order: { createdAt: "ASC" },
        take: limit,
      });
    } catch (error) {
      console.error("[SyncConflictService] Failed to get pending conflicts:", error);
      return [];
    }
  }

  /**
   * Count pending conflicts
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<number>}
   */
  async countPending(qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.count({ where: { resolution: "pending" } });
    } catch (error) {
      console.error("[SyncConflictService] Failed to count pending conflicts:", error);
      return 0;
    }
  }

  /**
   * Get conflict statistics
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async getStats(qr = null) {
    try {
      const repo = this._getRepo(qr);
      const counts = await repo
        .createQueryBuilder("conflict")
        .select("conflict.resolution", "resolution")
        .addSelect("COUNT(*)", "count")
        .groupBy("conflict.resolution")
        .getRawMany();

      const total = await repo.count();
      const stats = { total, byResolution: {} };

      for (const item of counts) {
        stats.byResolution[item.resolution] = parseInt(item.count, 10);
      }

      // Get conflicts by entity
      const byEntity = await repo
        .createQueryBuilder("conflict")
        .select("conflict.entity", "entity")
        .addSelect("COUNT(*)", "count")
        .where("conflict.resolution = :resolution", { resolution: "pending" })
        .groupBy("conflict.entity")
        .orderBy("count", "DESC")
        .getRawMany();

      stats.pendingByEntity = byEntity.map((item) => ({
        entity: item.entity,
        count: parseInt(item.count, 10),
      }));

      return stats;
    } catch (error) {
      console.error("[SyncConflictService] Failed to get conflict stats:", error);
      return { total: 0, byResolution: {}, pendingByEntity: [] };
    }
  }

  // ============================================================
  // ✏️ WRITE OPERATIONS
  // ============================================================

  /**
   * Create a new conflict record
   * @param {string} entity
   * @param {number} entityId
   * @param {Object} localData
   * @param {Object} serverData
   * @param {Date} localUpdatedAt
   * @param {Date} serverUpdatedAt
   * @param {string} notes - Optional notes
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async createConflict(
    entity,
    entityId,
    localData,
    serverData,
    localUpdatedAt,
    serverUpdatedAt,
    notes = null,
    qr = null
  ) {
    try {
      const { saveDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      const SyncConflict = require("../entities/SyncConflict");

      // Check if there's already a pending conflict for this entity/id
      const existing = await repo.findOne({
        where: {
          entity,
          entityId,
          resolution: "pending",
        },
      });

      if (existing) {
        // Update existing conflict with new data
        existing.localData = localData;
        existing.serverData = serverData;
        existing.localUpdatedAt = localUpdatedAt;
        existing.serverUpdatedAt = serverUpdatedAt;
        existing.notes = notes || existing.notes;
        existing.updatedAt = new Date();
        await repo.save(existing);
        logger.debug(`[SyncConflict] Updated existing conflict for ${entity}#${entityId}`);
        return existing;
      }

      const conflict = repo.create({
        entity,
        entityId,
        localData,
        serverData,
        resolution: "pending",
        localUpdatedAt,
        serverUpdatedAt,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const saved = await saveDb(repo, conflict, { queryRunner: qr });
      logger.warn(`[SyncConflict] Created conflict for ${entity}#${entityId}`);
      return saved;
    } catch (error) {
      console.error(`[SyncConflictService] Failed to create conflict for ${entity}#${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a conflict
   * @param {number} conflictId
   * @param {string} resolution - 'local', 'server', 'manual', 'merged'
   * @param {string} resolvedBy - User who resolved
   * @param {Object} mergedData - Optional merged data (only for 'merged')
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async resolveConflict(conflictId, resolution, resolvedBy = "system", mergedData = null, qr = null) {
    try {
      const { updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);

      const conflict = await repo.findOne({ where: { id: conflictId } });
      if (!conflict) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      if (conflict.resolution !== "pending") {
        throw new Error(`Conflict ${conflictId} is already resolved (${conflict.resolution})`);
      }

      const validResolutions = ["local", "server", "manual", "merged"];
      if (!validResolutions.includes(resolution)) {
        throw new Error(`Invalid resolution: ${resolution}. Must be one of ${validResolutions.join(", ")}`);
      }

      conflict.resolution = resolution;
      conflict.resolvedBy = resolvedBy;
      conflict.resolvedAt = new Date();
      conflict.updatedAt = new Date();

      // If merged, store the merged data
      if (resolution === "merged" && mergedData) {
        conflict.mergedData = mergedData;
      }

      const saved = await updateDb(repo, conflict, { queryRunner: qr });
      logger.info(`[SyncConflict] Resolved conflict ${conflictId} with ${resolution} by ${resolvedBy}`);
      return saved;
    } catch (error) {
      console.error(`[SyncConflictService] Failed to resolve conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Auto-resolve conflicts using Last Write Wins (server priority)
   * @param {string} entity
   * @param {number} entityId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async autoResolveForEntity(entity, entityId, qr = null) {
    try {
      const conflicts = await this.getByEntity(entity, entityId, qr);
      const pending = conflicts.filter((c) => c.resolution === "pending");

      if (pending.length === 0) {
        return { resolved: 0, skipped: 0 };
      }

      let resolved = 0;
      for (const conflict of pending) {
        // LWW: server wins if server timestamp is newer
        const localTime = new Date(conflict.localUpdatedAt);
        const serverTime = new Date(conflict.serverUpdatedAt);

        if (serverTime >= localTime) {
          await this.resolveConflict(conflict.id, "server", "system", null, qr);
        } else {
          await this.resolveConflict(conflict.id, "local", "system", null, qr);
        }
        resolved++;
      }

      logger.info(`[SyncConflict] Auto-resolved ${resolved} conflicts for ${entity}#${entityId}`);
      return { resolved, skipped: 0 };
    } catch (error) {
      console.error(`[SyncConflictService] Failed to auto-resolve for ${entity}#${entityId}:`, error);
      return { resolved: 0, skipped: 0, error: error.message };
    }
  }

  /**
   * Auto-resolve all pending conflicts (server priority)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async autoResolveAll(qr = null) {
    try {
      const pending = await this.getPending(1000, qr);
      let resolved = 0;
      let failed = 0;

      for (const conflict of pending) {
        try {
          const localTime = new Date(conflict.localUpdatedAt);
          const serverTime = new Date(conflict.serverUpdatedAt);

          const resolution = serverTime >= localTime ? "server" : "local";
          await this.resolveConflict(conflict.id, resolution, "system", null, qr);
          resolved++;
        } catch (err) {
          failed++;
          console.error(`[SyncConflict] Failed to auto-resolve ${conflict.id}:`, err);
        }
      }

      logger.info(`[SyncConflict] Auto-resolved ${resolved} conflicts (${failed} failed)`);
      return { resolved, failed, total: pending.length };
    } catch (error) {
      console.error("[SyncConflictService] Failed to auto-resolve all conflicts:", error);
      throw error;
    }
  }

  /**
   * Delete a conflict record (e.g., after manual resolution or cleanup)
   * @param {number} conflictId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<boolean>}
   */
  async delete(conflictId, qr = null) {
    try {
      const { removeDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);

      const conflict = await repo.findOne({ where: { id: conflictId } });
      if (!conflict) {
        return false;
      }

      await removeDb(repo, conflict);
      logger.debug(`[SyncConflict] Deleted conflict ${conflictId}`);
      return true;
    } catch (error) {
      console.error(`[SyncConflictService] Failed to delete conflict ${conflictId}:`, error);
      return false;
    }
  }

  /**
   * Delete resolved conflicts older than given days
   * @param {number} days
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<number>}
   */
  async cleanup(days = 30, qr = null) {
    try {
      const repo = this._getRepo(qr);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const result = await repo
        .createQueryBuilder()
        .delete()
        .where("resolution != :resolution", { resolution: "pending" })
        .andWhere("resolvedAt < :cutoff", { cutoff })
        .execute();

      const count = result.affected || 0;
      logger.info(`[SyncConflict] Cleaned up ${count} old resolved conflicts`);
      return count;
    } catch (error) {
      console.error("[SyncConflictService] Failed to cleanup conflicts:", error);
      return 0;
    }
  }

  // ============================================================
  // 🧪 UTILITY METHODS
  // ============================================================

  /**
   * Check if a conflict exists for a specific entity/id
   * @param {string} entity
   * @param {number} entityId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<boolean>}
   */
  async hasConflict(entity, entityId, qr = null) {
    try {
      const repo = this._getRepo(qr);
      const count = await repo.count({
        where: { entity, entityId, resolution: "pending" },
      });
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the most recent conflict for an entity/id
   * @param {string} entity
   * @param {number} entityId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async getLatestConflict(entity, entityId, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.findOne({
        where: { entity, entityId },
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Get summary of conflicts by entity
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async getEntitySummary(qr = null) {
    try {
      const repo = this._getRepo(qr);
      const results = await repo
        .createQueryBuilder("conflict")
        .select("conflict.entity", "entity")
        .addSelect("COUNT(*)", "total")
        .addSelect(
          "SUM(CASE WHEN conflict.resolution = 'pending' THEN 1 ELSE 0 END)",
          "pending"
        )
        .addSelect(
          "SUM(CASE WHEN conflict.resolution != 'pending' THEN 1 ELSE 0 END)",
          "resolved"
        )
        .groupBy("conflict.entity")
        .getRawMany();

      return results.map((item) => ({
        entity: item.entity,
        total: parseInt(item.total, 10),
        pending: parseInt(item.pending, 10),
        resolved: parseInt(item.resolved, 10),
      }));
    } catch (error) {
      console.error("[SyncConflictService] Failed to get entity summary:", error);
      return [];
    }
  }
}

// Singleton instance
const syncConflictService = new SyncConflictService();
module.exports = syncConflictService;