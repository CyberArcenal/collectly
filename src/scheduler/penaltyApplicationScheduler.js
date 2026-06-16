// src/scheduler/penaltyApplicationScheduler.js
//@ts-check
const { AppDataSource } = require("../main/db/data-source");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const penaltyTransactionService = require("../services/PenaltyTransaction");
const {
  enableAutoPenalty,
  defaultPenaltyRate,
  penaltyCalculationMethod,
  penaltyGraceDays,
} = require("../utils/system");
const {
  PenaltyTransactionStateTransitionService,
} = require("../StateTransitionServices/PenaltyTransaction");

class PenaltyApplicationScheduler {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.lastRunKey = "penalty_application_last_run";
  }

  async start() {
    try {
      const autoPenaltyEnabled = await enableAutoPenalty();
      if (!autoPenaltyEnabled) {
        logger.info(
          "⏸️ Penalty Application Scheduler is disabled (enableAutoPenalty = false)",
        );
        return this;
      }

      logger.info("🚀 Starting Penalty Application Scheduler (daily)");
      await this.applyPenalties();

      this.intervalId = setInterval(async () => {
        await this.applyPenalties();
      }, this.checkInterval);

      logger.info(
        `✅ Penalty Application Scheduler started (interval: ${this.checkInterval / (1000 * 60 * 60)} hours)`,
      );
      return this;
    } catch (error) {
      logger.error("❌ Failed to start Penalty Application Scheduler:", error);
      throw error;
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Penalty Application Scheduler stopped");
    }
  }

  async alreadyRanToday() {
    const { SystemSetting } = require("../entities/systemSettings");
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    const lastRun = await settingRepo.findOne({
      where: { key: this.lastRunKey },
    });
    if (!lastRun) return false;
    const lastRunDate = new Date(lastRun.value);
    const today = new Date();
    return (
      lastRunDate.getDate() === today.getDate() &&
      lastRunDate.getMonth() === today.getMonth() &&
      lastRunDate.getFullYear() === today.getFullYear()
    );
  }

  async markRanToday() {
    const { SystemSetting } = require("../entities/systemSettings");
    const settingRepo = AppDataSource.getRepository(SystemSetting);
    let setting = await settingRepo.findOne({
      where: { key: this.lastRunKey },
    });
    if (setting) {
      setting.value = new Date().toISOString();
      setting.updated_at = new Date();
    } else {
      setting = settingRepo.create({
        key: this.lastRunKey,
        value: new Date().toISOString(),
        setting_type: "collections",
        is_public: false,
      });
    }
    await settingRepo.save(setting);
  }

  async hasPenaltySinceDueDate(debtId, dueDate, queryRunner = null) {
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const penaltyRepo = queryRunner
      ? queryRunner.manager.getRepository(PenaltyTransaction)
      : AppDataSource.getRepository(PenaltyTransaction);

    const count = await penaltyRepo
      .createQueryBuilder("penalty")
      .where("penalty.debtId = :debtId", { debtId })
      .andWhere("penalty.penaltyDate >= :dueDate", { dueDate })
      .andWhere("penalty.deletedAt IS NULL")
      .getCount();

    return count > 0;
  }

  async applyPenalties() {
    try {
      const autoPenaltyEnabled = await enableAutoPenalty();
      if (!autoPenaltyEnabled) {
        logger.debug("[PENALTY SCHEDULER] Auto penalty disabled, skipping");
        return;
      }

      if (await this.alreadyRanToday()) {
        logger.debug("[PENALTY SCHEDULER] Already ran today, skipping");
        return;
      }

      if (!AppDataSource.isInitialized) {
        logger.warn("[PENALTY SCHEDULER] Database not ready, skipping");
        return;
      }

      logger.info(
        "[PENALTY SCHEDULER] Checking for overdue debts that need penalties...",
      );

      const Debt = require("../entities/Debt");
      const debtRepo = AppDataSource.getRepository(Debt);
      const graceDays = await penaltyGraceDays();
      const calcMethod = await penaltyCalculationMethod();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - graceDays);

      const overdueDebts = await debtRepo
        .createQueryBuilder("debt")
        .where("debt.dueDate < :cutoffDate", { cutoffDate })
        .andWhere("debt.remainingAmount > 0")
        .andWhere("debt.status IN (:...statuses)", {
          statuses: ["active", "overdue"],
        })
        .andWhere("debt.deletedAt IS NULL")
        .getMany();

      if (overdueDebts.length === 0) {
        logger.info(
          "[PENALTY SCHEDULER] No overdue debts eligible for penalty",
        );
        await this.markRanToday();
        return;
      }

      logger.info(
        `[PENALTY SCHEDULER] Found ${overdueDebts.length} overdue debt(s) eligible for penalty`,
      );

      let appliedCount = 0;
      let skippedCount = 0;

      for (const debt of overdueDebts) {
        // Skip if a penalty was already applied after the due date
        const alreadyPenalized = await this.hasPenaltySinceDueDate(
          debt.id,
          debt.dueDate,
        );
        if (alreadyPenalized) {
          logger.debug(
            `[PENALTY SCHEDULER] Debt #${debt.id} already has a penalty since due date, skipping`,
          );
          skippedCount++;
          continue;
        }

        // ✅ FIX: Use debt.penaltyRate if available, fallback to default
        const penaltyRate = debt.penaltyRate ?? (await defaultPenaltyRate());

        // Calculate penalty amount
        let penaltyAmount = 0;
        if (calcMethod === "percentage") {
          penaltyAmount = debt.remainingAmount * (penaltyRate / 100);
        } else {
          penaltyAmount = penaltyRate;
        }

        if (penaltyAmount <= 0) {
          logger.debug(
            `[PENALTY SCHEDULER] Calculated penalty amount for debt #${debt.id} is zero, skipping`,
          );
          skippedCount++;
          continue;
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const penaltyData = {
            amount: penaltyAmount,
            penaltyDate: new Date(),
            reason: `Auto‑penalty for overdue debt (${graceDays} days grace, rate ${penaltyRate}${calcMethod === "percentage" ? "%" : " fixed"})`,
            debtId: debt.id,
          };
          const penalty = await penaltyTransactionService.create(
            penaltyData,
            "system",
            queryRunner,
          );

          const transitionService =
            new PenaltyTransactionStateTransitionService(AppDataSource);
          await transitionService.onCollect(penalty, "system", queryRunner);

          await queryRunner.commitTransaction();
          appliedCount++;
          logger.info(
            `[PENALTY SCHEDULER] Applied penalty of ${penaltyAmount} to debt #${debt.id}`,
          );
        } catch (err) {
          await queryRunner.rollbackTransaction();
          logger.error(
            `[PENALTY SCHEDULER] Failed to apply penalty for debt #${debt.id}:`,
            err,
          );
        } finally {
          await queryRunner.release();
        }
      }

      await auditLogger.logExport(
        "PenaltyApplicationScheduler",
        "auto_penalty",
        {
          applied: appliedCount,
          skipped: skippedCount,
          date: new Date().toISOString(),
          graceDays,
          calculationMethod: calcMethod,
        },
        "system",
      );

      logger.info(
        `[PENALTY SCHEDULER] Completed: ${appliedCount} penalties applied, ${skippedCount} skipped`,
      );
      await this.markRanToday();
    } catch (error) {
      logger.error(
        "[PENALTY SCHEDULER] Error during penalty application:",
        error,
      );
    }
  }

  async forceRun() {
    logger.info("🔄 Force penalty application triggered");
    await this.applyPenalties();
  }

  getStatus() {
    return {
      isRunning: !!this.intervalId,
      checkInterval: this.checkInterval,
      nextRun: this.intervalId
        ? new Date(Date.now() + this.checkInterval)
        : null,
    };
  }
}

module.exports = PenaltyApplicationScheduler;
