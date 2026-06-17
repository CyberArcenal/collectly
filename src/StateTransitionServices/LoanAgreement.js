// src/services/LoanAgreementStateTransitionService.js
//@ts-check
const LoanAgreement = require("../entities/LoanAgreement");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const notificationService = require("../services/Notification");
const { emailEnabled, getSystemSetting, defaultInterestCalculationPeriod } = require("../utils/system");
const { reminderLogService } = require("../services/ReminderLog");
const {
  generateDraftCreatedEmail,
  generateSignedEmail,
} = require("../email-templates/loanAgreementTemplates");

class LoanAgreementStateTransitionService {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.agreementRepo = dataSource.getRepository(LoanAgreement);
  }

  _getRepo(qr, entityClass) {
    if (qr) return qr.manager.getRepository(entityClass);
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
   * After a loan agreement is created
   */
  async onCreated(agreement, user = "system", queryRunner = null) {
    logger.info(
      `[LoanAgreement] Draft agreement #${agreement.id} created for debt #${agreement.debt?.id} by ${user}`,
    );

    const debtRepo = this._getRepo(queryRunner, require("../entities/Debt"));
    const debt = await debtRepo.findOne({
      where: { id: agreement.debt.id },
      relations: ["borrower"],
    });

    if (debt?.borrower) {
      // ✅ In-app notification (draft created)
      await notificationService.create(
        {
          userId: 1,
          title: "Loan Agreement Created (Draft)",
          message: `A draft loan agreement for debt "${debt.name}" has been created. It is not yet signed.`,
          type: "info",
          metadata: { agreementId: agreement.id, debtId: debt.id },
        },
        user,
        queryRunner,
      );

      // Optional email (draft)
      const canSendEmail = await emailEnabled();
      const interestPeriod = debt.interestCalculationPeriod || await defaultInterestCalculationPeriod();
      if (canSendEmail && debt.borrower.email) {
        const emailData = await this._getEmailData();
        const html = generateDraftCreatedEmail({
          borrowerName: debt.borrower.name,
          agreementId: agreement.id,
          debtId: debt.id,
          debtName: debt.name,
          interestPeriod: interestPeriod,
          principalAmount: debt.totalAmount || 0,
          interestRate: debt.interestRate || 0,
          ...emailData,
        });
        await this._sendTemplateEmail(
          debt.borrower.email,
          "📄 Draft Loan Agreement Created",
          html,
          user,
          queryRunner,
        );
      }
    }

    await auditLogger.logCreate("LoanAgreement", agreement.id, agreement, user);
  }

  async onSigned(agreement, user = "system", queryRunner = null) {
    logger.info(`[LoanAgreement] Agreement #${agreement.id} signed by ${user}`);

    // ✅ Gamitin ang QueryBuilder para i-load ang debt at borrower
    const agreementRepo = this._getRepo(
      queryRunner,
      require("../entities/LoanAgreement"),
    );
    const fullAgreement = await agreementRepo
      .createQueryBuilder("agreement")
      .leftJoinAndSelect("agreement.debt", "debt")
      .leftJoinAndSelect("debt.borrower", "borrower")
      .where("agreement.id = :id", { id: agreement.id })
      .getOne();

    if (!fullAgreement) throw new Error(`Agreement #${agreement.id} not found`);
    const debt = fullAgreement.debt;
    if (!debt) throw new Error(`Debt not found for agreement #${agreement.id}`);

    const borrower = debt.borrower;
    if (!borrower) {
      logger.warn(
        `No borrower associated with debt #${debt.id} for agreement #${agreement.id}`,
      );
    }

    // Notify debtor (in‑app) – kung may borrower
    if (borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Loan Agreement Signed",
          message: `The loan agreement for debt "${debt.name}" has been officially signed.`,
          type: "info",
          metadata: {
            agreementId: fullAgreement.id,
            debtId: debt.id,
            signedBy: user,
          },
        },
        user,
        queryRunner,
      );

      // Email notification (if enabled at may email ang borrower)
      // Send email with template
      const canSendEmail = await emailEnabled();
      const interestPeriod = debt.interestCalculationPeriod || await defaultInterestCalculationPeriod();

      if (canSendEmail && borrower.email) {
        const emailData = await this._getEmailData();
        const html = generateSignedEmail({
          borrowerName: borrower.name,
          agreementId: fullAgreement.id,
          debtId: debt.id,
          debtName: debt.name,
          principalAmount: debt.totalAmount || 0,
          interestRate: debt.interestRate || 0,
          interestPeriod: interestPeriod,
          signedAt: fullAgreement.signedAt || new Date(),
          signedBy: fullAgreement.signedBy || user,
          ...emailData,
        });
        await this._sendTemplateEmail(
          borrower.email,
          "✅ Loan Agreement Signed",
          html,
          user,
          queryRunner,
        );
      } else {
        logger.warn(
          `Cannot send email: emailEnabled=${canSendEmail}, borrowerEmail=${borrower?.email}`,
        );
      }
    } else {
      logger.warn(
        `No borrower found for debt #${debt.id}, skipping notifications.`,
      );
    }

    // Audit log
    await auditLogger.logUpdate(
      "LoanAgreement",
      fullAgreement.id,
      { status: "draft" },
      { status: "signed", signedBy: user, signedAt: fullAgreement.signedAt },
      user,
    );
  }

  /**
   * After a loan agreement is updated
   */
  async onUpdated(
    oldAgreement,
    newAgreement,
    user = "system",
    queryRunner = null,
  ) {
    logger.info(
      `[LoanAgreement] Agreement #${newAgreement.id} updated by ${user}`,
    );

    await auditLogger.logUpdate(
      "LoanAgreement",
      newAgreement.id,
      oldAgreement,
      newAgreement,
      user,
    );
  }

  /**
   * Before a loan agreement is deleted
   */
  async onBeforeDelete(agreement, user = "system", queryRunner = null) {
    logger.info(
      `[LoanAgreement] Agreement #${agreement.id} about to be deleted by ${user}`,
    );
    // Add any validation here (e.g., prevent deletion if linked to active loan)
  }

  /**
   * After a loan agreement is deleted
   */
  async onAfterDelete(agreement, user = "system", queryRunner = null) {
    logger.info(
      `[LoanAgreement] Agreement #${agreement.id} deleted by ${user}`,
    );
    await auditLogger.logDelete("LoanAgreement", agreement.id, agreement, user);
  }
}

module.exports = { LoanAgreementStateTransitionService };
