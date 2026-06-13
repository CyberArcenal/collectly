// src/services/InterestAccrualService.js
//@ts-check
const { AppDataSource } = require("../main/db/data-source");
const Debt = require("../entities/Debt");

const auditLogger = require("../utils/auditLogger");
const { logger } = require("../utils/logger");

class InterestAccrualService {
  // Walang constructor na kumukuha ng repository – safe kahit hindi pa ready ang DB

  /**
   * Lazy getter para sa debt repository (safe kahit kailan tawagin)
   */
  get debtRepo() {
    if (!AppDataSource.isInitialized) {
      throw new Error("Database not initialized");
    }
    return AppDataSource.getRepository(Debt);
  }

  /**
   * Mag-accrue ng interes para sa isang utang hanggang sa isang target date.
   * @param {Object} debt - Debt entity
   * @param {Date} asOfDate - petsa kung hanggang kailan mag-aaccrue (default: ngayon)
   * @param {import("typeorm").QueryRunner|null} queryRunner - para sa transaction
   * @returns {Promise<Object>} updated debt
   */
  async applyAccrual(debt, asOfDate = new Date(), queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");

    // Skip kung hindi active/overdue

    if (debt.status !== "active" && debt.status !== "overdue") {
      logger.debug(
        `[InterestAccrual] Skip debt #${debt.id}, status: ${debt.status}`,
      );
      return debt;
    }

    // Skip kung walang interest rate o zero

    if (!debt.interestRate || debt.interestRate <= 0) {
      logger.debug(
        `[InterestAccrual] Skip debt #${debt.id}, interestRate = ${debt.interestRate}`,
      );
      return debt;
    }

    // Skip kung fully paid na

    if (debt.remainingAmount <= 0.01) {
      logger.debug(
        `[InterestAccrual] Skip debt #${debt.id}, remaining = ${debt.remainingAmount}`,
      );
      return debt;
    }

    // Kunin ang huling accrual date (kung null, gamitin ang createdAt)

    let lastDate = debt.lastInterestAccrualDate
      ? new Date(debt.lastInterestAccrualDate)
      : new Date(debt.createdAt);
    if (isNaN(lastDate.getTime())) {
      lastDate = new Date(debt.createdAt);
    }
    lastDate.setHours(0, 0, 0, 0);

    const targetDate = new Date(asOfDate);
    targetDate.setHours(0, 0, 0, 0);

    // Kung ang target date ay hindi lalampas sa last accrual date, walang gagawin
    if (targetDate <= lastDate) {
      logger.debug(
        `[InterestAccrual] Debt #${debt.id} already accrued up to ${lastDate.toISOString()}`,
      );
      return debt;
    }

    // Bilang ng araw mula lastDate hanggang targetDate
    const daysDiff = Math.floor(
      (targetDate - lastDate) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff === 0) return debt;

    // Compute daily interest rate (simple interest)

    const period = debt.interestCalculationPeriod || "per_annum";

    const annualRate = debt.interestRate / 100;
    let dailyRate;
    if (period === "per_month") {
      const monthlyRate = annualRate / 12;
      dailyRate = monthlyRate / 30; // 30 days per month simplified
    } else {
      dailyRate = annualRate / 365;
    }

    const principal = debt.remainingAmount;
    const interestAmount = principal * dailyRate * daysDiff;

    if (interestAmount <= 0.01) {
      logger.debug(
        `[InterestAccrual] Negligible interest for debt #${debt.id}: ${interestAmount}`,
      );
      return debt;
    }

    const oldRemaining = debt.remainingAmount;

    debt.remainingAmount = parseFloat((principal + interestAmount).toFixed(2));

    debt.lastInterestAccrualDate = targetDate;

    debt.updatedAt = new Date();

    // I-save gamit ang updateDb (ipasa ang queryRunner kung mayroon)
    const debtRepo = queryRunner
      ? queryRunner.manager.getRepository(Debt)
      : this.debtRepo;

    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    logger.info(
      `[InterestAccrual] Debt #${debt.id}: +₱${interestAmount.toFixed(2)} interest for ${daysDiff} day(s). New remaining: ₱${debt.remainingAmount}`,
    );

    // Audit log
    await auditLogger.logUpdate(
      "Debt",

      debt.id,
      {
        oldRemaining,
        interestAccrued: interestAmount,
        days: daysDiff,
        lastAccrualDate: lastDate,
        accrualUpTo: targetDate,
      },
      {
        newRemaining: debt.remainingAmount,
        newLastAccrualDate: targetDate,
      },
      "system",
    );

    return debt;
  }

  /**
   * Hanapin ang lahat ng utang na kailangang i-accrue (active/overdue, may interest, positive balance)
   * @returns {Promise<Debt[]>}
   */
  async findDebtsForAccrual() {
    return await this.debtRepo
      .createQueryBuilder("debt")
      .where("debt.status IN (:...statuses)", {
        statuses: ["active", "overdue"],
      })
      .andWhere("debt.remainingAmount > 0")
      .andWhere("debt.interestRate IS NOT NULL")
      .andWhere("debt.interestRate > 0")
      .andWhere("debt.deletedAt IS NULL")
      .getMany();
  }

  /**
   * I-accrue ang interes para sa LAHAT ng eligible debts, hanggang ngayong araw.
   * Ginagamit ito ng scheduler (araw-araw).
   * @returns {Promise<{processed: number, errors: number}>}
   */
  async runAccrual() {
    logger.info("[InterestAccrual] Starting daily interest accrual...");
    const debts = await this.findDebtsForAccrual();
    if (debts.length === 0) {
      logger.info("[InterestAccrual] No debts need accrual.");
      return { processed: 0, errors: 0 };
    }

    let processed = 0,
      errors = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const debt of debts) {
      try {
        await this.applyAccrual(debt, today);
        processed++;
      } catch (err) {
        logger.error(`[InterestAccrual] Failed for debt #${debt.id}:`, err);
        errors++;
      }
    }

    logger.info(
      `[InterestAccrual] Completed: processed ${processed}, errors ${errors}`,
    );
    return { processed, errors };
  }

  /**
   * I-accrue ang interes para sa isang specific na utang hanggang sa isang specific na petsa.
   * Ito ay dapat tawagin **BAGO** mag-apply ng payment, para accurate ang balance bago ang payment.
   * @param {number} debtId
   * @param {Date} asOfDate
   * @returns {Promise<Object>} updated debt
   */
  async accrueForPayment(debtId, asOfDate = new Date()) {
    const debt = await this.debtRepo.findOne({ where: { id: debtId } });
    if (!debt) throw new Error(`Debt #${debtId} not found`);
    return await this.applyAccrual(debt, asOfDate);
  }
}

// I-export bilang singleton instance
module.exports = new InterestAccrualService();
