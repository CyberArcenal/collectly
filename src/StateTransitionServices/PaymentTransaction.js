// src/services/PaymentTransactionStateTransitionService.js
//@ts-check
const PaymentTransaction = require("../entities/PaymentTransaction");
const Debt = require("../entities/Debt");
const { logger } = require("../utils/logger");
const auditLogger = require("../utils/auditLogger");
const notificationService = require("../services/Notification");
const { reminderLogService } = require("../services/ReminderLog");
const {
  emailEnabled,
  smsEnabled,
  getSystemSetting,
  enablePartialPayment,
} = require("../utils/system");
const { generatePaidEmail } = require("../email-templates/debtStatusTemplates");

class PaymentTransactionStateTransitionService {
  /**
   * @param {{ getRepository: (arg0: any) => any; }} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.paymentRepo = dataSource.getRepository(PaymentTransaction);
    this.debtRepo = dataSource.getRepository(Debt);
  }

  /**
   * @param {{ manager: { getRepository: (arg0: any) => any; }; } | null} qr
   * @param {any} entityClass
   */
  _getRepo(qr, entityClass) {
    if (qr) return qr.manager.getRepository(entityClass);
    return this.dataSource.getRepository(entityClass);
  }

  /**
   * Helper: reload debt with borrower relation (transactional)
   * @param {number} debtId
   * @param {import("typeorm").QueryRunner | null} queryRunner
   */
  async _getDebtWithBorrower(debtId, queryRunner) {
    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({
      where: { id: debtId },
      relations: ["borrower"],
    });
    if (!debt) throw new Error(`Debt #${debtId} not found`);
    return debt;
  }

  /**
   * Helper: get common email data from system settings
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
   * Send email via ReminderLogService (queues and logs automatically)
   * @param {string} recipient
   * @param {string} subject
   * @param {string} html
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} queryRunner
   */
  async _sendEmail(recipient, subject, html, user, queryRunner) {
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
      // @ts-ignore
      logger.error(`Failed to queue email to ${recipient}:`, err);
      throw err;
    }
  }

  /**
   * Send SMS (placeholder – implement actual SMS service)
   * @param {string} phoneNumber
   * @param {string} message
   * @param {string} user
   * @param {import("typeorm").QueryRunner | null} queryRunner
   */
  // @ts-ignore
  async _sendSms(phoneNumber, message, user, queryRunner) {
    // Placeholder – actual SMS sending would go through a similar ReminderSmsService
    logger.info(`[SMS] Would send to ${phoneNumber}: ${message}`);
    return true;
  }

  /**
   * @param {{ id: any; amount: number; debt: { id: any; }; }} payment
   */
  async applyPayment(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Applying payment #${payment.id} of ${payment.amount} to debt #${payment.debt?.id}`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    debt.paidAmount = (debt.paidAmount || 0) + payment.amount;
    debt.remainingAmount = debt.remainingAmount - payment.amount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    // @ts-ignore
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount - payment.amount },
      { paidAmount: debt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment #${payment.id} applied. Debt #${debt.id} now has paidAmount=${debt.paidAmount}, remaining=${debt.remainingAmount}`,
    );
  }

  /**
   * @param {{ id: any; amount: number; debt: { id: any; }; }} payment
   */
  async reversePayment(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Reversing payment #${payment.id} of ${payment.amount} from debt #${payment.debt?.id}`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    debt.paidAmount = Math.max(0, (debt.paidAmount || 0) - payment.amount);
    debt.remainingAmount = debt.remainingAmount + payment.amount;
    debt.updatedAt = new Date();

    // @ts-ignore
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount + payment.amount },
      { paidAmount: debt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment #${payment.id} reversed. Debt #${debt.id} now has paidAmount=${debt.paidAmount}, remaining=${debt.remainingAmount}`,
    );
  }

  /**
   * @param {{ id: any; debt: { id: any; }; }} payment
   * @param {number} oldAmount
   * @param {number} newAmount
   */
  async updatePaymentAmount(
    payment,
    oldAmount,
    newAmount,
    user = "system",
    queryRunner = null,
  ) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    if (oldAmount === newAmount) return;
    const diff = newAmount - oldAmount;
    logger.info(
      `[Transition] Updating payment #${payment.id} amount from ${oldAmount} to ${newAmount} (diff=${diff})`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    debt.paidAmount = (debt.paidAmount || 0) + diff;
    debt.remainingAmount = debt.remainingAmount - diff;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    // @ts-ignore
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount - diff },
      { paidAmount: debt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment amount updated. Debt #${debt.id} now has paidAmount=${debt.paidAmount}, remaining=${debt.remainingAmount}`,
    );
  }

  /**
   * @param {{ id: any; amount: number; }} payment
   * @param {any} oldDebtId
   * @param {any} newDebtId
   */
  async transferPayment(
    payment,
    oldDebtId,
    newDebtId,
    user = "system",
    queryRunner = null,
  ) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Transferring payment #${payment.id} from debt ${oldDebtId} to ${newDebtId}`,
    );

    const debtRepo = this._getRepo(queryRunner, Debt);
    const oldDebt = await debtRepo.findOne({ where: { id: oldDebtId } });
    const newDebt = await debtRepo.findOne({ where: { id: newDebtId } });
    if (!oldDebt || !newDebt) throw new Error("Old or new debt not found");

    oldDebt.paidAmount = Math.max(0, oldDebt.paidAmount - payment.amount);
    oldDebt.remainingAmount = oldDebt.totalAmount - oldDebt.paidAmount;
    if (oldDebt.remainingAmount < 0) oldDebt.remainingAmount = 0;
    oldDebt.updatedAt = new Date();
    // @ts-ignore
    await updateDb(debtRepo, oldDebt, { queryRunner, skipSignal: true });

    newDebt.paidAmount = (newDebt.paidAmount || 0) + payment.amount;
    newDebt.remainingAmount = newDebt.totalAmount - newDebt.paidAmount;
    if (newDebt.remainingAmount < 0) newDebt.remainingAmount = 0;
    newDebt.updatedAt = new Date();
    // @ts-ignore
    await updateDb(debtRepo, newDebt, { queryRunner, skipSignal: true });

    await auditLogger.logUpdate(
      "Debt",
      oldDebt.id,
      { paidAmount: oldDebt.paidAmount + payment.amount },
      { paidAmount: oldDebt.paidAmount },
      user,
    );
    await auditLogger.logUpdate(
      "Debt",
      newDebt.id,
      { paidAmount: newDebt.paidAmount - payment.amount },
      { paidAmount: newDebt.paidAmount },
      user,
    );
    logger.info(
      `[Transition] Payment transferred. Old debt #${oldDebtId} paidAmount=${oldDebt.paidAmount}, new debt #${newDebtId} paidAmount=${newDebt.paidAmount}`,
    );
  }

  /**
   * @param {{ id: any; voided: boolean; updatedAt: Date; debt: { id: any; }; amount: any; }} payment
   */
  async onVoid(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Voiding payment #${payment.id} by ${user}`);

    await this.reversePayment(payment, user, queryRunner);

    const paymentRepo = this._getRepo(queryRunner, PaymentTransaction);
    payment.voided = true;
    payment.updatedAt = new Date();
    // @ts-ignore
    await updateDb(paymentRepo, payment, { queryRunner, skipSignal: true });

    const debtWithBorrower = await this._getDebtWithBorrower(
      payment.debt.id,
      queryRunner,
    );
    if (debtWithBorrower.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Payment Voided",
          message: `Your payment of ${payment.amount} for debt "${debtWithBorrower.name}" has been voided.`,
          type: "info",
          metadata: { paymentId: payment.id, debtId: payment.debt.id },
        },
        user,
        queryRunner,
      );
    }

    await auditLogger.logUpdate(
      "PaymentTransaction",
      payment.id,
      { status: "active" },
      { status: "voided" },
      user,
    );
  }

  /**
   * @param {{ id: any; debt: { id: any; }; amount: any; }} payment
   * @param {number} refundAmount
   */
  async onRefund(payment, refundAmount, user = "system", queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(
      `[Transition] Refunding ${refundAmount} from payment #${payment.id} by ${user}`,
    );

    const paymentRepo = this._getRepo(queryRunner, PaymentTransaction);
    const debtRepo = this._getRepo(queryRunner, Debt);
    const debt = await debtRepo.findOne({ where: { id: payment.debt.id } });
    if (!debt) throw new Error("Payment has no associated debt");

    const refund = paymentRepo.create({
      amount: -refundAmount,
      paymentDate: new Date(),
      reference: `Refund for #${payment.id}`,
      notes: `Refund processed by ${user}`,
      debt: debt,
    });
    // @ts-ignore
    await saveDb(paymentRepo, refund, { queryRunner, skipSignal: true });

    debt.paidAmount = Math.max(0, debt.paidAmount - refundAmount);
    debt.remainingAmount = debt.totalAmount - debt.paidAmount;
    if (debt.remainingAmount < 0) debt.remainingAmount = 0;
    debt.updatedAt = new Date();
    // @ts-ignore
    await updateDb(debtRepo, debt, { queryRunner, skipSignal: true });

    const debtWithBorrower = await this._getDebtWithBorrower(
      debt.id,
      queryRunner,
    );
    if (debtWithBorrower.borrower) {
      await notificationService.create(
        {
          userId: 1,
          title: "Payment Refunded",
          message: `A refund of ${refundAmount} has been issued for your payment of ${payment.amount} on debt "${debtWithBorrower.name}".`,
          type: "info",
          metadata: { paymentId: payment.id, refundAmount },
        },
        user,
        queryRunner,
      );
    }

    await auditLogger.logCreate("PaymentTransaction", refund.id, refund, user);
    await auditLogger.logUpdate(
      "Debt",
      debt.id,
      { paidAmount: debt.paidAmount + refundAmount },
      { paidAmount: debt.paidAmount },
      user,
    );
  }

  /**
   * @param {{ id: any; debt: { id: any; }; amount: number; confirmed: boolean; updatedAt: Date; }} payment
   */
  async onConfirm(payment, user = "system", queryRunner = null) {
    const { updateDb } = require("../utils/dbUtils/dbActions");
    logger.info(`[Transition] Confirming payment #${payment.id} by ${user}`);

    // 1. Apply payment (update debt paidAmount, remainingAmount)
    await this.applyPayment(payment, user, queryRunner);

    // 2. Reload debt to get updated remainingAmount (with borrower for later)
    const debtWithBorrower = await this._getDebtWithBorrower(
      payment.debt.id,
      queryRunner,
    );

    const allowPartial = await enablePartialPayment();
    const remainingAfter = debtWithBorrower.remainingAmount - payment.amount;
    if (!allowPartial && remainingAfter > 0.01) {
      throw new Error(
        "Partial payments are disabled. You can only pay the full remaining amount.",
      );
    }

    // 3. If debt is fully paid, mark status as 'paid'
    if (
      debtWithBorrower.remainingAmount <= 0 &&
      debtWithBorrower.status !== "paid"
    ) {
      const debtRepo = this._getRepo(queryRunner, Debt);
      debtWithBorrower.status = "paid";
      debtWithBorrower.updatedAt = new Date();
      await updateDb(debtRepo, debtWithBorrower, {
        // @ts-ignore
        queryRunner,
        skipSignal: false,
      });
      logger.info(
        `[Transition] Debt #${debtWithBorrower.id} fully paid, status updated to 'paid'`,
      );
    }

    // 4. Update payment record: mark as confirmed
    const paymentRepo = this._getRepo(queryRunner, PaymentTransaction);
    payment.confirmed = true;
    payment.updatedAt = new Date();
    // @ts-ignore
    await updateDb(paymentRepo, payment, { queryRunner, skipSignal: true });

    // 5. Receipt printing (non-critical, use setTimeout)
    try {
      const printerService = require("../services/Printer");
      setTimeout(async () => {
        try {
          await printerService.printReceipt(debtWithBorrower.id, queryRunner);
        } catch (err) {
          logger.warn(
            `Failed to print receipt for debt #${debtWithBorrower.id}:`,
            // @ts-ignore
            err,
          );
        }
      }, 0);
    } catch (err) {
      // @ts-ignore
      logger.warn(`Failed to schedule receipt printing:`, err);
    }

    // 6. In-app notification (for admin)
    await notificationService.create(
      {
        userId: 1,
        title: "Payment Confirmed",
        message: `Payment of ${payment.amount} for debt "${debtWithBorrower.name}" has been confirmed.`,
        type: "payment_confirmation",
        metadata: { paymentId: payment.id, debtId: payment.debt.id },
      },
      user,
      queryRunner,
    );

    // ================================================================
    // 🆕 7. Send Email to Debtor
    // ================================================================
    const canSendEmail = await emailEnabled();
    const canSendSms = await smsEnabled();

    // Format payment amount for email
    const formattedAmount = payment.amount.toFixed(2);
    const formattedRemaining = debtWithBorrower.remainingAmount.toFixed(2);
    // @ts-ignore
    const formattedTotal = debtWithBorrower.totalAmount.toFixed(2);

    // Send email if enabled and debtor has email
    if (canSendEmail && debtWithBorrower.borrower?.email) {
      try {
        const emailData = await this._getEmailData();

        const html = generatePaidEmail({
          debtorName: debtWithBorrower.borrower.name,
          debtId: debtWithBorrower.id,
          originalAmount: debtWithBorrower.totalAmount,
          totalPaid: payment.amount,
          remainingBalance: debtWithBorrower.remainingAmount,
          // @ts-ignore
          paymentDate: payment.paymentDate || new Date(),
          ...emailData,
        });

        await this._sendEmail(
          debtWithBorrower.borrower.email,
          "✅ Payment Confirmed – Thank You!",
          html,
          user,
          queryRunner,
        );
        logger.info(
          `[Transition] Payment confirmation email sent to ${debtWithBorrower.borrower.email}`,
        );
      } catch (err) {
        logger.error(
          `[Transition] Failed to send payment confirmation email:`,
          // @ts-ignore
          err,
        );
      }
    } else {
      logger.info(
        `[Transition] Email not sent. emailEnabled=${canSendEmail}, hasEmail=${!!debtWithBorrower.borrower?.email}`,
      );
    }

    // Send SMS if enabled and debtor has contact number
    if (canSendSms && debtWithBorrower.borrower?.contact) {
      try {
        await this._sendSms(
          debtWithBorrower.borrower.contact,
          `Dear ${debtWithBorrower.borrower.name}, your payment of ₱${formattedAmount} for debt "${debtWithBorrower.name}" has been confirmed. Remaining balance: ₱${formattedRemaining}. Thank you!`,
          user,
          queryRunner,
        );
        logger.info(
          `[Transition] Payment confirmation SMS sent to ${debtWithBorrower.borrower.contact}`,
        );
      } catch (err) {
        logger.error(
          `[Transition] Failed to send payment confirmation SMS:`,
          // @ts-ignore
          err,
        );
      }
    } else {
      logger.info(
        `[Transition] SMS not sent. smsEnabled=${canSendSms}, hasContact=${!!debtWithBorrower.borrower?.contact}`,
      );
    }

    // 8. Audit log
    await auditLogger.logUpdate(
      "PaymentTransaction",
      payment.id,
      { confirmed: false },
      { confirmed: true },
      user,
    );
  }
}

module.exports = { PaymentTransactionStateTransitionService };
