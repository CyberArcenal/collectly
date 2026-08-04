// src/main/services/SyncQueueService.js
//@ts-check
const { logger } = require("../utils/logger");

class SyncQueueService {
  constructor() {
    this.queueRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const SyncQueue = require("../entities/SyncQueue");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.queueRepository = AppDataSource.getRepository(SyncQueue);
    console.log("SyncQueueService initialized");
  }

  async getRepository() {
    if (!this.queueRepository) {
      await this.initialize();
    }
    return this.queueRepository;
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {import("typeorm").Repository<any>}
   */
  _getRepo(qr) {
    const SyncQueue = require("../entities/SyncQueue");
    const hasManager = qr && typeof qr === "object" && !!qr.manager;

    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(SyncQueue);
    }
    const { AppDataSource } = require("../main/db/data-source");
    return AppDataSource.getRepository(SyncQueue);
  }

  // ============================================================
  // 📋 READ OPERATIONS
  // ============================================================

  /**
   * Get a queue item by ID
   * @param {number} id
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async getById(id, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.findOne({ where: { id } });
    } catch (error) {
      console.error(`[SyncQueueService] Failed to get queue item ${id}:`, error);
      return null;
    }
  }

  /**
   * Get pending queue items (pending or failed with retry count < maxRetries)
   * @param {number} limit - Max items to return
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async getPendingItems(limit = 50, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo
        .createQueryBuilder("queue")
        .where("queue.status IN (:...statuses)", {
          statuses: ["pending", "failed"],
        })
        .andWhere("queue.retryCount < queue.maxRetries")
        .orderBy("queue.createdAt", "ASC")
        .limit(limit)
        .getMany();
    } catch (error) {
      console.error("[SyncQueueService] Failed to get pending items:", error);
      return [];
    }
  }

  /**
   * Get queue items for a specific entity and ID
   * @param {string} entity
   * @param {number} entityId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async getByEntityId(entity, entityId, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.find({
        where: { entity, entityId },
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(`[SyncQueueService] Failed to get queue for ${entity}#${entityId}:`, error);
      return [];
    }
  }

  /**
   * Get queue items by status
   * @param {string} status - 'pending', 'processing', 'completed', 'failed'
   * @param {number} limit - Max items to return
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async getByStatus(status, limit = 50, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.find({
        where: { status },
        order: { createdAt: "ASC" },
        take: limit,
      });
    } catch (error) {
      console.error(`[SyncQueueService] Failed to get queue by status ${status}:`, error);
      return [];
    }
  }

  /**
   * Count pending items
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<number>}
   */
  async countPending(qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.count({
        where: [
          { status: "pending" },
          { status: "failed", retryCount: { $lt: 5 } },
        ],
      });
    } catch (error) {
      console.error("[SyncQueueService] Failed to count pending items:", error);
      return 0;
    }
  }

  /**
   * Get queue statistics
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async getStats(qr = null) {
    try {
      const repo = this._getRepo(qr);
      const counts = await repo
        .createQueryBuilder("queue")
        .select("queue.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("queue.status")
        .getRawMany();

      const total = await repo.count();
      const stats = { total, byStatus: {} };

      for (const item of counts) {
        stats.byStatus[item.status] = parseInt(item.count, 10);
      }

      // Get average retry count for failed items
      const avgRetry = await repo
        .createQueryBuilder("queue")
        .select("AVG(queue.retryCount)", "avg")
        .where("queue.status = :status", { status: "failed" })
        .getRawOne();

      stats.avgRetryForFailed = parseFloat(avgRetry?.avg) || 0;

      return stats;
    } catch (error) {
      console.error("[SyncQueueService] Failed to get queue stats:", error);
      return { total: 0, byStatus: {}, avgRetryForFailed: 0 };
    }
  }

  // ============================================================
  // ✏️ WRITE OPERATIONS
  // ============================================================

  /**
   * Add item to sync queue
   * @param {string} entity - Entity name
   * @param {number} entityId - Record ID
   * @param {string} action - 'create', 'update', 'delete'
   * @param {Object} data - Record data
   * @param {number} maxRetries - Max retry attempts (default: 5)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
  async enqueue(entity, entityId, action, data = null, maxRetries = 5, qr = null) {
    try {
      const { saveDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      const SyncQueue = require("../entities/SyncQueue");

      // Check if there's already a pending item for this entity/id
      const existing = await repo.findOne({
        where: {
          entity,
          entityId,
          status: "pending",
        },
      });

      if (existing) {
        // Update existing instead of creating new
        existing.action = action;
        existing.data = data;
        existing.updatedAt = new Date();
        await repo.save(existing);
        logger.debug(`[SyncQueue] Updated existing queue item for ${entity}#${entityId}`);
        return existing;
      }

      const item = repo.create({
        entity,
        entityId,
        action,
        data,
        status: "pending",
        retryCount: 0,
        maxRetries,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const saved = await saveDb(repo, item, { queryRunner: qr });
      logger.debug(`[SyncQueue] Enqueued ${action} for ${entity}#${entityId}`);
      return saved;
    } catch (error) {
      console.error(`[SyncQueueService] Failed to enqueue ${entity}#${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Enqueue multiple items in batch
   * @param {Array<{entity: string, entityId: number, action: string, data?: Object}>} items
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Array>}
   */
  async enqueueBatch(items, qr = null) {
    const results = [];
    for (const item of items) {
      try {
        const result = await this.enqueue(
          item.entity,
          item.entityId,
          item.action,
          item.data || null,
          5,
          qr
        );
        results.push({ success: true, item: result });
      } catch (error) {
        results.push({ success: false, error: error.message, item });
      }
    }
    return results;
  }

  /**
   * Mark queue item as processing
   * @param {number} id
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async markProcessing(id, qr = null) {
    try {
      const { updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      const item = await repo.findOne({ where: { id } });
      if (!item) {
        throw new Error(`Queue item ${id} not found`);
      }

      item.status = "processing";
      item.updatedAt = new Date();
      
      const saved = await updateDb(repo, item, { queryRunner: qr });
      return saved;
    } catch (error) {
      console.error(`[SyncQueueService] Failed to mark processing for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark queue item as completed
   * @param {number} id
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async markCompleted(id, qr = null) {
    try {
      const { updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      const item = await repo.findOne({ where: { id } });
      if (!item) {
        throw new Error(`Queue item ${id} not found`);
      }

      item.status = "completed";
      item.processedAt = new Date();
      item.updatedAt = new Date();
      item.errorMessage = null;
      
      const saved = await updateDb(repo, item, { queryRunner: qr });
      logger.debug(`[SyncQueue] Completed queue item ${id}`);
      return saved;
    } catch (error) {
      console.error(`[SyncQueueService] Failed to mark completed for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark queue item as failed (increment retry count)
   * @param {number} id
   * @param {string} errorMessage
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async markFailed(id, errorMessage, qr = null) {
    try {
      const { updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      const item = await repo.findOne({ where: { id } });
      if (!item) {
        throw new Error(`Queue item ${id} not found`);
      }

      item.retryCount += 1;
      item.errorMessage = errorMessage;
      item.status = item.retryCount >= item.maxRetries ? "failed" : "pending";
      item.updatedAt = new Date();
      
      const saved = await updateDb(repo, item, { queryRunner: qr });
      
      if (item.status === "failed") {
        logger.warn(`[SyncQueue] Queue item ${id} permanently failed after ${item.retryCount} retries`);
      } else {
        logger.debug(`[SyncQueue] Queue item ${id} failed, retry ${item.retryCount}/${item.maxRetries}`);
      }
      
      return saved;
    } catch (error) {
      console.error(`[SyncQueueService] Failed to mark failed for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reset a failed queue item for retry
   * @param {number} id
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async resetForRetry(id, qr = null) {
    try {
      const { updateDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      const item = await repo.findOne({ where: { id } });
      if (!item) {
        throw new Error(`Queue item ${id} not found`);
      }

      if (item.status !== "failed") {
        throw new Error(`Queue item ${id} is not in failed status`);
      }

      item.status = "pending";
      item.errorMessage = null;
      item.updatedAt = new Date();
      
      const saved = await updateDb(repo, item, { queryRunner: qr });
      logger.info(`[SyncQueue] Reset queue item ${id} for retry`);
      return saved;
    } catch (error) {
      console.error(`[SyncQueueService] Failed to reset for retry ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a queue item
   * @param {number} id
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<boolean>}
   */
  async delete(id, qr = null) {
    try {
      const { removeDb } = require("../utils/dbUtils/dbActions");
      const repo = this._getRepo(qr);
      
      const item = await repo.findOne({ where: { id } });
      if (!item) {
        return false;
      }

      await removeDb(repo, item);
      logger.debug(`[SyncQueue] Deleted queue item ${id}`);
      return true;
    } catch (error) {
      console.error(`[SyncQueueService] Failed to delete queue item ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete all completed or failed items older than given days
   * @param {number} days - Age in days
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
        .where("status IN (:...statuses)", {
          statuses: ["completed", "failed"],
        })
        .andWhere("updatedAt < :cutoff", { cutoff })
        .execute();

      const count = result.affected || 0;
      logger.info(`[SyncQueue] Cleaned up ${count} old queue items`);
      return count;
    } catch (error) {
      console.error("[SyncQueueService] Failed to cleanup queue:", error);
      return 0;
    }
  }

  // ============================================================
  // 🔄 PROCESSING
  // ============================================================

  /**
   * Process a single queue item with a handler function
   * @param {Object} item - Queue item
   * @param {Function} handler - async (item) => { success: boolean, error?: string }
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
async processItem(item, handler, qr = null) {
  try {
    await this.markProcessing(item.id, qr);
    const result = await handler(item);
    
    if (result.success) {
      await this.markCompleted(item.id, qr);
      return {
        success: true,
        item: {
          id: item.id,
          entity: item.entity,
          entityId: item.entityId,
          action: item.action,
          recordId: result.record_id || item.entityId,
          actionPerformed: result.action || 'completed', // ← 'duplicate' or 'updated' etc.
          serverData: result.server_data, // ← for duplicates
          message: result.message,
        },
        error: null,
        willRetry: false,
      };
    } else {
      await this.markFailed(item.id, result.error || 'Unknown error', qr);
      return {
        success: false,
        item: {
          id: item.id,
          entity: item.entity,
          entityId: item.entityId,
          action: item.action,
        },
        error: result.error,
        willRetry: item.retryCount < item.maxRetries,
      };
    }
  } catch (error) {
    await this.markFailed(item.id, error.message, qr);
    return {
      success: false,
      item: {
        id: item.id,
        entity: item.entity,
        entityId: item.entityId,
        action: item.action,
      },
      error: error.message,
      willRetry: item.retryCount < item.maxRetries,
    };
  }
}

  /**
   * Process all pending queue items
   * @param {Function} handler - async (item) => { success: boolean, error?: string }
   * @param {number} limit - Max items to process (default: 50)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   */
async processQueue(handler, limit = 50, qr = null) {
  const items = await this.getPendingItems(limit, qr);
  const results = {
    total: items.length,
    processed: 0,
    completed: 0,
    failed: 0,
    duplicates: 0, // ← new
    errors: [],
    items: [], // ← new: store all processed items
  };

  for (const item of items) {
    const result = await this.processItem(item, handler, qr);
    results.processed++;
    results.items.push(result.item); // ← store item details
    
    if (result.success) {
      results.completed++;
      if (result.item.actionPerformed === 'duplicate') {
        results.duplicates++; // ← track duplicates
      }
    } else {
      results.failed++;
      results.errors.push({
        id: item.id,
        entity: item.entity,
        entityId: item.entityId,
        error: result.error,
        willRetry: result.willRetry,
      });
    }
  }

  logger.info(`[SyncQueue] Processed ${results.processed} items: ${results.completed} completed, ${results.failed} failed, ${results.duplicates} duplicates`);
  return results;
}

  // ============================================================
  // 🧪 UTILITY METHODS
  // ============================================================

  /**
   * Check if an entity has pending queue items
   * @param {string} entity
   * @param {number} entityId - Optional specific ID
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<boolean>}
   */
  async hasPending(entity, entityId = null, qr = null) {
    try {
      const repo = this._getRepo(qr);
      const query = {
        where: {
          entity,
          status: "pending",
        },
      };
      if (entityId) {
        query.where.entityId = entityId;
      }
      const count = await repo.count(query);
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the next queue item for an entity (oldest pending)
   * @param {string} entity
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object | null>}
   */
  async getNextPending(entity, qr = null) {
    try {
      const repo = this._getRepo(qr);
      return await repo.findOne({
        where: { entity, status: "pending" },
        order: { createdAt: "ASC" },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all queue items for an entity (e.g., after successful full sync)
   * @param {string} entity
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<number>}
   */
  async clearEntity(entity, qr = null) {
    try {
      const repo = this._getRepo(qr);
      const result = await repo
        .createQueryBuilder()
        .delete()
        .where("entity = :entity", { entity })
        .execute();
      
      const count = result.affected || 0;
      logger.info(`[SyncQueue] Cleared ${count} queue items for ${entity}`);
      return count;
    } catch (error) {
      console.error(`[SyncQueueService] Failed to clear queue for ${entity}:`, error);
      return 0;
    }
  }
}

// Singleton instance
const syncQueueService = new SyncQueueService();
module.exports = syncQueueService;