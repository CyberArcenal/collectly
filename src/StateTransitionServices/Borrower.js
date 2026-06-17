// src/services/BorrowerStateTransitionService.js
//@ts-check
const Borrower = require("../entities/Borrower");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const {
  emailEnabled,
  smsEnabled,
  getSystemSetting,
} = require("../utils/system");
const notificationService = require("../services/Notification");
const { reminderLogService } = require("../services/ReminderLog");
const {
  generateActivatedEmail,
  generateDeactivatedEmail,
  generateMergedEmail,
} = require("../email-templates/borrowerStatusTemplates");

class BorrowerStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.borrowerRepo = dataSource.getRepository(Borrower);
  }

  /**
   * Helper: get repository (transactional if queryRunner provided)
   * @param {import("typeorm").QueryRunner|null} qr
   * @param {Function} entityClass
   * @returns {import("typeorm").Repository}
   */
  _getRepo(qr, entityClass) {
    if (qr) {
      return qr.manager.getRepository(entityClass);
    }
    return this.dataSource.getRepository(entityClass);
  }

  /**
   * Helper to get common email data from system settings
   */
  async _getEmailData() {
    const [companyName, branchAddress, contactEmail, contactPhone] =
      await Promise.all([
        getSystemSetting("company_name", "Collectly"),
        getSystemSetting("branch_location", "Manila, Philippines"),
        getSystemSetting("smtp_from_email", "support@collectly.ph"),
        getSystemSetting("twilio_phone_number", "+63 (2) 8123-4567"),
      ]);
    return { companyName, branchAddress, contactEmail, contactPhone };
  }

  /**
   * Send email using template
   */
  async _sendTemplateEmail(recipient, subject, html, user, queryRunner) {
    try {
      await reminderLogService.createReminder(
        {
          to: recipient,
          subject,
          html,
          text: html.replace(/<[^>]*>/g, ""), // plain text fallback
        },
        user,
        queryRunner,
      );
      return true;
    } catch (err) {
      logger.error(`Failed to queue email to ${recipient}:`, err);
      throw err;
    }
  }

  /**
   * Send email via ReminderLogService (queues and logs automatically)
   */
  async _sendEmail(recipient, subject, message, user, queryRunner) {
    try {
      await reminderLogService.createReminder(
        {
          to: recipient,
          subject,
          html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
          text: message,
        },
        user,
        queryRunner,
      );
      return true;
    } catch (err) {
      logger.error(`Failed to queue email to ${recipient}:`, err);
      throw err;
    }
  }

  /**
   * Helper to send an SMS (placeholder)
   */
  async _sendSms(phoneNumber, message, user, queryRunner) {
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    return true;
  }

  /**
   * Activate a borrower (set deletedAt = null)
   */
  async onActivate(borrower, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Activating borrower #${borrower.id} by ${user}`);

    const repo = this._getRepo(queryRunner, Borrower);
    const oldDeletedAt = borrower.deletedAt;

    // Set deletedAt = null
    borrower.deletedAt = null;
    borrower.updatedAt = new Date();

    // Use updateDb – no extra args, just repo and entity
    const saved = await updateDb(repo, borrower, { queryRunner: queryRunner });

    // Audit log (manually because updateDb does not log externally)
    await auditLogger.logUpdate(
      "Borrower",
      borrower.id,
      { deletedAt: oldDeletedAt },
      { deletedAt: null },
      user,
    );

    // In-app notification
    await notificationService.create(
      {
        userId: 1,
        title: "Account Reactivated",
        message: `Borrower "${borrower.name}" has been reactivated.`,
        type: "info",
        metadata: { borrowerId: borrower.id },
      },
      user,
      queryRunner,
    );

    // Email/SMS
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();

    // In onActivate, after the audit log
    if (canSendEmail && borrower.email) {
      const emailData = await this._getEmailData();
      const html = generateActivatedEmail({
        borrowerId: borrower.id,
        borrowerName: borrower.name,
        borrowerEmail: borrower.email,
        borrowerContact: borrower.contact,
        ...emailData,
      });
      await this._sendTemplateEmail(
        borrower.email,
        "✅ Account Reactivated",
        html,
        user,
        queryRunner,
      );
    }

    if (canSendSms && borrower.contact) {
      const msg = `Dear ${borrower.name}, your account has been reactivated.`;
      await this._sendSms(borrower.contact, msg, user, queryRunner);
    }

    return saved;
  }

  /**
   * Deactivate (soft delete) a borrower
   */
  async onDeactivate(borrower, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Deactivating borrower #${borrower.id} by ${user}`,
    );

    const repo = this._getRepo(queryRunner, Borrower);

    // Set deletedAt = now
    borrower.deletedAt = new Date();
    borrower.updatedAt = new Date();

    // No extra arguments
    const saved = await updateDb(repo, borrower, { queryRunner: queryRunner });

    await auditLogger.logDelete(
      "Borrower",
      borrower.id,
      { deletedAt: true },
      user,
    );

    // Mark all active debts as defaulted
    const Debt = require("../entities/Debt");
    const debtRepo = this._getRepo(queryRunner, Debt);
    const activeDebts = await debtRepo.find({
      where: { borrower: { id: borrower.id }, status: "active" },
    });
    for (const debt of activeDebts) {
      debt.status = "defaulted";
      debt.updatedAt = new Date();
      await updateDb(debtRepo, debt, { queryRunner: queryRunner });
    }

    logger.warn(
      `[Collections] Borrower #${borrower.id} deactivated. All active debts set to defaulted.`,
    );

    await notificationService.create(
      {
        userId: 1,
        title: "Borrower Deactivated",
        message: `Borrower "${borrower.name}" (ID: ${borrower.id}) has been deactivated. All active debts have been marked as defaulted.`,
        type: "info",
        metadata: { borrowerId: borrower.id },
      },
      user,
      queryRunner,
    );

    // In onDeactivate, after marking debts as defaulted
    const canSendEmail = await emailEnabled();
    if (canSendEmail && borrower.email) {
      const emailData = await this._getEmailData();
      const html = generateDeactivatedEmail({
        borrowerId: borrower.id,
        borrowerName: borrower.name,
        borrowerEmail: borrower.email,
        borrowerContact: borrower.contact,
        activeDebtCount: activeDebts.length,
        ...emailData,
      });
      await this._sendTemplateEmail(
        borrower.email,
        "⚠️ Account Deactivated",
        html,
        user,
        queryRunner,
      );
    }

    return saved;
  }

  /**
   * Merge duplicate borrower into another
   */
  async onMerge(
    sourceBorrower,
    targetBorrower,
    user = "system",
    queryRunner = null,
  ) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Merging borrower #${sourceBorrower.id} into #${targetBorrower.id} by ${user}`,
    );

    if (!queryRunner) {
      throw new Error(
        "Merge must be performed within a transaction. Provide queryRunner.",
      );
    }

    const Debt = require("../entities/Debt");
    const PaymentTransaction = require("../entities/PaymentTransaction");
    const PenaltyTransaction = require("../entities/PenaltyTransaction");
    const LoanAgreement = require("../entities/LoanAgreement");
    const Notification = require("../entities/Notification");

    const debtRepo = this._getRepo(queryRunner, Debt);
    const debtsToUpdate = await debtRepo.find({
      where: { borrower: { id: sourceBorrower.id } },
    });
    for (const debt of debtsToUpdate) {
      debt.borrower = targetBorrower;
      debt.updatedAt = new Date();
      await updateDb(debtRepo, debt, { queryRunner: queryRunner });
    }

    // For payment transactions, we need to find those linked through debt
    const paymentRepo = this._getRepo(queryRunner, PaymentTransaction);
    const paymentsToUpdate = await paymentRepo
      .createQueryBuilder("pt")
      .leftJoin("pt.debt", "debt")
      .where("debt.borrower = :borrowerId", { borrowerId: sourceBorrower.id })
      .getMany();
    for (const payment of paymentsToUpdate) {
      payment.updatedAt = new Date();
      await updateDb(paymentRepo, payment, { queryRunner: queryRunner });
    }

    const penaltyRepo = this._getRepo(queryRunner, PenaltyTransaction);
    const penaltiesToUpdate = await penaltyRepo
      .createQueryBuilder("pen")
      .leftJoin("pen.debt", "debt")
      .where("debt.borrower = :borrowerId", { borrowerId: sourceBorrower.id })
      .getMany();
    for (const penalty of penaltiesToUpdate) {
      penalty.updatedAt = new Date();
      await updateDb(penaltyRepo, penalty, { queryRunner: queryRunner });
    }

    const agreementRepo = this._getRepo(queryRunner, LoanAgreement);
    const agreementsToUpdate = await agreementRepo
      .createQueryBuilder("la")
      .leftJoin("la.debt", "debt")
      .where("debt.borrower = :borrowerId", { borrowerId: sourceBorrower.id })
      .getMany();
    for (const agreement of agreementsToUpdate) {
      agreement.updatedAt = new Date();
      await updateDb(agreementRepo, agreement, { queryRunner: queryRunner });
    }

    const notifRepo = this._getRepo(queryRunner, Notification);
    const notificationsToUpdate = await notifRepo
      .createQueryBuilder("n")
      .leftJoin("n.debt", "debt")
      .where("debt.borrower = :borrowerId", { borrowerId: sourceBorrower.id })
      .getMany();
    for (const notif of notificationsToUpdate) {
      notif.updatedAt = new Date();
      await updateDb(notifRepo, notif, { queryRunner: queryRunner });
    }

    // Audit logs
    await auditLogger.logUpdate(
      "Borrower",
      sourceBorrower.id,
      { mergedInto: targetBorrower.id },
      { message: "Merged into target" },
      user,
    );
    await auditLogger.logUpdate(
      "Borrower",
      targetBorrower.id,
      { sourceMerged: sourceBorrower.id },
      { message: "Received merged data" },
      user,
    );

    // Soft delete source borrower with note
    const sourceRepo = this._getRepo(queryRunner, Borrower);
    sourceBorrower.deletedAt = new Date();
    sourceBorrower.notes = sourceBorrower.notes
      ? `${sourceBorrower.notes}\n[Merged into borrower #${targetBorrower.id} on ${new Date().toISOString()}]`
      : `[Merged into borrower #${targetBorrower.id} on ${new Date().toISOString()}]`;
    sourceBorrower.updatedAt = new Date();
    await updateDb(sourceRepo, sourceBorrower, { queryRunner: queryRunner });

    // In-app notification
    await notificationService.create(
      {
        userId: 1,
        title: "Account Merged",
        message: `Borrower #${sourceBorrower.id} has been merged into #${targetBorrower.id}.`,
        type: "info",
        metadata: { sourceId: sourceBorrower.id, targetId: targetBorrower.id },
      },
      user,
      queryRunner,
    );

    // Email notifications
    const canSendEmail = await emailEnabled();
    const emailData = await this._getEmailData();

    // Count debts transferred
    const debtsTransferred = debtsToUpdate.length;

    if (canSendEmail) {
      // Send to source borrower
      if (sourceBorrower.email) {
        const mergedHtml = generateMergedEmail({
          sourceBorrowerId: sourceBorrower.id,
          sourceBorrowerName: sourceBorrower.name,
          targetBorrowerId: targetBorrower.id,
          targetBorrowerName: targetBorrower.name,
          debtsTransferred,
          ...emailData,
        });
        await this._sendTemplateEmail(
          sourceBorrower.email,
          "📋 Account Merge – Your Account Merged",
          mergedHtml.source,
          user,
          queryRunner,
        );
      }

      // Send to target borrower
      if (targetBorrower.email) {
        const mergedHtml = generateMergedEmail({
          sourceBorrowerId: sourceBorrower.id,
          sourceBorrowerName: sourceBorrower.name,
          targetBorrowerId: targetBorrower.id,
          targetBorrowerName: targetBorrower.name,
          debtsTransferred,
          ...emailData,
        });
        await this._sendTemplateEmail(
          targetBorrower.email,
          "📋 Account Merge – New Debts Added",
          mergedHtml.target,
          user,
          queryRunner,
        );
      }
    }
  }
}

module.exports = { BorrowerStateTransitionService };
