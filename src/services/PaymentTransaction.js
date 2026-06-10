// services/PaymentTransactionService.js
//@ts-check
const auditLogger = require("../utils/auditLogger");
const { validatePaymentData } = require("../utils/paymentUtils");
const {
  enableEarlyPaymentDiscount,
  earlyPaymentDiscountRate,
} = require("../utils/system");
const { paginateQueryBuilder } = require("../utils/dbUtils/pagination");
const interestAccrualService = require("./InterestAccrualService");
// Time limit for editing payments (in hours)
const EDIT_TIME_LIMIT_HOURS = 24;

class PaymentTransactionService {
  constructor() {
    this.paymentRepository = null;
    this.debtRepository = null;
    this.methodRepository = null;
  }

  async initialize() {
    const { AppDataSource } = require("../main/db/data-source");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const Debt = require("../entities/Debt");
    const PaymentMethod = require("../entities/PaymentMethod");

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.paymentRepository = AppDataSource.getRepository(PaymentTransaction);
    this.debtRepository = AppDataSource.getRepository(Debt);
    this.methodRepository = AppDataSource.getRepository(PaymentMethod);
    console.log("PaymentTransactionService initialized");
  }

  async getRepositories() {
    if (!this.paymentRepository) {
      await this.initialize();
    }
    return {
      payment: this.paymentRepository,
      debt: this.debtRepository,
      method: this.methodRepository,
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
   * Create a new payment transaction with interest accrual before payment
   * @param {Object} paymentData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async create(paymentData, user = "system", qr = null) {
    // @ts-ignore
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    // @ts-ignore
    const paymentRepo = this._getRepo(qr, PaymentTransaction);
    // @ts-ignore
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));
    // @ts-ignore
    const methodRepo = this._getRepo(qr, require("../entities/PaymentMethod"));

    // Start a transaction if none provided
    let queryRunner = qr;
    let ownTransaction = false;
    if (!queryRunner) {
      const { AppDataSource } = require("../main/db/data-source");
      queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      ownTransaction = true;
    }

    try {
      const validation = validatePaymentData(paymentData);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      // @ts-ignore
      let { amount, paymentDate, reference, notes, debtId, methodId } =
        paymentData;
      let originalAmount = amount;

      // 1. Validate debt existence (using transactional repo)
      const debt = await debtRepo.findOne({ where: { id: debtId } });
      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      // 2. Accrue interest up to the payment date (updates debt.remainingAmount)
      const updatedDebt = await interestAccrualService.applyAccrual(
        debt,
        new Date(paymentDate),
        queryRunner, // pass the transaction queryRunner
      );

      // @ts-ignore
      const remainingBeforePayment = updatedDebt.remainingAmount;

      // 3. Validate payment amount does not exceed remaining balance
      if (amount > remainingBeforePayment) {
        throw new Error(
          `Payment amount (${amount}) exceeds remaining balance (${remainingBeforePayment})`,
        );
      }

      // 4. Early payment discount logic (optional)
      const discountEnabled = await enableEarlyPaymentDiscount();
      let discountApplied = false;
      if (discountEnabled) {
        const dueDate = new Date(debt.dueDate);
        const paymentDateObj = new Date(paymentDate);
        const isEarly = paymentDateObj < dueDate;
        // @ts-ignore
        const currentRemaining = updatedDebt.remainingAmount; // already with interest
        const isFullPayment =
          Math.abs(parseFloat(amount) - currentRemaining) < 0.01;
        if (isEarly && isFullPayment) {
          const discountRate = await earlyPaymentDiscountRate();
          if (discountRate > 0) {
            const discountedAmount =
              currentRemaining * (1 - discountRate / 100);
            amount = parseFloat(discountedAmount.toFixed(2));
            const discountNote = `[Early payment discount ${discountRate}% applied – original amount ${originalAmount}]`;
            notes = notes ? `${discountNote} ${notes}` : discountNote;
            discountApplied = true;
            console.log(
              `Early payment discount applied: original ${originalAmount} → discounted ${amount}`,
            );
          }
        }
      }

      // 5. Auto-generate reference if empty
      let finalReference = reference;
      if (!reference || reference.trim() === "") {
        finalReference = await this.generateUniqueReference(paymentRepo);
        console.log(`Auto-generated reference: ${finalReference}`);
      }

      // 6. Validate payment method if provided
      if (methodId) {
        const paymentMethod = await methodRepo.findOne({
          where: { id: methodId },
        });
        if (!paymentMethod) {
          throw new Error(`Payment method with ID ${methodId} not found`);
        }
      }

      // 7. Create payment record (debt already includes accrued interest)
      const payment = paymentRepo.create({
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        reference: finalReference,
        notes: notes || null,
        recordedAt: new Date(),
        methodId: methodId || null,
        debt: updatedDebt, // associate with debt (no need to update debt here, will be done by subscriber)
      });

      // @ts-ignore
      const saved = await saveDb(paymentRepo, payment, { queryRunner });

      // 8. Commit transaction if we started it (subscriber will trigger after commit)
      if (ownTransaction) {
        await queryRunner.commitTransaction();
      }

      await auditLogger.logCreate("PaymentTransaction", saved.id, saved, user);
      return saved;
    } catch (error) {
      if (ownTransaction) await queryRunner.rollbackTransaction();
      // @ts-ignore
      console.error("Failed to create payment:", error.message);
      throw error;
    } finally {
      if (ownTransaction) await queryRunner.release();
    }
  }

  /**
   * Update an existing payment transaction (no side effects)
   * @param {number} id
   * @param {Object} paymentData
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   * @param {boolean} isAdmin - allows bypassing time limit
   */
  async update(id, paymentData, user = "system", qr = null, isAdmin = false) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const PaymentMethod = require("../entities/PaymentMethod");
    // @ts-ignore
    const paymentRepo = this._getRepo(qr, PaymentTransaction);
    // @ts-ignore
    const methodRepo = this._getRepo(qr, PaymentMethod);
    // @ts-ignore
    const debtRepo = this._getRepo(qr, require("../entities/Debt"));

    try {
      const existing = await paymentRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!existing) throw new Error(`Payment #${id} not found`);

      // Time limit check
      const createdAt = existing.recordedAt;
      const hoursSinceCreation =
        // @ts-ignore
        (Date.now() - new Date(createdAt)) / (1000 * 60 * 60);
      if (hoursSinceCreation > EDIT_TIME_LIMIT_HOURS && !isAdmin) {
        throw new Error(
          `Cannot edit payment after ${EDIT_TIME_LIMIT_HOURS} hours`,
        );
      }

      const oldData = { ...existing };
      const oldDebtId = existing.debt.id;
      // @ts-ignore
      let newDebtId = null;

      // Update debt if changed (but do NOT recalculate balances here)
      // @ts-ignore
      if (paymentData.debtId && paymentData.debtId !== oldDebtId) {
        const newDebt = await debtRepo.findOne({
          // @ts-ignore
          where: { id: paymentData.debtId },
        });
        // @ts-ignore
        if (!newDebt) throw new Error(`Debt ${paymentData.debtId} not found`);
        existing.debt = newDebt;
        // @ts-ignore
        newDebtId = paymentData.debtId;
        // @ts-ignore
        delete paymentData.debtId;
      }

      // Update payment method if provided
      // @ts-ignore
      if (paymentData.methodId !== undefined) {
        // @ts-ignore
        if (paymentData.methodId === null || paymentData.methodId === "") {
          existing.methodId = null;
        } else {
          const newMethod = await methodRepo.findOne({
            // @ts-ignore
            where: { id: paymentData.methodId },
          });
          if (!newMethod)
            // @ts-ignore
            throw new Error(`Payment method ${paymentData.methodId} not found`);
          // @ts-ignore
          existing.methodId = paymentData.methodId;
        }
        // @ts-ignore
        delete paymentData.methodId;
      }

      // Update other fields
      // @ts-ignore
      if (paymentData.amount !== undefined)
        // @ts-ignore
        paymentData.amount = parseFloat(paymentData.amount);
      // @ts-ignore
      if (paymentData.paymentDate)
        // @ts-ignore
        paymentData.paymentDate = new Date(paymentData.paymentDate);
      Object.assign(existing, paymentData);
      existing.updatedAt = new Date();

      // Note: No validation against remaining balance because side effects are handled elsewhere.
      // The state transition service will handle consistency when needed (e.g., on confirm/void/refund).

      // @ts-ignore
      const saved = await updateDb(paymentRepo, existing, { queryRunner: qr });
      await auditLogger.logUpdate(
        "PaymentTransaction",
        id,
        oldData,
        saved,
        user,
      );
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Update payment failed:", error.message);
      throw error;
    }
  }

  /**
   * Soft delete a payment transaction (no side effects)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async delete(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    // @ts-ignore
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    try {
      const payment = await paymentRepo.findOne({
        where: { id },
        relations: ["debt"],
      });
      if (!payment) throw new Error(`Payment #${id} not found`);
      if (payment.deletedAt)
        throw new Error(`Payment #${id} is already deleted`);

      const oldData = { ...payment };
      payment.deletedAt = new Date();
      payment.updatedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(paymentRepo, payment, { queryRunner: qr });
      await auditLogger.logDelete("PaymentTransaction", id, oldData, user);
      console.log(`Payment #${id} soft deleted`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to delete payment:", error.message);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted payment transaction (no side effects)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async restore(id, user = "system", qr = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    // @ts-ignore
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    try {
      const payment = await paymentRepo.findOne({
        where: { id },
        withDeleted: true,
        relations: ["debt"],
      });
      if (!payment) throw new Error(`Payment #${id} not found`);
      if (!payment.deletedAt) throw new Error(`Payment #${id} is not deleted`);

      // No validation against remaining balance here – state transition service will handle consistency
      payment.deletedAt = null;
      payment.updatedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(paymentRepo, payment, { queryRunner: qr });
      await auditLogger.logUpdate(
        "PaymentTransaction",
        id,
        { deletedAt: true },
        { deletedAt: null },
        user,
      );
      console.log(`Payment #${id} restored`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to restore payment:", error.message);
      throw error;
    }
  }

  /**
   * Permanently delete a payment transaction (no side effects)
   * @param {number} id
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} qr
   */
  async permanentlyDelete(id, user = "system", qr = null) {
    const { removeDb } = require("../utils/dbUtils/dbActions");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    // @ts-ignore
    const paymentRepo = this._getRepo(qr, PaymentTransaction);

    const payment = await paymentRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: ["debt"],
    });
    if (!payment) throw new Error(`Payment #${id} not found`);

    // @ts-ignore
    await removeDb(paymentRepo, payment);
    await auditLogger.logDelete("PaymentTransaction", id, payment, user);
    console.log(`Payment #${id} permanently deleted`);
  }

  /**
   * Find payment by ID
   * @param {number} id
   * @param {boolean} includeDeleted
   */
  async findById(id, includeDeleted = false) {
    const { payment: paymentRepo } = await this.getRepositories();
    const options = { where: { id }, relations: ["debt", "debt.borrower"] };
    if (!includeDeleted) {
      // @ts-ignore
      options.where.deletedAt = null;
    }
    // @ts-ignore
    const payment = await paymentRepo.findOne(options);
    if (!payment) throw new Error(`Payment #${id} not found`);
    // @ts-ignore
    await auditLogger.logView("PaymentTransaction", id, "system");
    return payment;
  }

  /**
   * Find all payment transactions with filters, pagination, sorting (read-only)
   * @param {Object} options
   */
  async findAll(options = {}) {
    const { payment: paymentRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = paymentRepo
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower");

    // @ts-ignore
    if (!options.includeDeleted) {
      qb.andWhere("payment.deletedAt IS NULL");
    }

    // Filters
    // @ts-ignore
    if (options.debtId)
      // @ts-ignore
      qb.andWhere("debt.id = :debtId", { debtId: options.debtId });
    // @ts-ignore
    if (options.borrowerId)
      qb.andWhere("borrower.id = :borrowerId", {
        // @ts-ignore
        borrowerId: options.borrowerId,
      });
    // @ts-ignore
    if (options.reference)
      qb.andWhere("payment.reference LIKE :reference", {
        // @ts-ignore
        reference: `%${options.reference}%`,
      });
    // @ts-ignore
    if (options.paymentDateFrom)
      qb.andWhere("payment.paymentDate >= :paymentDateFrom", {
        // @ts-ignore
        paymentDateFrom: new Date(options.paymentDateFrom),
      });
    // @ts-ignore
    if (options.paymentDateTo)
      qb.andWhere("payment.paymentDate <= :paymentDateTo", {
        // @ts-ignore
        paymentDateTo: new Date(options.paymentDateTo),
      });
    // @ts-ignore
    if (options.minAmount)
      qb.andWhere("payment.amount >= :minAmount", {
        // @ts-ignore
        minAmount: options.minAmount,
      });
    // @ts-ignore
    if (options.maxAmount)
      qb.andWhere("payment.amount <= :maxAmount", {
        // @ts-ignore
        maxAmount: options.maxAmount,
      });
    // @ts-ignore
    if (options.search) {
      qb.andWhere(
        "(payment.reference LIKE :search OR payment.notes LIKE :search OR debt.name LIKE :search OR borrower.name LIKE :search)",
        // @ts-ignore
        { search: `%${options.search}%` },
      );
    }

    // Sorting
    // @ts-ignore
    const sortBy = options.sortBy || "paymentDate";
    // @ts-ignore
    const sortOrder = options.sortOrder === "ASC" ? "ASC" : "DESC";
    qb.orderBy(`payment.${sortBy}`, sortOrder);

    const result = await paginateQueryBuilder(qb, {
      // @ts-ignore
      page: options.page,
      // @ts-ignore
      limit: options.limit,
    });

    await auditLogger.logView("PaymentTransaction", null, "system");
    return result; // { data: [], pagination: {} }

    // Pagination
    // if (options.page && options.limit) {
    //   const offset = (options.page - 1) * options.limit;
    //   qb.skip(offset).take(options.limit);
    // }

    // const payments = await qb.getMany();
    // await auditLogger.logView("PaymentTransaction", null, "system");
    // return payments;
  }

  /**
   * Get payment statistics (read-only, no side effects)
   */
  async getStatistics() {
    const { payment: paymentRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = paymentRepo
      .createQueryBuilder("payment")
      .where("payment.deletedAt IS NULL");

    const totalPayments = await qb.getCount();
    const totalAmount = await qb
      .clone()
      .select("SUM(payment.amount)", "sum")
      .getRawOne();
    const averageAmount = await qb
      .clone()
      .select("AVG(payment.amount)", "avg")
      .getRawOne();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayments = await qb
      .clone()
      .andWhere("payment.paymentDate >= :thirtyDaysAgo", { thirtyDaysAgo })
      .getCount();

    const uniqueDebts = await qb
      .clone()
      .select("COUNT(DISTINCT payment.debtId)", "count")
      .getRawOne();

    return {
      totalPayments,
      totalAmountCollected: parseFloat(totalAmount?.sum) || 0,
      averagePaymentAmount: parseFloat(averageAmount?.avg) || 0,
      paymentsLast30Days: recentPayments,
      debtsWithPayments: parseInt(uniqueDebts?.count) || 0,
    };
  }

  /**
   * Export payment transactions to CSV or JSON (read-only)
   */
  async exportPayments(format = "json", filters = {}, user = "system") {
    const results = await this.findAll(filters);
    const payments = results.data;

    let exportData;
    if (format === "csv") {
      const headers = [
        "ID",
        "Amount",
        "Payment Date",
        "Reference",
        "Notes",
        "Recorded At",
        "Debt ID",
        "Debt Name",
        "Borrower Name",
      ];
      const rows = payments.map((p) => [
        p.id,
        p.amount,
        new Date(p.paymentDate).toLocaleDateString(),
        p.reference || "",
        (p.notes || "").replace(/,/g, " "),
        new Date(p.recordedAt).toLocaleString(),
        p.debt?.id ?? "",
        p.debt?.name ?? "",
        p.debt?.borrower?.name ?? "",
      ]);
      exportData = {
        format: "csv",
        data: [headers, ...rows].map((row) => row.join(",")).join("\n"),
        filename: `payments_export_${new Date().toISOString().split("T")[0]}.csv`,
      };
    } else {
      exportData = {
        format: "json",
        data: payments,
        filename: `payments_export_${new Date().toISOString().split("T")[0]}.json`,
      };
    }

    // @ts-ignore
    await auditLogger.logExport("PaymentTransaction", format, filters, user);
    console.log(`Exported ${payments.length} payments in ${format} format`);
    return exportData;
  }

  /**
   * Bulk create payments (no side effects)
   */
  // @ts-ignore
  async bulkCreate(paymentsArray, user = "system", qr = null) {
    const results = { created: [], errors: [] };
    for (const data of paymentsArray) {
      try {
        const saved = await this.create(data, user, qr);
        // @ts-ignore
        results.created.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ payment: data, error: err.message });
      }
    }
    return results;
  }

  /**
   * Bulk update payments (no side effects)
   */
  // @ts-ignore
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
   * Import payments from CSV file (no side effects)
   */
  // @ts-ignore
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
        const paymentData = {
          // @ts-ignore
          amount: parseFloat(record.amount),
          // @ts-ignore
          paymentDate: record.paymentDate,
          // @ts-ignore
          reference: record.reference || null,
          // @ts-ignore
          notes: record.notes || null,
          // @ts-ignore
          debtId: parseInt(record.debtId, 10),
          // @ts-ignore
          methodId: record.methodId ? parseInt(record.methodId, 10) : null,
        };
        const validation = validatePaymentData(paymentData);
        if (!validation.valid) throw new Error(validation.errors.join(", "));
        const saved = await this.create(paymentData, user, qr);
        // @ts-ignore
        results.imported.push(saved);
      } catch (err) {
        // @ts-ignore
        results.errors.push({ row: record, error: err.message });
      }
    }
    return results;
  }

  // @ts-ignore
  async generateUniqueReference(paymentRepo) {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    let reference = `PAY-${datePart}-${randomPart}`;

    let existing = await paymentRepo.findOne({
      where: { reference },
      withDeleted: true,
    });
    let attempts = 0;
    while (existing && attempts < 5) {
      const newRandom = Math.floor(10000 + Math.random() * 90000);
      reference = `PAY-${datePart}-${newRandom}`;
      existing = await paymentRepo.findOne({
        where: { reference },
        withDeleted: true,
      });
      attempts++;
    }
    if (existing) {
      reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    return reference;
  }

  /**
   * Get collection report aggregated by date and debtor
   * @param {string} fromDate - YYYY-MM-DD
   * @param {string} toDate - YYYY-MM-DD
   * @param {number} target - expected total collection amount
   */
  async getCollectionReport(fromDate, toDate, target) {
    const { payment: paymentRepo } = await this.getRepositories();
    // @ts-ignore
    const qb = paymentRepo
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("payment.paymentDate >= :fromDate", {
        fromDate: new Date(fromDate),
      })
      .andWhere("payment.paymentDate <= :toDate", { toDate: new Date(toDate) })
      .andWhere("payment.deletedAt IS NULL");

    const payments = await qb.getMany();

    // Group by date
    const byDate = new Map(); // date string -> total
    const byDebtor = new Map(); // debtorId -> { name, total, count, lastDate }
    for (const p of payments) {
      // @ts-ignore
      const dateKey = p.paymentDate.toISOString().slice(0, 10);
      byDate.set(dateKey, (byDate.get(dateKey) || 0) + p.amount);

      // @ts-ignore
      const debtor = p.debt?.borrower;
      if (debtor) {
        const existing = byDebtor.get(debtor.id);
        const newTotal = (existing?.total || 0) + p.amount;
        const newCount = (existing?.count || 0) + 1;
        // @ts-ignore
        const paymentDateStr = p.paymentDate.toISOString().slice(0, 10);
        const lastDate =
          !existing?.lastDate || paymentDateStr > existing.lastDate
            ? paymentDateStr
            : existing.lastDate;
        byDebtor.set(debtor.id, {
          name: debtor.name,
          total: newTotal,
          count: newCount,
          lastDate,
        });
      }
    }

    // Generate date range
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const daysInPeriod = Math.max(
      1,
      // @ts-ignore
      Math.ceil((end - start) / (1000 * 3600 * 24)) + 1,
    );
    const dailyExpected = target / daysInPeriod;

    const dataPoints = [];
    let current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10);
      dataPoints.push({
        date: dateStr,
        actualCollected: byDate.get(dateStr) || 0,
        expectedCollected: dailyExpected,
      });
      current.setDate(current.getDate() + 1);
    }

    const totalActual = Array.from(byDate.values()).reduce((a, b) => a + b, 0);
    const totalExpected = target;
    const collectionRate =
      totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
    const averagePerDay = totalActual / daysInPeriod;

    const paymentsByDebtor = Array.from(byDebtor.entries())
      .map(([id, data]) => ({
        debtorId: id,
        debtorName: data.name,
        totalPaid: data.total,
        transactionCount: data.count,
        lastPaymentDate: data.lastDate,
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid);

    return {
      period: { from: fromDate, to: toDate },
      totalActual,
      totalExpected,
      collectionRate,
      averagePerDay,
      dataPoints,
      paymentsByDebtor,
    };
  }
}

// Singleton instance
const paymentTransactionService = new PaymentTransactionService();
module.exports = paymentTransactionService;
