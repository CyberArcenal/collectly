// src/services/InterestRateChangeLogService.js
const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
class InterestRateChangeLogService {
  constructor() {
    this.logRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.logRepository = AppDataSource.getRepository(InterestRateChangeLog);
    console.log("InterestRateChangeLogService initialized");
  }

  async getRepository() {
    if (!this.logRepository) await this.initialize();
    return this.logRepository;
  }

  _getRepo(qr, entityClass) {
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[Global._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[Global._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Create a log entry for an interest rate change.
   * @param {string} settingKey - e.g., "default_interest_rate" or "loan_123"
   * @param {number|string} oldValue
   * @param {number|string} newValue
   * @param {string} user
   * @param {number|null} loanId - optional, for per‑loan changes
   * @param {string|null} reason
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  async createLog(
    settingKey,
    oldValue,
    newValue,
    user = "system",
    loanId = null,
    reason = null,
    queryRunner = null,
  ) {
    const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
    const repo = this._getRepo(queryRunner, InterestRateChangeLog);
    const log = repo.create({
      setting_key: settingKey,
      old_value: oldValue,
      new_value: newValue,
      changed_by: user,
      reason,
      loan_id: loanId,
    });
    const saved = await repo.save(log);
    await auditLogger.logCreate("InterestRateChangeLog", saved.id, saved, user);
    return saved;
  }

  /**
   * Get all log entries, optionally filtered.
   * @param {Object} filters
   * @param {string} [filters.settingKey]
   * @param {number} [filters.loanId]
   * @param {string} [filters.changedBy]
   * @param {Date|string} [filters.fromDate]
   * @param {Date|string} [filters.toDate]
   * @param {number} [page=1]
   * @param {number} [limit=50]
   */
  async getAllLogs(filters = {}, page = 1, limit = 50) {
    const repo = await this.getRepository();
    const qb = repo.createQueryBuilder("log").orderBy("log.changed_at", "DESC");

    if (filters.settingKey)
      qb.andWhere("log.setting_key = :key", { key: filters.settingKey });
    if (filters.loanId)
      qb.andWhere("log.loan_id = :loanId", { loanId: filters.loanId });
    if (filters.changedBy)
      qb.andWhere("log.changed_by = :user", { user: filters.changedBy });
    if (filters.fromDate)
      qb.andWhere("log.changed_at >= :from", {
        from: new Date(filters.fromDate),
      });
    if (filters.toDate)
      qb.andWhere("log.changed_at <= :to", { to: new Date(filters.toDate) });

    const result = await paginateQueryBuilder(qb, {
      page: page,
      limit: limit,
    });

    await auditLogger.logView("InterestRateChangeLog", null, "system");
    return result; // { data: [], pagination: {} }
  }

  /**
   * Get a single log entry by ID.
   */
  async getLogById(id) {
    const repo = await this.getRepository();
    const log = await repo.findOne({ where: { id } });
    if (!log) throw new Error(`Interest rate log #${id} not found`);
    return log;
  }

  /**
   * Get all logs for a specific loan.
   */
  async getLogsForLoan(loanId, page = 1, limit = 50) {
    return this.getAllLogs({ loanId }, page, limit);
  }

  /**
   * Delete a log entry (soft delete is not implemented; we remove it permanently).
   * Only for correction purposes – audit will track the deletion.
   */
  async deleteLog(id, user = "system", queryRunner = null) {
    const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
    const repo = this._getRepo(queryRunner, InterestRateChangeLog);
    const log = await repo.findOne({ where: { id } });
    if (!log) throw new Error(`Interest rate log #${id} not found`);
    await repo.remove(log);
    await auditLogger.logDelete("InterestRateChangeLog", id, log, user);
  }

  /**
   * Get statistics for interest rate change logs.
   * @param {Object} filters - optional date filters
   * @param {string} [filters.startDate] - YYYY-MM-DD
   * @param {string} [filters.endDate] - YYYY-MM-DD
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>}
   *   {
   *     totalChanges: number,
   *     mostFrequentSetting: { settingKey: string, count: number } | null,
   *     changesByUser: Array<{ user: string, count: number }>,
   *     changesByLoan: Array<{ loanId: number, count: number }>,
   *     averageChangeMagnitude: number,
   *     maxChangeMagnitude: number,
   *     minChangeMagnitude: number,
   *     changesLast30Days: number
   *   }
   */
  async getStatistics(filters = {}, qr = null) {
    const InterestRateChangeLog = require("../entities/InterestRateChangeLog");
    const repo = this._getRepo(qr, InterestRateChangeLog);

    const qb = repo.createQueryBuilder("log").where("log.deletedAt IS NULL");

    // Apply date filters if provided
    if (filters.startDate) {
      qb.andWhere("log.changedAt >= :startDate", {
        startDate: new Date(filters.startDate),
      });
    }
    if (filters.endDate) {
      qb.andWhere("log.changedAt <= :endDate", {
        endDate: new Date(filters.endDate),
      });
    }

    // Total changes
    const totalChanges = await qb.clone().getCount();

    if (totalChanges === 0) {
      return {
        totalChanges: 0,
        mostFrequentSetting: null,
        changesByUser: [],
        changesByLoan: [],
        averageChangeMagnitude: 0,
        maxChangeMagnitude: 0,
        minChangeMagnitude: 0,
        changesLast30Days: 0,
      };
    }

    // Most frequent setting_key
    const settingCounts = await qb
      .clone()
      .select("log.settingKey", "settingKey")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.settingKey")
      .orderBy("count", "DESC")
      .limit(1)
      .getRawOne();

    const mostFrequentSetting = settingCounts
      ? {
          settingKey: settingCounts.settingKey,
          count: parseInt(settingCounts.count),
        }
      : null;

    // Changes by user
    const userCounts = await qb
      .clone()
      .select("log.changedBy", "user")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.changedBy")
      .orderBy("count", "DESC")
      .getRawMany();

    const changesByUser = userCounts.map(({ user, count }) => ({
      user,
      count: parseInt(count),
    }));

    // Changes by loan (only for non-system changes)
    const loanCounts = await qb
      .clone()
      .select("log.loanId", "loanId")
      .addSelect("COUNT(*)", "count")
      .where("log.loanId IS NOT NULL")
      .groupBy("log.loanId")
      .orderBy("count", "DESC")
      .getRawMany();

    const changesByLoan = loanCounts.map(({ loanId, count }) => ({
      loanId: parseInt(loanId),
      count: parseInt(count),
    }));

    // Change magnitude statistics (absolute difference between old and new values)
    // This uses raw SQL because TypeORM doesn't have a built-in ABS function
    // Alternative: fetch all and compute in JS (less efficient)
    const magnitudeResult = await qb
      .clone()
      .select("AVG(ABS(log.newValue - log.oldValue))", "avgMagnitude")
      .addSelect("MAX(ABS(log.newValue - log.oldValue))", "maxMagnitude")
      .addSelect("MIN(ABS(log.newValue - log.oldValue))", "minMagnitude")
      .where("log.oldValue IS NOT NULL AND log.newValue IS NOT NULL")
      .getRawOne();

    // For TypeORM with SQLite, we need to handle ABS differently
    // Using a more compatible approach - fetch all and compute
    // Since the log table is typically small, this is acceptable
    const logsWithValues = await qb
      .clone()
      .select(["log.oldValue", "log.newValue"])
      .where("log.oldValue IS NOT NULL AND log.newValue IS NOT NULL")
      .getRawMany();

    let totalMagnitude = 0;
    let maxMagnitude = 0;
    let minMagnitude = Infinity;
    let countWithValues = 0;

    for (const log of logsWithValues) {
      const oldVal = parseFloat(log.oldValue);
      const newVal = parseFloat(log.newValue);
      const magnitude = Math.abs(newVal - oldVal);
      totalMagnitude += magnitude;
      maxMagnitude = Math.max(maxMagnitude, magnitude);
      minMagnitude = Math.min(minMagnitude, magnitude);
      countWithValues++;
    }

    const averageChangeMagnitude =
      countWithValues > 0 ? totalMagnitude / countWithValues : 0;
    const minChangeMagnitude = countWithValues > 0 ? minMagnitude : 0;

    // Changes in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const changesLast30Days = await qb
      .clone()
      .andWhere("log.changedAt >= :thirtyDaysAgo", { thirtyDaysAgo })
      .getCount();

    return {
      totalChanges,
      mostFrequentSetting,
      changesByUser,
      changesByLoan,
      averageChangeMagnitude: Math.round(averageChangeMagnitude * 100) / 100,
      maxChangeMagnitude: Math.round(maxMagnitude * 100) / 100,
      minChangeMagnitude: Math.round(minChangeMagnitude * 100) / 100,
      changesLast30Days,
    };
  }
}

const interestRateChangeLogService = new InterestRateChangeLogService();
module.exports = interestRateChangeLogService;
