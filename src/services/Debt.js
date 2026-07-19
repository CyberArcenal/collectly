// services/DebtService.js
//@ts-check
const auditLogger = require("../utils/auditLogger");
const { validateDebtData } = require("../utils/debtUtils");
const {
  defaultInterestRate,
  defaultPenaltyRate,
  defaultInterestCalculationPeriod,
} = require("../utils/system");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
// @ts-ignore
const { logger } = require("../utils/logger");
class DebtService {
  constructor() {
    this.debtRepository = null;
    this.borrowerRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const Debt = require("../entities/Debt");
    const Borrower = require("../entities/Borrower");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.debtRepository = AppDataSource.getRepository(Debt);
    this.borrowerRepository = AppDataSource.getRepository(Borrower);
    console.log("DebtService initialized");
  }

  async getRepositories() {
    if (!this.debtRepository) {
      await this.initialize();
    }
    return {
      debt: this.debtRepository,
      borrower: this.borrowerRepository,
    };
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository<any>}
   */

  _getRepo(qr, entityClass) {
    // Log the type for debugging
    const qrType =
      qr === null ? "null" : qr === undefined ? "undefined" : typeof qr;
    const hasManager = qr && typeof qr === "object" && !!qr.manager;
    console.log(
      `[DebtService._getRepo] qr type: ${qrType}, has manager: ${hasManager}`,
    );

    // Only use the transactional manager if qr is a valid QueryRunner object
    if (hasManager && typeof qr.manager.getRepository === "function") {
      return qr.manager.getRepository(entityClass);
    }
    // Fallback to global data source
    const { AppDataSource } = require("../main/db/data-source");
    console.log(`[DebtService._getRepo] Using global repository (fallback)`);
    return AppDataSource.getRepository(entityClass);
  }

  /**
   * Create a new debt
   * @param {Object} debtData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(debtData, user = "system", qr = null) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    const defaultPeriod = await defaultInterestCalculationPeriod();
    // @ts-ignore
    const interestCalculationPeriod =
      debtData.interestCalculationPeriod || defaultPeriod;
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);
    // @ts-ignore
    const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));

    try {
      const validation = validateDebtData(debtData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const {
        // @ts-ignore
        name,
        // @ts-ignore
        totalAmount,
        // @ts-ignore
        paidAmount = 0,
        // @ts-ignore
        dueDate,
        // @ts-ignore
        status = "active",
        // @ts-ignore
        interestRate = null,
        // @ts-ignore
        penaltyRate = null,
        // @ts-ignore
        borrowerId,
      } = debtData;

      // Validate borrower existence
      const borrower = await borrowerRepo.findOne({
        where: { id: borrowerId },
      });
      if (!borrower) {
        throw new Error(`Borrower with ID ${borrowerId} not found`);
      }

      // Calculate remaining amount
      const remainingAmount = totalAmount - paidAmount;
      const finalInterestRate =
        interestRate !== null && interestRate !== undefined
          ? parseFloat(interestRate)
          : await defaultInterestRate();
      let finalPenaltyRate =
        penaltyRate !== null && penaltyRate !== undefined
          ? parseFloat(penaltyRate)
          : await defaultPenaltyRate();
      if (isNaN(finalPenaltyRate)) finalPenaltyRate = 0;

      const debt = debtRepo.create({
        name,
        totalAmount,
        paidAmount,
        remainingAmount,
        dueDate: new Date(dueDate),
        status,
        interestRate: finalInterestRate,
        penaltyRate: finalPenaltyRate,
        interestCalculationPeriod,
        borrower,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // @ts-ignore
      const saved = await saveDb(debtRepo, debt, { queryRunner: qr });
      await auditLogger.logCreate("Debt", saved.id, saved, user);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create debt:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing debt
   * @param {number} id
   * @param {Object} debtData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async update(id, debtData, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);
    // @ts-ignore
    const borrowerRepo = this._getRepo(qr, require("../entities/Borrower"));

    try {
      const existing = await debtRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Debt with ID ${id} not found`);
      }
      const oldData = { ...existing };

      // If borrowerId is being updated, validate new borrower
      // @ts-ignore
      if (debtData.borrowerId && debtData.borrowerId !== existing.borrower.id) {
        const newBorrower = await borrowerRepo.findOne({
          // @ts-ignore
          where: { id: debtData.borrowerId },
        });
        if (!newBorrower) {
          // @ts-ignore
          throw new Error(`Borrower with ID ${debtData.borrowerId} not found`);
        }
        existing.borrower = newBorrower;
        // @ts-ignore
        delete debtData.borrowerId;
      }

      // Apply other updates
      Object.assign(existing, debtData);

      // Recalculate remaining amount if totalAmount or paidAmount changed
      if (
        // @ts-ignore
        debtData.totalAmount !== undefined ||
        // @ts-ignore
        debtData.paidAmount !== undefined
      ) {
        existing.remainingAmount = existing.totalAmount - existing.paidAmount;
      }

      // Ensure dueDate is a Date object
      // @ts-ignore
      if (debtData.dueDate) {
        // @ts-ignore
        existing.dueDate = new Date(debtData.dueDate);
      }

      existing.updatedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(debtRepo, existing, { queryRunner: qr });
      await auditLogger.logUpdate("Debt", id, oldData, saved, user);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to update debt:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a debt (set deletedAt)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const LoanAgreement = require("../entities/LoanAgreement");
    const debtRepo = this._getRepo(qr, Debt);
    const paymentRepo = this._getRepo(qr, PaymentTransaction);
    const penaltyRepo = this._getRepo(qr, PenaltyTransaction);
    const agreementRepo = this._getRepo(qr, LoanAgreement);

    try {
      // 1. Find the debt with borrower info for user-friendly error messages
      const debt = await debtRepo.findOne({
        where: { id },
        relations: ["borrower"],
      });
      if (!debt) {
        throw new Error(`Debt with ID ${id} not found`);
      }
      if (debt.deletedAt) {
        throw new Error(`Debt "${debt.name}" is already deleted`);
      }

      const borrowerName = debt.borrower?.name || "Unknown Borrower";

      // 2. 🔒 Check for active payments (not soft-deleted)
      const paymentCount = await paymentRepo.count({
        where: { debt: { id }, deletedAt: null },
      });
      if (paymentCount > 0) {
        throw new Error(
          `Cannot delete debt "${debt.name}" for ${borrowerName} because it has ${paymentCount} active payment(s). Please delete or void all payments first.`,
        );
      }

      // 3. 🔒 Check for active penalties (not soft-deleted)
      const penaltyCount = await penaltyRepo.count({
        where: { debt: { id }, deletedAt: null },
      });
      if (penaltyCount > 0) {
        throw new Error(
          `Cannot delete debt "${debt.name}" for ${borrowerName} because it has ${penaltyCount} active penalty(s). Please delete all penalties first.`,
        );
      }

      // 4. 🔒 Check for signed loan agreements (status = 'signed')
      const signedAgreementCount = await agreementRepo.count({
        where: { debt: { id }, status: "signed", deletedAt: null },
      });
      if (signedAgreementCount > 0) {
        throw new Error(
          `Cannot delete debt "${debt.name}" for ${borrowerName} because it has ${signedAgreementCount} signed loan agreement(s). Please void or delete the agreements first.`,
        );
      }

      // 5. Proceed with soft delete
      const oldData = { ...debt };
      debt.deletedAt = new Date();
      debt.updatedAt = new Date();

      const saved = await updateDb(debtRepo, debt, { queryRunner: qr });
      await auditLogger.logDelete("Debt", id, oldData, user);
      console.log(`Debt soft deleted: "${debt.name}" (ID: ${id})`);
      return saved;
    } catch (error) {
      console.error("Failed to delete debt:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted debt
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);

    try {
      const debt = await debtRepo.findOne({ where: { id }, withDeleted: true });
      if (!debt) {
        throw new Error(`Debt with ID ${id} not found`);
      }
      if (!debt.deletedAt) {
        throw new Error(`Debt #${id} is not deleted`);
      }

      debt.deletedAt = null;
      debt.updatedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(debtRepo, debt, { queryRunner: qr });
      await auditLogger.logUpdate(
        "Debt",
        id,
        { deletedAt: true },
        { deletedAt: null },
        user,
      );
      console.log(`Debt restored: #${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to restore debt:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a debt
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);

    const debt = await debtRepo.findOne({ where: { id }, withDeleted: true });
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }

    // @ts-ignore
    await removeDb(debtRepo, debt);
    await auditLogger.logDelete("Debt", id, debt, user);
    console.log(`Debt #${id} permanently deleted`);
  }

  /**
   * Recalculate remaining amount for a debt based on paidAmount
   * Useful after payment transactions
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async recalculateRemainingAmount(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const Debt = require("../entities/Debt");
    // @ts-ignore
    const debtRepo = this._getRepo(qr, Debt);

    const debt = await debtRepo.findOne({ where: { id } });
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }

    const oldRemaining = debt.remainingAmount;
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();

    // @ts-ignore
    const saved = await updateDb(debtRepo, debt, { queryRunner: qr });
    await auditLogger.logUpdate(
      "Debt",
      id,
      { remainingAmount: oldRemaining },
      { remainingAmount: debt.remainingAmount },
      user,
    );
    console.log(
      `Remaining amount recalculated for debt #${id}: ${oldRemaining} → ${debt.remainingAmount}`,
    );
    return saved;
  }

  /**
   * Find debt by ID (excludes soft-deleted by default)
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const { debt: debtRepo } = await this.getRepositories();

    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("debt.id = :id", { id });

    if (!includeDeleted) {
      qb.andWhere("debt.deletedAt IS NULL");
    }

    // Same subqueries as findAll
    qb.addSelect((subQ) => {
      return subQ
        .select("COALESCE(SUM(payment.amount), 0)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "totalPaid");

    qb.addSelect((subQ) => {
      return subQ
        .select("COUNT(payment.id)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "paymentCount");

    qb.addSelect((subQ) => {
      return subQ
        .select("MAX(payment.paymentDate)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "lastPaymentDate");

    qb.addSelect((subQ) => {
      return subQ
        .select("COALESCE(SUM(penalty.amount), 0)")
        .from("penalty_transactions", "penalty")
        .where("penalty.debtId = debt.id")
        .andWhere("penalty.deletedAt IS NULL");
    }, "totalPenalty");

    qb.addSelect((subQ) => {
      return subQ
        .select("COUNT(penalty.id)")
        .from("penalty_transactions", "penalty")
        .where("penalty.debtId = debt.id")
        .andWhere("penalty.deletedAt IS NULL");
    }, "penaltyCount");

    const debt = await qb.getOne();
    if (!debt) {
      throw new Error(`Debt with ID ${id} not found`);
    }

    // Compute stats
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const totalPaid = parseFloat(debt.totalPaid || 0);
    const totalPenalty = parseFloat(debt.totalPenalty || 0);
    const remainingBalance = debt.totalAmount - totalPaid;
    let daysOverdue = 0;
    const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
    if (dueDate && dueDate < now && remainingBalance > 0) {
      const diffTime = now.getTime() - dueDate.getTime();
      daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    const isFullyPaid = remainingBalance <= 0.01;

    debt.stats = {
      totalPaid,
      totalPenalty,
      remainingBalance,
      daysOverdue,
      paymentCount: parseInt(debt.paymentCount || 0),
      penaltyCount: parseInt(debt.penaltyCount || 0),
      lastPaymentDate: debt.lastPaymentDate || null,
      isFullyPaid,
    };

    await auditLogger.logView("Debt", id, "system");
    return debt;
  }

  // services/Debt.js – inside DebtService class

  /**
   * Find all debts with filters, pagination, sorting
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { debt: debtRepo } = await this.getRepositories();

    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // Exclude soft-deleted unless requested
    if (!options.includeDeleted) {
      qb.andWhere("debt.deletedAt IS NULL");
    }

    // Filters
    if (options.status) {
      qb.andWhere("debt.status = :status", { status: options.status });
    }
    if (options.borrowerId) {
      qb.andWhere("borrower.id = :borrowerId", {
        borrowerId: options.borrowerId,
      });
    }
    if (options.dueDateFrom) {
      qb.andWhere("debt.dueDate >= :dueDateFrom", {
        dueDateFrom: new Date(options.dueDateFrom),
      });
    }
    if (options.dueDateTo) {
      qb.andWhere("debt.dueDate <= :dueDateTo", {
        dueDateTo: new Date(options.dueDateTo),
      });
    }
    if (options.minTotalAmount) {
      qb.andWhere("debt.totalAmount >= :minTotalAmount", {
        minTotalAmount: options.minTotalAmount,
      });
    }
    if (options.maxTotalAmount) {
      qb.andWhere("debt.totalAmount <= :maxTotalAmount", {
        maxTotalAmount: options.maxTotalAmount,
      });
    }
    if (options.search) {
      qb.andWhere("(debt.name LIKE :search OR borrower.name LIKE :search)", {
        search: `%${options.search}%`,
      });
    }

    // ✅ Subqueries for stats
    qb.addSelect((subQ) => {
      return subQ
        .select("COALESCE(SUM(payment.amount), 0)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "totalPaid");

    qb.addSelect((subQ) => {
      return subQ
        .select("COUNT(payment.id)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "paymentCount");

    qb.addSelect((subQ) => {
      return subQ
        .select("MAX(payment.paymentDate)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "lastPaymentDate");

    qb.addSelect((subQ) => {
      return subQ
        .select("COALESCE(SUM(penalty.amount), 0)")
        .from("penalty_transactions", "penalty")
        .where("penalty.debtId = debt.id")
        .andWhere("penalty.deletedAt IS NULL");
    }, "totalPenalty");

    qb.addSelect((subQ) => {
      return subQ
        .select("COUNT(penalty.id)")
        .from("penalty_transactions", "penalty")
        .where("penalty.debtId = debt.id")
        .andWhere("penalty.deletedAt IS NULL");
    }, "penaltyCount");

    // ✅ Sorting with field mapping
    let sortBy = options.sortBy || "dueDate";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";

    // 🔧 Map frontend sort fields to actual column/relation paths
    const sortFieldMap = {
      borrowerName: "borrower.name", // ✅ sort by borrower name
      borrower: "borrower.name", // ✅ fallback
      createdAt: "debt.createdAt",
      updatedAt: "debt.updatedAt",
      dueDate: "debt.dueDate",
      name: "debt.name",
      totalAmount: "debt.totalAmount",
      paidAmount: "debt.paidAmount",
      remainingAmount: "debt.remainingAmount",
      status: "debt.status",
      id: "debt.id",
    };

    // Use mapped field or default to debt.{sortBy}
    let orderByField = sortFieldMap[sortBy] || `debt.${sortBy}`;

    // ✅ SAFETY: Prevent SQL injection by validating field is allowed
    const allowedFields = [
      "debt.id",
      "debt.name",
      "debt.totalAmount",
      "debt.paidAmount",
      "debt.remainingAmount",
      "debt.dueDate",
      "debt.status",
      "debt.createdAt",
      "debt.updatedAt",
      "debt.interestRate",
      "debt.penaltyRate",
      "borrower.name",
    ];

    // If the mapped field is not in allowed list, fallback to dueDate
    if (!allowedFields.includes(orderByField)) {
      console.warn(
        `[DebtService] Invalid sort field: ${orderByField}, falling back to dueDate`,
      );
      orderByField = "debt.dueDate";
    }

    qb.orderBy(orderByField, sortOrder);

    // Pagination
    const result = await paginateQueryBuilder(qb, {
      page: options.page,
      limit: options.limit,
    });

    // Attach stats object to each debt
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    result.data = result.data.map((debt) => {
      const totalPaid = parseFloat(debt.totalPaid || 0);
      const totalPenalty = parseFloat(debt.totalPenalty || 0);
      const remainingBalance = debt.totalAmount - totalPaid;
      let daysOverdue = 0;
      const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
      if (dueDate && dueDate < now && remainingBalance > 0) {
        const diffTime = now.getTime() - dueDate.getTime();
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      const isFullyPaid = remainingBalance <= 0.01;

      debt.stats = {
        totalPaid,
        totalPenalty,
        remainingBalance,
        daysOverdue,
        paymentCount: parseInt(debt.paymentCount || 0),
        penaltyCount: parseInt(debt.penaltyCount || 0),
        lastPaymentDate: debt.lastPaymentDate || null,
        isFullyPaid,
      };
      return debt;
    });

    await auditLogger.logView("Debt", null, "system");
    return result;
  }

  // @ts-ignore
  async correctTotalAmount(id, newTotalAmount, user, qr) {
    const existing = await this.findById(id);
    // @ts-ignore
    const oldTotal = existing.totalAmount;
    existing.totalAmount = newTotalAmount;
    // @ts-ignore
    existing.remainingAmount = existing.totalAmount - existing.paidAmount;
    // I-save na may skipSignal para hindi mag-trigger ng forgiveness
    const { updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    const repo = this._getRepo(qr, require("../entities/Debt"));
    // @ts-ignore
    return await updateDb(repo, existing, {
      queryRunner: qr,
      skipSignal: true,
    });
  }

  // services/DebtService.js – inside applyForgiveness

  async applyForgiveness(
    // @ts-ignore
    id,
    // @ts-ignore
    amountForgiven,
    user = "system",
    reason = null,
    qr = null,
  ) {
    const debt = await this.findById(id);
    if (amountForgiven <= 0)
      throw new Error("Forgiveness amount must be positive");
    // @ts-ignore
    if (amountForgiven > debt.totalAmount)
      throw new Error("Cannot forgive more than total amount");

    const oldTotal = debt.totalAmount;
    // @ts-ignore
    debt.totalAmount -= amountForgiven;
    // @ts-ignore
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    // @ts-ignore
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();

    const { updateDb } = require("../utils/dbUtils/dbActions");
    // @ts-ignore
    const repo = this._getRepo(qr, require("../entities/Debt"));
    // @ts-ignore
    await updateDb(repo, debt, { queryRunner: qr, skipSignal: true });

    // ✅ Reload the debt with borrower relation after update
    const refreshedDebt = await this.findById(id); // includes borrower via relations

    const {
      DebtStateTransitionService,
    } = require("../StateTransitionServices/Debt");
    const { AppDataSource } = require("../main/db/data-source");
    const transitionService = new DebtStateTransitionService(AppDataSource);
    await transitionService.onForgiveness(
      refreshedDebt,
      amountForgiven,
      user,
      qr,
      reason,
    );

    await auditLogger.logUpdate(
      "Debt",
      id,
      { forgivenessAmount: amountForgiven, reason },
      { totalAmount: oldTotal, newTotal: debt.totalAmount },
      user,
    );

    return refreshedDebt;
  }

  /**
   * Get debt statistics
   * Overdue count should only include debts with remainingAmount > 0
   * Active count should only include debts with remainingAmount > 0
   */
  async getStatistics() {
    const { debt: debtRepo } = await this.getRepositories();
    const qb = debtRepo
      .createQueryBuilder("debt")
      .where("debt.deletedAt IS NULL");

    // Total debts (all non-deleted)
    const totalDebts = await qb.clone().getCount();

    // Active debts: status = 'active' AND remainingAmount > 0.01
    const totalActive = await qb
      .clone()
      .andWhere("debt.status = 'active'")
      .andWhere("debt.remainingAmount > 0.01")
      .getCount();

    // Paid debts: status = 'paid' (regardless of remaining, but usually zero)
    const totalPaid = await qb
      .clone()
      .andWhere("debt.status = 'paid'")
      .getCount();

    // Overdue debts: status = 'overdue' AND remainingAmount > 0.01
    const totalOverdue = await qb
      .clone()
      .andWhere("debt.status = 'overdue'")
      .andWhere("debt.remainingAmount > 0.01")
      .getCount();

    // Defaulted debts: status = 'defaulted'
    const totalDefaulted = await qb
      .clone()
      .andWhere("debt.status = 'defaulted'")
      .getCount();

    // Sum of totalAmount
    const totalAmountSum = await qb
      .clone()
      .select("SUM(debt.totalAmount)", "sum")
      .getRawOne();

    // Sum of remainingAmount (only positive balances)
    const totalRemainingSum = await qb
      .clone()
      .andWhere("debt.remainingAmount > 0.01")
      .select("SUM(debt.remainingAmount)", "sum")
      .getRawOne();

    return {
      totalDebts,
      totalActive,
      totalPaid,
      totalOverdue,
      totalDefaulted,
      totalAmountOwed: parseFloat(totalAmountSum.sum) || 0,
      totalRemainingBalance: parseFloat(totalRemainingSum.sum) || 0,
    };
  }

  /**
   * Export debts to CSV or JSON
   * @param {string} format
   * @param {Object} filters
   * @param {string} user
   */
  async exportDebts(format = "json", filters = {}, user = "system") {
    const results = await this.findAll(filters);
    const debts = results.data;

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Name",
        "Total Amount",
        "Paid Amount",
        "Remaining Amount",
        "Due Date",
        "Status",
        "Interest Rate (%)",
        "Penalty Rate (%)",
        "Borrower ID",
        "Borrower Name",
        "Created At",
        "Updated At",
      ];
      const rows = debts.map((d) => [
        d.id,
        d.name,
        d.totalAmount,
        d.paidAmount,
        d.remainingAmount,
        new Date(d.dueDate).toLocaleDateString(),
        d.status,
        d.interestRate ?? "",
        d.penaltyRate ?? "",
        d.borrower?.id ?? "",
        d.borrower?.name ?? "",
        new Date(d.createdAt).toLocaleDateString(),
        new Date(d.updatedAt).toLocaleDateString(),
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `debts_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: debts,
        filename: `debts_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    // @ts-ignore
    await auditLogger.logExport("Debt", format, filters, user);
    console.log(`Exported ${debts.length} debts in ${format} format`);
    return exportData;
  }

  /**
   * Bulk create debts
   * @param {Array<Object>} debtsArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkCreate(debtsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of debtsArray) {
      try {
        const saved = await this.create(data, user, qr);
        // @ts-ignore
        results.created.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ debt: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update debts
   * @param {Array<{ id: number, updates: Object }>} updatesArray
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async bulkUpdate(updatesArray, user = "system", qr = null) {
    const results = { updated: [], errors: [] };
    for (const { id, updates } of updatesArray) {
      try {
        const saved = await this.update(id, updates, user, qr);
        // @ts-ignore
        results.updated.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ id, updates, error: err.message });
      }
    }
    return results;
  }

  /**
   * Import debts from CSV file
   * @param {string} filePath
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async importFromCSV(filePath, user = "system", qr = null) {
    const fs = require("fs").promises;
    const csv = require("csv-parse/sync");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = { imported: [], errors: [] };
    for (const record of records) {
      try {
        const debtData = {
          // @ts-ignore
          name: record.name,
          // @ts-ignore
          totalAmount: parseFloat(record.totalAmount),
          // @ts-ignore
          paidAmount: parseFloat(record.paidAmount) || 0,
          // @ts-ignore
          dueDate: record.dueDate,
          // @ts-ignore
          status: record.status || "active",
          // @ts-ignore
          interestRate: record.interestRate
            ? // @ts-ignore
              parseFloat(record.interestRate)
            : null,
          // @ts-ignore
          penaltyRate: record.penaltyRate
            ? // @ts-ignore
              parseFloat(record.penaltyRate)
            : null,
          // @ts-ignore
          borrowerId: parseInt(record.borrowerId, 10),
        };
        const validation = validateDebtData(debtData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(debtData, user, qr);
        // @ts-ignore
        results.imported.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }

  // services/Debt.js

  /**
   * Get aging summary for accounts receivable as of a given date.
   * @param {string} asOfDate - YYYY-MM-DD
   * @returns {Promise<{ asOfDate: string; totalOutstanding: number; buckets: Array<{ range: string; minDays: number; maxDays: number|null; totalAmount: number; count: number; percentage: number }> }>}
   */
  async getAgingSummary(asOfDate) {
    const { debt: debtRepo } = await this.getRepositories();
    // Fetch all active debts (status = 'active', not deleted)
    // @ts-ignore
    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("debt.status = :status", { status: "active" })
      .andWhere("debt.deletedAt IS NULL");
    const debts = await qb.getMany();

    const asOf = new Date(asOfDate);
    asOf.setHours(0, 0, 0, 0);
    const today = asOf; // use given date as reference

    const buckets = [
      {
        range: "0-30 days",
        minDays: 0,
        maxDays: 30,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
      {
        range: "31-60 days",
        minDays: 31,
        maxDays: 60,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
      {
        range: "61-90 days",
        minDays: 61,
        maxDays: 90,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
      {
        range: "90+ days",
        minDays: 91,
        maxDays: null,
        totalAmount: 0,
        count: 0,
        percentage: 0,
        debts: [],
      },
    ];

    for (const debt of debts) {
      // @ts-ignore
      const dueDate = new Date(debt.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      let daysPastDue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysPastDue < 0) daysPastDue = 0;

      let bucketIndex = 0;
      if (daysPastDue <= 30) bucketIndex = 0;
      else if (daysPastDue <= 60) bucketIndex = 1;
      else if (daysPastDue <= 90) bucketIndex = 2;
      else bucketIndex = 3;

      // @ts-ignore
      buckets[bucketIndex].totalAmount += debt.remainingAmount;
      buckets[bucketIndex].count += 1;
      // Do not store full debts here to keep lightweight; for drill-down we have separate endpoint.
    }

    const totalOutstanding = buckets.reduce((sum, b) => sum + b.totalAmount, 0);
    for (const bucket of buckets) {
      bucket.percentage =
        totalOutstanding > 0
          ? (bucket.totalAmount / totalOutstanding) * 100
          : 0;
    }

    return { asOfDate, totalOutstanding, buckets };
  }

  /**
   * Get paginated debts that fall into a specific aging bucket as of a given date.
   * @param {string} bucketRange - e.g., "0-30 days", "31-60 days", "61-90 days", "90+ days"
   * @param {string} asOfDate - YYYY-MM-DD
   * @param {number} page - page number
   * @param {number} limit - items per page
   * @returns {Promise<{ data: Debt[], pagination: {...} }>}
   */
  async getDebtsInBucket(bucketRange, asOfDate, page = 1, limit = 10) {
    const { debt: debtRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("debt.status = :status", { status: "active" })
      .andWhere("debt.deletedAt IS NULL");

    const asOf = new Date(asOfDate);
    asOf.setHours(0, 0, 0, 0);

    // Determine min and max days for the bucket
    let minDays = 0,
      maxDays = null;
    if (bucketRange === "0-30 days") {
      minDays = 0;
      maxDays = 30;
    } else if (bucketRange === "31-60 days") {
      minDays = 31;
      maxDays = 60;
    } else if (bucketRange === "61-90 days") {
      minDays = 61;
      maxDays = 90;
    } else if (bucketRange === "90+ days") {
      minDays = 91;
      maxDays = null;
    } else {
      throw new Error(`Invalid bucket range: ${bucketRange}`);
    }

    // Because we cannot directly filter by computed days in SQL easily without a raw query, we'll fetch all active debts and filter client-side.
    // For large datasets, this is inefficient. Better to use a raw SQL expression:
    // WHERE julianday(?) - julianday(dueDate) BETWEEN ? AND ?
    // But since we already have paginateQueryBuilder, we'll do a subquery or raw SQL.
    // Let's use raw SQL for efficiency.

    // @ts-ignore
    const queryRunner = debtRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    try {
      let whereClause = `debt.status = 'active' AND debt.deletedAt IS NULL`;
      if (maxDays !== null) {
        whereClause += ` AND (julianday(:asOfDate) - julianday(debt.dueDate)) BETWEEN :minDays AND :maxDays`;
      } else {
        whereClause += ` AND (julianday(:asOfDate) - julianday(debt.dueDate)) >= :minDays`;
      }
      const parameters = { asOfDate, minDays, maxDays };
      const debts = await queryRunner.manager
        // @ts-ignore
        .createQueryBuilder(Debt, "debt")
        .leftJoinAndSelect("debt.borrower", "borrower")
        .where(whereClause, parameters)
        .orderBy("debt.dueDate", "ASC")
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const total = await queryRunner.manager
        // @ts-ignore
        .createQueryBuilder(Debt, "debt")
        .where(whereClause, parameters)
        .getCount();

      const pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };
      return { data: debts, pagination };
    } catch (error) {
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async markOverdueDebts() {
    const { debt: debtRepo } = await this.getRepositories();
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const now = new Date();
    // Kunin ang lahat ng active debts na dueDate < ngayon
    const overdueDebts = await debtRepo
      .createQueryBuilder("debt")
      .where("debt.status = :status", { status: "active" })
      .andWhere("debt.dueDate < :now", { now })
      .andWhere("debt.remainingAmount > 0")
      .getMany();

    let count = 0;
    for (const debt of overdueDebts) {
      // I‑update ang status nang hindi nagti‑trigger ng subscriber (para iwas recursion)
      debt.status = "overdue";
      debt.updatedAt = new Date();

      await updateDb(debtRepo, debt, { skipSignal: false });
      count++;
    }
    return { count };
  }

  /**
   * Get collection schedule grouped by period for active debts
   * @param {string} periodType - 'weekly' | 'monthly' | 'semi-annual' | 'yearly'
   * @param {string} asOfDate - YYYY-MM-DD (reference date)
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<Object>} grouped by debtor with period amounts
   */

  async getCollectionSchedule(
    periodType = "monthly",
    asOfDate = null,
    qr = null,
  ) {
    const repo = this._getRepo(qr, require("../entities/Debt"));
    const paymentRepo = this._getRepo(
      qr,
      require("../entities/PaymentTransaction"),
    );

    const referenceDate = asOfDate ? new Date(asOfDate) : new Date();
    referenceDate.setHours(0, 0, 0, 0);

    const debts = await repo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("debt.status IN (:...statuses)", {
        statuses: ["active", "overdue"],
      })
      .andWhere("debt.deletedAt IS NULL")
      .getMany();

    if (debts.length === 0) {
      return {
        periodType,
        periodLabel: this._getPeriodLabel(periodType),
        asOfDate: referenceDate.toISOString().slice(0, 10),
        debtors: [],
        totalDue: 0,
        totalDebtors: 0,
      };
    }

    const periodInfo = this._getPeriodInfo(periodType);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = [];
    const PAID_TOLERANCE = 0.05;

    for (const debt of debts) {
      const startDate = new Date(debt.createdAt);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(debt.dueDate);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) continue;

      const totalDays = Math.floor(
        (endDate - startDate) / (1000 * 60 * 60 * 24),
      );
      const totalPeriods = Math.max(1, Math.floor(totalDays / periodInfo.days));

      const annualRate = debt.interestRate || 0;
      const periodsPerYear = 365 / periodInfo.days;
      const ratePerPeriod = annualRate / 100 / periodsPerYear;

      let periodicPayment;
      if (ratePerPeriod === 0) {
        periodicPayment = debt.totalAmount / totalPeriods;
      } else {
        const factor = Math.pow(1 + ratePerPeriod, totalPeriods);
        periodicPayment =
          (debt.totalAmount * ratePerPeriod * factor) / (factor - 1);
      }
      periodicPayment = Math.round(periodicPayment * 100) / 100;

      const daysSinceStart = Math.floor(
        (today - startDate) / (1000 * 60 * 60 * 24),
      );
      const currentPeriod = Math.floor(daysSinceStart / periodInfo.days);
      const nextPeriodDate = new Date(startDate);
      nextPeriodDate.setDate(
        startDate.getDate() + (currentPeriod + 1) * periodInfo.days,
      );

      const periodStart = new Date(startDate);
      periodStart.setDate(
        startDate.getDate() + currentPeriod * periodInfo.days,
      );
      const periodEnd = new Date(startDate);
      periodEnd.setDate(
        startDate.getDate() + (currentPeriod + 1) * periodInfo.days,
      );

      // 🔍 DEBUG LOGS
      if (debt.id === 16) {
        console.log(
          `[getCollectionSchedule] Debt #16: periodStart=${periodStart.toISOString()}, periodEnd=${periodEnd.toISOString()}, today=${today.toISOString()}`,
        );
      }

      const periodStartStr = periodStart.toISOString().slice(0, 10);
      const periodRef = `[${periodType}:${periodStartStr}]`;

      const payments = await paymentRepo
        .createQueryBuilder("payment")
        .where("payment.debtId = :debtId", { debtId: debt.id })
        .andWhere("payment.deletedAt IS NULL")
        .andWhere(
          `(payment.reference LIKE :periodRef OR (payment.reference NOT LIKE :periodRef AND payment.paymentDate >= :start AND payment.paymentDate < :end))`,
          {
            periodRef: `%${periodRef}%`,
            start: periodStart,
            end: periodEnd,
          },
        )
        .getMany();

      console.log(
        `[getCollectionSchedule] Debt #${debt.id}: found ${payments.length} payments in period`,
      );
      if (debt.id === 16) {
        payments.forEach((p) =>
          console.log(
            `  Payment #${p.id}: date=${p.paymentDate.toISOString()}, amount=${p.amount}`,
          ),
        );
      }

      const totalPaidInPeriod = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalPaidRounded = Math.round(totalPaidInPeriod * 100) / 100;

      const isPaid = totalPaidRounded >= periodicPayment - PAID_TOLERANCE;

      if (debt.remainingAmount > 0.01) {
        results.push({
          debtId: debt.id,
          debtName: debt.name,
          borrowerId: debt.borrower?.id || 0,
          borrowerName: debt.borrower?.name || "Unknown",
          periodAmount: periodicPayment,
          totalPaidInPeriod: totalPaidRounded,
          isPaid,
          nextDueDate: nextPeriodDate.toISOString().slice(0, 10),
          remainingBalance: debt.remainingAmount,
          contact: debt.borrower?.contact || null,
          email: debt.borrower?.email || null,
        });
      }
    }

    const debtorMap = new Map();
    for (const item of results) {
      if (!debtorMap.has(item.borrowerId)) {
        debtorMap.set(item.borrowerId, {
          borrowerId: item.borrowerId,
          borrowerName: item.borrowerName,
          contact: item.contact,
          email: item.email,
          debts: [],
          totalPeriodAmount: 0,
          totalPaidInPeriod: 0,
          allPaid: true,
        });
      }
      const debtor = debtorMap.get(item.borrowerId);
      debtor.debts.push(item);
      debtor.totalPeriodAmount += item.periodAmount;
      debtor.totalPaidInPeriod += item.totalPaidInPeriod;
      if (!item.isPaid) debtor.allPaid = false;
    }

    const debtors = Array.from(debtorMap.values());
    const totalDue = debtors.reduce((sum, d) => sum + d.totalPeriodAmount, 0);

    return {
      periodType,
      periodLabel: periodInfo.label,
      asOfDate: referenceDate.toISOString().slice(0, 10),
      debtors,
      totalDue,
      totalDebtors: debtors.length,
    };
  }

  /**
   * Mark all debts of a borrower as paid for the given period
   * @param {number} borrowerId
   * @param {string} periodType
   * @param {string} paymentDate - YYYY-MM-DD
   * @param {number} methodId
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */

  async markPeriodPaid(
    borrowerId,
    periodType,
    paymentDate,
    methodId,
    user = "system",
    qr = null,
  ) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(qr, require("../entities/Debt"));
    const paymentRepo = this._getRepo(
      qr,
      require("../entities/PaymentTransaction"),
    );

    const debts = await repo
      .createQueryBuilder("debt")
      .where("debt.borrowerId = :borrowerId", { borrowerId })
      .andWhere("debt.status IN (:...statuses)", {
        statuses: ["active", "overdue"],
      })
      .andWhere("debt.deletedAt IS NULL")
      .getMany();

    if (debts.length === 0) {
      throw new Error("No active debts found for this borrower");
    }

    const periodInfo = this._getPeriodInfo(periodType);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDateObj = new Date(paymentDate);
    paymentDateObj.setHours(0, 0, 0, 0);

    const createdPayments = [];
    const PAID_TOLERANCE = 0.05;

    for (const debt of debts) {
      const startDate = new Date(debt.createdAt);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(debt.dueDate);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) continue;

      const totalDays = Math.floor(
        (endDate - startDate) / (1000 * 60 * 60 * 24),
      );
      const totalPeriods = Math.max(1, Math.floor(totalDays / periodInfo.days));

      const annualRate = debt.interestRate || 0;
      const periodsPerYear = 365 / periodInfo.days;
      const ratePerPeriod = annualRate / 100 / periodsPerYear;

      let periodicPayment;
      if (ratePerPeriod === 0) {
        periodicPayment = debt.totalAmount / totalPeriods;
      } else {
        const factor = Math.pow(1 + ratePerPeriod, totalPeriods);
        periodicPayment =
          (debt.totalAmount * ratePerPeriod * factor) / (factor - 1);
      }
      periodicPayment = Math.round(periodicPayment * 100) / 100;

      const daysSinceStart = Math.floor(
        (today - startDate) / (1000 * 60 * 60 * 24),
      );
      const currentPeriod = Math.floor(daysSinceStart / periodInfo.days);

      const periodStart = new Date(startDate);
      periodStart.setDate(
        startDate.getDate() + currentPeriod * periodInfo.days,
      );
      const periodEnd = new Date(startDate);
      periodEnd.setDate(
        startDate.getDate() + (currentPeriod + 1) * periodInfo.days,
      );

      // ✅ Use SUM aggregation for accuracy
      const paymentResult = await paymentRepo
        .createQueryBuilder("payment")
        .select("COALESCE(SUM(payment.amount), 0)", "totalPaid")
        .where("payment.debtId = :debtId", { debtId: debt.id })
        .andWhere("payment.paymentDate >= :start", { start: periodStart })
        .andWhere("payment.paymentDate < :end", { end: periodEnd })
        .andWhere("payment.deletedAt IS NULL")
        .getRawOne();

      const totalPaidRounded =
        Math.round(parseFloat(paymentResult.totalPaid || 0) * 100) / 100;

      // ✅ Skip if already paid
      if (totalPaidRounded >= periodicPayment - PAID_TOLERANCE) {
        console.log(
          `[markPeriodPaid] Debt #${debt.id} already paid for ${periodInfo.label} period`,
        );
        continue;
      }

      const periodStartStr = periodStart.toISOString().slice(0, 10); // YYYY-MM-DD
      const periodRef = `[${periodType}:${periodStartStr}]`;

      const remainingToPay =
        Math.round((periodicPayment - totalPaidRounded) * 100) / 100;
      if (remainingToPay <= PAID_TOLERANCE) continue;

      const payment = paymentRepo.create({
        amount: remainingToPay,
        paymentDate: paymentDateObj,
        reference: `Period payment (${periodInfo.label}) - auto ${periodRef}`,
        notes: `Automated payment for ${periodInfo.label} period (${periodStartStr})`,
        methodId,
        debt,
        recordedAt: new Date(),
      });
      const saved = await saveDb(paymentRepo, payment, { queryRunner: qr });
      createdPayments.push(saved);
    }

    if (createdPayments.length === 0) {
      throw new Error(
        `All debts for borrower #${borrowerId} are already paid for this period`,
      );
    }

    await auditLogger.logUpdate(
      "Debt",
      borrowerId,
      { action: "markPeriodPaid", periodType },
      { count: createdPayments.length },
      user,
    );
    return { payments: createdPayments, count: createdPayments.length };
  }

  // Helper methods
  _getPeriodInfo(periodType) {
    const map = {
      weekly: { days: 7, label: "Weekly" },
      monthly: { days: 30, label: "Monthly" },
      "semi-annual": { days: 182, label: "Semi-Annual" },
      yearly: { days: 365, label: "Yearly" },
    };
    return map[periodType];
  }

  _getPeriodLabel(periodType) {
    return this._getPeriodInfo(periodType).label;
  }

  /**
   * Fix floating-point precision issues in debt amounts
   * @param {number} debtId - Optional, if not provided, fix all debts
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async fixFloatingPointPrecision(debtId = null, qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const repo = this._getRepo(qr, require("../entities/Debt"));

    const qb = repo.createQueryBuilder("debt");
    if (debtId) {
      qb.where("debt.id = :id", { id: debtId });
    }
    const debts = await qb.getMany();

    let fixed = 0;
    for (const debt of debts) {
      const paidAmount = Math.round(debt.paidAmount * 100) / 100;
      const totalAmount = Math.round(debt.totalAmount * 100) / 100;
      const remainingAmount = Math.round(debt.remainingAmount * 100) / 100;

      if (
        debt.paidAmount !== paidAmount ||
        debt.totalAmount !== totalAmount ||
        debt.remainingAmount !== remainingAmount
      ) {
        debt.paidAmount = paidAmount;
        debt.totalAmount = totalAmount;
        debt.remainingAmount = remainingAmount;
        debt.updatedAt = new Date();
        await updateDb(repo, debt, { queryRunner: qr, skipSignal: true });
        fixed++;
      }
    }

    console.log(`[fixFloatingPointPrecision] Fixed ${fixed} debts`);
    return { fixed };
  }

  // services/Debt.js – inside DebtService class

  /**
   * Check if a borrower has active debts (remainingAmount > 0.01 and not deleted)
   * @param {number} borrowerId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<boolean>}
   */
  async hasActiveDebt(borrowerId, qr = null) {
    const count = await this.getActiveDebtCount(borrowerId, qr);
    return count > 0;
  }

  /**
   * Get count of active debts for a borrower
   * @param {number} borrowerId
   * @param {import("typeorm").QueryRunner | null} qr
   * @returns {Promise<number>}
   */
  async getActiveDebtCount(borrowerId, qr = null) {
    const Debt = require("../entities/Debt");
    const repo = this._getRepo(qr, Debt);
    const { MoreThan } = require("typeorm");
    const count = await repo.count({
      where: {
        borrower: { id: borrowerId },
        remainingAmount: MoreThan(0.01),
        deletedAt: null,
      },
    });
    return count;
  }

  // services/Debt.js – inside DebtService class

  /**
   * Get overdue debts (true overdue: status='overdue', remainingAmount > 0, dueDate < today)
   * @param {Object} options - Pagination and filter options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - 'ASC' or 'DESC'
   * @param {number} options.minDaysOverdue - Minimum days overdue (optional)
   * @returns {Promise<{ data: Debt[], pagination: {...} }>}
   */
  async getOverdueDebts(options = {}) {
    const { debt: debtRepo } = await this.getRepositories();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const qb = debtRepo
      .createQueryBuilder("debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("debt.status = :status", { status: "overdue" })
      .andWhere("debt.deletedAt IS NULL")
      .andWhere("debt.remainingAmount > 0.01")
      .andWhere("debt.dueDate < :today", { today });

    // Min days overdue filter (optional)
    if (options.minDaysOverdue) {
      const days = parseInt(options.minDaysOverdue);
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - days);
      qb.andWhere("debt.dueDate <= :cutoff", { cutoff });
    }

    // Search
    if (options.search) {
      qb.andWhere(
        "(debt.name LIKE :search OR borrower.name LIKE :search OR borrower.contact LIKE :search OR borrower.email LIKE :search)",
        { search: `%${options.search}%` },
      );
    }

    // Subqueries for stats (same as findAll)
    qb.addSelect((subQ) => {
      return subQ
        .select("COALESCE(SUM(payment.amount), 0)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "totalPaid");

    qb.addSelect((subQ) => {
      return subQ
        .select("COUNT(payment.id)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "paymentCount");

    qb.addSelect((subQ) => {
      return subQ
        .select("MAX(payment.paymentDate)")
        .from("payment_transactions", "payment")
        .where("payment.debtId = debt.id")
        .andWhere("payment.deletedAt IS NULL");
    }, "lastPaymentDate");

    qb.addSelect((subQ) => {
      return subQ
        .select("COALESCE(SUM(penalty.amount), 0)")
        .from("penalty_transactions", "penalty")
        .where("penalty.debtId = debt.id")
        .andWhere("penalty.deletedAt IS NULL");
    }, "totalPenalty");

    qb.addSelect((subQ) => {
      return subQ
        .select("COUNT(penalty.id)")
        .from("penalty_transactions", "penalty")
        .where("penalty.debtId = debt.id")
        .andWhere("penalty.deletedAt IS NULL");
    }, "penaltyCount");

    // Sorting
    let sortBy = options.sortBy || "dueDate";
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    const sortFieldMap = {
      borrowerName: "borrower.name",
      borrower: "borrower.name",
      createdAt: "debt.createdAt",
      updatedAt: "debt.updatedAt",
      dueDate: "debt.dueDate",
      name: "debt.name",
      totalAmount: "debt.totalAmount",
      paidAmount: "debt.paidAmount",
      remainingAmount: "debt.remainingAmount",
      status: "debt.status",
      id: "debt.id",
    };

    // Pagination
    const result = await paginateQueryBuilder(qb, {
      page: options.page,
      limit: options.limit,
    });
    let orderByField = sortFieldMap[sortBy] || `debt.${sortBy}`;

    // ✅ SAFETY: Whitelist allowed fields
    const allowedFields = [
      "debt.id",
      "debt.name",
      "debt.totalAmount",
      "debt.paidAmount",
      "debt.remainingAmount",
      "debt.dueDate",
      "debt.status",
      "debt.createdAt",
      "debt.updatedAt",
      "borrower.name",
    ];

    if (!allowedFields.includes(orderByField)) {
      console.warn(
        `[DebtService] Invalid sort field: ${orderByField}, falling back to dueDate`,
      );
      orderByField = "debt.dueDate";
    }

    qb.orderBy(orderByField, sortOrder);

    // Attach stats object to each debt (same as findAll)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    result.data = result.data.map((debt) => {
      const totalPaid = parseFloat(debt.totalPaid || 0);
      const totalPenalty = parseFloat(debt.totalPenalty || 0);
      const remainingBalance = debt.totalAmount - totalPaid;
      let daysOverdue = 0;
      const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
      if (dueDate && dueDate < now && remainingBalance > 0) {
        const diffTime = now.getTime() - dueDate.getTime();
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      const isFullyPaid = remainingBalance <= 0.01;

      debt.stats = {
        totalPaid,
        totalPenalty,
        remainingBalance,
        daysOverdue,
        paymentCount: parseInt(debt.paymentCount || 0),
        penaltyCount: parseInt(debt.penaltyCount || 0),
        lastPaymentDate: debt.lastPaymentDate || null,
        isFullyPaid,
      };
      return debt;
    });

    await auditLogger.logView("Debt", null, "system");
    return result;
  }
}

// Singleton instance
const debtService = new DebtService();
module.exports = debtService;
