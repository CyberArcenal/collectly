// src/services/LoanApplicationStateTransitionService.js
//@ts-check
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const {
  enforceCreditCheck,
  emailEnabled,
  smsEnabled,
  requireLoanAgreement,
  loanAgreementTemplate,
  defaultPenaltyRate,
  defaultLoanTermMonths,
  defaultInterestCalculationPeriod,
} = require("../utils/system");
const notificationService = require("../services/Notification");
const debtService = require("../services/Debt");
const { reminderLogService } = require("../services/ReminderLog");
const loanAgreementService = require("../services/LoanAgreement");
const pdfGenerator = require("../services/PDFGenerator");
const fs = require("fs").promises;
const path = require("path");
const {
  generateSubmittedEmail,
  generateApprovedEmail,
  generateRejectedEmail,
} = require("../email-templates/loanStatusTemplates");

class LoanApplicationStateTransitionService {
  /**
   * @param {{ getRepository: (arg0: any) => any; }} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.appRepo = dataSource.getRepository(
      require("../entities/LoanApplication"),
    );
  }

  /**
   * Helper to send formatted HTML email
   * @param {any} recipient
   * @param {string} subject
   * @param {string} html
   * @param {string | undefined} user
   * @param {import("typeorm").QueryRunner | null | undefined} queryRunner
   */
  async _sendFormattedEmail(recipient, subject, html, user, queryRunner) {
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
   * Helper: get repository (transactional)
   * @param {any} entity
   * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
   */
  _getRepo(entity, queryRunner) {
    if (queryRunner) return queryRunner.manager.getRepository(entity);
    return this.dataSource.getRepository(entity);
  }

  /**
   * Send email via ReminderLogService (queues and logs automatically)
   * @param {any} recipient
   * @param {string} subject
   * @param {string} message
   * @param {string | undefined} user
   * @param {import("typeorm").QueryRunner | null | undefined} queryRunner
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
      // @ts-ignore
      logger.error(`Failed to queue email to ${recipient}:`, err);
      throw err;
    }
  }

  /**
   * @param {any} phoneNumber
   * @param {string} message
   * @param {string} user
   * @param {null} queryRunner
   */
  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  async _sendSms(phoneNumber, message, user, queryRunner) {
    // Placeholder – integrate with actual SMS channel via NotificationLogService
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    return true;
  }

  /**
   * Called when a loan application is submitted (afterInsert)
   * @param {{ id: any; debtorName: any; requestedAmount: any; debtorId: number; }} application
   */
  async onSubmit(application, user = "system", queryRunner = null) {
    logger.info(
      `[LoanApplication] Application #${application.id} (debtor: ${application.debtorName}) submitted by ${user}`,
    );

    // In‑app notification to loan officer

    // Send confirmation email to applicant
    const canSendEmail = await emailEnabled();
    if (application.debtorEmail && canSendEmail) {
      const companyName = await require("../utils/system").companyName();
      const html = generateSubmittedEmail({
        applicantName: application.debtorName,
        companyName: companyName,
        amount: application.requestedAmount,
        purpose: application.purpose,
        applicationId: application.id,
        contactEmail: await require("../utils/system").smtpFromEmail(),
      });
      await this._sendFormattedEmail(
        application.debtorEmail,
        "Loan Application Received - Thank You",
        html,
        user,
        queryRunner,
      );
    }

    const needCreditCheck = await enforceCreditCheck();
    if (needCreditCheck && application.debtorId) {
      try {
        const creditCheckService = require("../services/CreditCheck");
        await creditCheckService.performCreditCheck(
          application.debtorId,
          user,
          queryRunner,
        );
        logger.info(
          `Credit check triggered for debtor #${application.debtorId}`,
        );
      } catch (err) {
        // @ts-ignore
        logger.error("Failed to trigger credit check on submission:", err);
      }
    }
  }

  /**
   * Called when an application is approved (afterUpdate status → approved)
   * This is where the active debt is created (side effect).
   * @param {{ id: any; purpose: any; requestedAmount: any; proposedDueDate: { toISOString: () => string; }; interestRate: any; debtorId: any; debtorEmail: any; debtorName: any; debtorContact: any; }} application
   */
  async onApprove(application, user = "system", queryRunner = null) {
    logger.info(
      `[LoanApplication] Application #${application.id} approved by ${user}`,
    );

    let dueDate = application.proposedDueDate;
    if (!dueDate) {
      const termMonths = await defaultLoanTermMonths();
      const startDate = new Date(); // or application.approvedAt
      dueDate = new Date(startDate);
      // @ts-ignore
      dueDate.setMonth(dueDate.getMonth() + termMonths);
    }
    // 1. Create active debt using debtService (within same transaction if queryRunner provided)
    const penaltyRate = await defaultPenaltyRate();
    const debtData = {
      name: `Loan: ${application.purpose}`,
      totalAmount: application.requestedAmount,
      paidAmount: 0,
      dueDate: application.proposedDueDate.toISOString().split("T")[0],
      status: "active",
      interestRate: application.interestRate, // already set during approval
      penaltyRate: penaltyRate,
      borrowerId: application.debtorId,
    };
    const createdDebt = await debtService.create(debtData, user, queryRunner);
    logger.info(
      `Created active debt #${createdDebt.id} for application #${application.id}`,
    );

    // 2. In‑app notification to debtor

    // 3. Email/SMS if enabled
    // Send APPROVED email with full details
    const canSendEmail = await emailEnabled();
    if (application.debtorEmail && canSendEmail) {
      const companyName = await require("../utils/system").companyName();
      const termMonths = await defaultLoanTermMonths();
      const interestPeriod = await defaultInterestCalculationPeriod();
      const html = generateApprovedEmail({
        applicantName: application.debtorName,
        companyName: companyName,
        amount: application.requestedAmount,
        purpose: application.purpose,
        dueDate: application.proposedDueDate,
        interestRate: application.interestRate,
        interestPeriod: interestPeriod,
        termMonths: termMonths,
        applicationId: application.id,
        debtId: createdDebt.id,
        agreementLink: `#/loans/${createdDebt.id}/agreement`,
        contactEmail: await require("../utils/system").smtpFromEmail(),
        contactPhone: await require("../utils/system").getSystemSetting(
          "twilio_phone_number",
          "+63 (2) 8123-4567",
        ),
        branchAddress: await require("../utils/system").getSystemSetting(
          "branch_location",
          "Manila, Philippines",
        ),
      });
      await this._sendFormattedEmail(
        application.debtorEmail,
        "🎉 Loan Approved - Congratulations!",
        html,
        user,
        queryRunner,
      );
    }

    const canSendSms = await smsEnabled();
    if (application.debtorContact && canSendSms) {
      await this._sendSms(
        application.debtorContact,
        `Congratulations ${application.debtorName}! Your loan of ₱${application.requestedAmount} has been approved. Due date: ${new Date(application.proposedDueDate).toLocaleDateString()}.`,
        user,
        queryRunner,
      );
    }

    // 4. Generate loan agreement if required
    if (await requireLoanAgreement()) {
      logger.info(
        `Loan agreement should be generated for application #${application.id} using template: ${await loanAgreementTemplate()}`,
      );
      // TODO: actual PDF generation and storage (could call another service)
    }

    if (await requireLoanAgreement()) {
      try {
        const uploadDir = path.join(__dirname, "../uploads/agreements");
        await fs.mkdir(uploadDir, { recursive: true });
        const pdfPath = path.join(
          uploadDir,
          `agreement_${createdDebt.id}_${Date.now()}.pdf`,
        );

        // I-prepare ang data para sa template
        const agreementData = {
          agreementId: `LA-${createdDebt.id}`,
          agreementDate: new Date().toLocaleDateString(),
          lenderName: "Collectly Lending Corp", // o galing sa settings
          borrowerName: application.debtorName,
          borrowerEmail: application.debtorEmail || "",
          borrowerContact: application.debtorContact || "",
          // @ts-ignore
          borrowerAddress: application.debtorAddress || "",
          currency: "₱",
          principalAmount: application.requestedAmount.toFixed(2),
          interestRate: application.interestRate,
          penaltyRate: await defaultPenaltyRate(),
          // @ts-ignore
          dueDate: new Date(application.proposedDueDate).toLocaleDateString(),
          purpose: application.purpose,
          loanStartDate: new Date(createdDebt.createdAt).toLocaleDateString(),
          anniversaryDay: new Date(createdDebt.createdAt).getDate(),
          signatureDate: new Date().toLocaleDateString(),
        };

        await pdfGenerator.generateLoanAgreement(agreementData, pdfPath);

        // I-save ang loan agreement record
        await loanAgreementService.create(
          {
            debtId: createdDebt.id,
            agreementDate: new Date(),
            lenderName: agreementData.lenderName,
            termsText: "Standard loan agreement with monthly interest accrual.",
            fileBuffer: null, // hindi na kailangan, file path na mismo
            fileName: path.basename(pdfPath),
            filePath: pdfPath, // kailangan i-update ang create method para tumanggap ng filePath
          },
          user,
          queryRunner,
        );

        logger.info(`Loan agreement PDF generated: ${pdfPath}`);
      } catch (err) {
        // @ts-ignore
        logger.error("Failed to generate PDF agreement:", err);
        // Hindi na mag-fail ang buong approval dahil lang sa PDF
      }
    }

    // 5. Audit log already recorded by subscriber, but we add an extra log for the created debt
    await auditLogger.logCreate("Debt", createdDebt.id, createdDebt, user);
  }

  /**
   * Called when an application is rejected (afterUpdate status → rejected)
   * @param {{ id: any; debtorEmail: any; debtorName: any; debtorContact: any; }} application
   */
  async onReject(
    application,
    reason = null,
    user = "system",
    queryRunner = null,
  ) {
    logger.info(
      `[LoanApplication] Application #${application.id} rejected by ${user} (reason: ${reason || "none"})`,
    );

    // The service already updated status, rejectionReason and rejectedAt.
    // Here we only send notifications and audit.

    // In‑app notification to debtor

    // Email/SMS
    const canSendEmail = await emailEnabled();
    if (application.debtorEmail && canSendEmail) {
      const companyName = await require("../utils/system").companyName();
      const html = generateRejectedEmail({
        applicantName: application.debtorName,
        companyName: companyName,
        amount: application.requestedAmount,
        purpose: application.purpose,
        applicationId: application.id,
        rejectionReason:
          reason || "Application did not meet our lending criteria.",
        contactEmail: await require("../utils/system").smtpFromEmail(),
        contactPhone: await require("../utils/system").getSystemSetting(
          "twilio_phone_number",
          "+63 (2) 8123-4567",
        ),
        branchAddress: await require("../utils/system").getSystemSetting(
          "branch_location",
          "Manila, Philippines",
        ),
      });
      await this._sendFormattedEmail(
        application.debtorEmail,
        "Loan Application Update",
        html,
        user,
        queryRunner,
      );
    }

    const canSendSms = await smsEnabled();
    if (application.debtorContact && canSendSms) {
      await this._sendSms(
        application.debtorContact,
        `Dear ${application.debtorName}, your loan application has been reviewed. Please check your email for the decision details.`,
        user,
        queryRunner,
      );
    }

    // If application was soft‑deleted as part of rejection, we don't need to delete again.
    // Audit log is already recorded by subscriber after update.
  }

  /**
   * Called when a rejected application is reopened (status back to pending)
   * @param {{ id: any; debtorName: any; }} application
   */
  async onReopen(application, user = "system", queryRunner = null) {
    logger.info(
      `[LoanApplication] Application #${application.id} reopened by ${user}`,
    );

    // The service already reset status, rejectionReason, deletedAt.
    // Here we notify loan officer.

    // No email to debtor needed at this stage.
  }
}

module.exports = { LoanApplicationStateTransitionService };
