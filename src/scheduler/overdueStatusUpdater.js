// src/scheduler/overdueStatusUpdater.js
//@ts-check
const { AppDataSource } = require("../main/db/data-source");
const { logger } = require("../utils/logger");
const Debt = require("../entities/Debt");
const { DebtStateTransitionService } = require("../StateTransitionServices/Debt");

class OverdueStatusUpdater {
  constructor() {
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.intervalId = null;
    this.lastRunKey = "overdue_status_last_run";
  }

  async start() {
    try {
      logger.info("🚀 Starting Overdue Status Updater Scheduler...");

      // ✅ Force run on startup (bypasses the "already ran today" check)
      await this._performUpdate();

      // Schedule daily
      this.intervalId = setInterval(async () => {
        await this.updateOverdueStatuses();
      }, this.checkInterval);

      logger.info(
        `✅ Overdue Status Updater started (interval: ${this.checkInterval / (1000 * 60 * 60)} hours)`,
      );
      return this;
    } catch (error) {
      // @ts-ignore
      logger.error("❌ Failed to start Overdue Status Updater:", error);
      throw error;
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Overdue Status Updater stopped");
    }
  }

  /**
   * Check if we already ran today
   */
  async alreadyRanToday() {
    const settingRepo = AppDataSource.getRepository(
      require("../entities/systemSettings").SystemSetting,
    );
    const lastRun = await settingRepo.findOne({
      where: { key: this.lastRunKey },
    });
    if (!lastRun) return false;
    // @ts-ignore
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

  /**
   * Internal: perform the actual update without checking if already ran today.
   * Uses date() to compare only dates (ignoring time and timezone).
   */
  async _performUpdate() {
    try {
      if (!AppDataSource.isInitialized) {
        logger.warn("[OVERDUE STATUS] Database not ready, skipping");
        return;
      }

      logger.info("[OVERDUE STATUS] Checking for debts that should become overdue...");

      const debtRepo = AppDataSource.getRepository(Debt);

      // ✅ Use date() function to compare dates only (no timezone issues)
      const debtsToUpdate = await debtRepo
        .createQueryBuilder("debt")
        .leftJoinAndSelect("debt.borrower", "borrower")
        .where("debt.status = :status", { status: "active" })
        .andWhere("date(debt.dueDate) < date('now')")
        .andWhere("debt.remainingAmount > 0")
        .andWhere("debt.deletedAt IS NULL")
        .getMany();

      if (debtsToUpdate.length === 0) {
        logger.info("[OVERDUE STATUS] No debts need to be marked overdue");
        return;
      }

      logger.info(
        `[OVERDUE STATUS] Found ${debtsToUpdate.length} debts to mark as overdue`,
      );

      const transitionService = new DebtStateTransitionService(AppDataSource);
      let updatedCount = 0;

      for (const debt of debtsToUpdate) {
        try {
          await transitionService.onOverdue(debt, "system");
          updatedCount++;
          logger.info(`[OVERDUE STATUS] Debt #${debt.id} marked as overdue`);
        } catch (err) {
          logger.error(
            `[OVERDUE STATUS] Failed to update debt #${debt.id}:`,
            // @ts-ignore
            err,
          );
        }
      }

      logger.info(`[OVERDUE STATUS] Completed: ${updatedCount} debts updated`);
    } catch (error) {
      // @ts-ignore
      logger.error("[OVERDUE STATUS] Error during update:", error);
    }
  }

  /**
   * Public update – includes the "already ran today" check.
   */
  async updateOverdueStatuses() {
    if (await this.alreadyRanToday()) {
      logger.debug("[OVERDUE STATUS] Already ran today, skipping");
      return;
    }
    await this._performUpdate();
    await this.markRanToday();
  }

  /**
   * Force a manual run (bypasses daily check)
   */
  async forceRun() {
    logger.info("🔄 Force overdue status update triggered");
    await this._performUpdate();
    await this.markRanToday();
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

module.exports = OverdueStatusUpdater;