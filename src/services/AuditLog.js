//@ts-check

class AuditService {
  constructor() {
    this.auditRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const Borrower = require("../entities/Borrower");
    const { AuditLog } = require("../entities/AuditLog");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.auditRepository = AppDataSource.getRepository(AuditLog);
    console.log("BorrowerService initialized");
  }

  async getRepository() {
    if (!this.auditRepository) {
      await this.initialize();
    }
    return this.auditRepository;
  }

  // services/Borrower.js – inside BorrowerService class

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {import("typeorm").Repository<any>}
   */
  _getRepo(qr) {
    const Borrower = require("../entities/Borrower");
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[Borrower._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(Borrower);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[Borrower._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(Borrower);
  }

  /**
   * Get enhanced audit log statistics for dashboard.
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Statistics
   */
  async getEnhancedStats(days = 7) {
    const repo = await this.getRepository();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const qb = repo
      .createQueryBuilder("log")
      .where("log.timestamp >= :startDate", { startDate });

    // Total logs
    const total = await qb.clone().getCount();

    // Today's actions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const totalToday = await repo
      .createQueryBuilder("log")
      .where("log.timestamp >= :todayStart", { todayStart })
      .getCount();

    // Unique users
    const uniqueUsersResult = await qb
      .clone()
      .select("COUNT(DISTINCT log.user)", "count")
      .where("log.user IS NOT NULL")
      .getRawOne();
    const uniqueUsers = parseInt(uniqueUsersResult?.count) || 0;

    // Average per day
    const daysElapsed = Math.max(1, days);
    const avgPerDay = total / daysElapsed;

    // Most active day
    const mostActiveDayResult = await qb
      .clone()
      .select("DATE(log.timestamp)", "day")
      .addSelect("COUNT(*)", "count")
      .groupBy("DATE(log.timestamp)")
      .orderBy("count", "DESC")
      .limit(1)
      .getRawOne();

    const mostActiveDay = mostActiveDayResult
      ? {
          day: mostActiveDayResult.day,
          count: parseInt(mostActiveDayResult.count),
        }
      : null;

    // By Action
    const byAction = await qb
      .clone()
      .select("log.action", "action")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.action")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // By Entity
    const byEntity = await qb
      .clone()
      .select("log.entity", "entity")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.entity")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // By User
    const byUser = await qb
      .clone()
      .select("log.user", "user")
      .addSelect("COUNT(*)", "count")
      .where("log.user IS NOT NULL")
      .groupBy("log.user")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // ✅ FIXED: Use 'total' not 'total_logs'
    return {
      total, // ✅ matches server
      totalToday, // ✅ matches server
      uniqueUsers, // ✅ matches server
      avgPerDay: Math.round(avgPerDay * 10) / 10,
      mostActiveDay,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
      byAction: byAction.map((item) => ({
        action: item.action,
        count: parseInt(item.count),
      })),
      byEntity: byEntity.map((item) => ({
        entity: item.entity,
        count: parseInt(item.count),
      })),
      byUser: byUser.map((item) => ({
        user: item.user,
        count: parseInt(item.count),
      })),
    };
  }
}

const auditService = new AuditService();
module.exports = auditService;
