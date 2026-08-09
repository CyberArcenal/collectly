// src/scheduler/interestAccrualScheduler.js
//@ts-check

const interestAccrualService = require("../services/InterestAccrualService");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/data-source");

class InterestAccrualScheduler {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 24 * 60 * 60 * 1000;
    this.lastRunKey = "interest_accrual_last_run";
  }

  async alreadyRanToday() {
    try {
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
    } catch (err) {
      logger.warn("[InterestAccrual] Failed to check last run:", err);
      return false;
    }
  }

  async markRanToday() {
    try {
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
    } catch (err) {
      logger.warn("[InterestAccrual] Failed to mark run today:", err);
    }
  }

  async start() {
    try {
      logger.info("🚀 Starting Interest Accrual Scheduler (daily)");

      if (await this.alreadyRanToday()) {
        logger.info(
          "[InterestAccrual] Already ran today, skipping initial run",
        );
      } else {
        await interestAccrualService.runAccrual();
        await this.markRanToday();
      }

      this.intervalId = setInterval(async () => {
        if (await this.alreadyRanToday()) {
          logger.debug("[InterestAccrual] Already ran today, skipping");
          return;
        }
        await interestAccrualService.runAccrual();
        await this.markRanToday();
      }, this.checkInterval);

      logger.info("✅ Interest Accrual Scheduler started");
      return this;
    } catch (error) {
      logger.error("❌ Failed to start Interest Accrual Scheduler:", error);
      throw error;
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("🛑 Interest Accrual Scheduler stopped");
    }
  }

  async forceRun() {
    logger.info("🔄 Force interest accrual triggered");
    await interestAccrualService.runAccrual();
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

module.exports = InterestAccrualScheduler;
