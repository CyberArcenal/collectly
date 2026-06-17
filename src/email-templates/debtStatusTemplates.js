// src/email-templates/debtStatusTemplates.js

/**
 * Professional email templates for debt status changes
 * (Admin-only system – debtors have no dashboard access)
 */

const COLORS = {
  primary: '#0e9d7c',
  primaryDark: '#0a7a62',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  border: '#e5e7eb',
  bgLight: '#f8fafc',
  bgCard: '#ffffff',
  footerBg: '#f1f5f9',
};

function baseLayout(content, title, options = {}) {
  return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${COLORS.bgLight};
      color: ${COLORS.text};
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    td { padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card {
      background: ${COLORS.bgCard};
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      border: 1px solid ${COLORS.border};
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 2px solid ${COLORS.border};
      margin-bottom: 24px;
    }
    .header-logo {
      font-size: 28px;
      font-weight: 700;
      color: ${COLORS.primary};
      letter-spacing: -0.5px;
    }
    .header-logo span { color: ${COLORS.text}; }
    .header-sub {
      font-size: 14px;
      color: ${COLORS.textSecondary};
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 12px 0 8px;
    }
    .status-success { background: #d1fae5; color: #065f46; }
    .status-danger { background: #fee2e2; color: #991b1b; }
    .status-warning { background: #fef3c7; color: #92400e; }
    .status-info { background: #dbeafe; color: #1e40af; }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      color: ${COLORS.text};
    }
    .message-body {
      font-size: 15px;
      line-height: 1.7;
      color: ${COLORS.textSecondary};
    }
    .message-body p { margin: 0 0 12px 0; }
    .details-grid {
      display: table;
      width: 100%;
      margin: 20px 0;
      background: ${COLORS.bgLight};
      border-radius: 12px;
      padding: 16px 20px;
      border: 1px solid ${COLORS.border};
    }
    .detail-row { display: table-row; }
    .detail-label {
      display: table-cell;
      font-size: 13px;
      color: ${COLORS.textSecondary};
      padding: 6px 12px 6px 0;
      font-weight: 500;
      white-space: nowrap;
    }
    .detail-value {
      display: table-cell;
      font-size: 14px;
      font-weight: 600;
      color: ${COLORS.text};
      padding: 6px 0;
      text-align: right;
    }
    .divider {
      border: none;
      border-top: 1px solid ${COLORS.border};
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: ${COLORS.primary};
      color: #ffffff;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      margin: 8px 0;
    }
    .cta-button:hover { background-color: ${COLORS.primaryDark}; }
    .footer {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid ${COLORS.border};
      font-size: 13px;
      color: ${COLORS.textLight};
      text-align: center;
      line-height: 1.6;
    }
    .footer a { color: ${COLORS.primary}; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
    .fine-print {
      font-size: 11px;
      color: ${COLORS.textLight};
      margin-top: 12px;
      border-top: 1px solid ${COLORS.border};
      padding-top: 12px;
    }
    @media screen and (max-width: 480px) {
      .container { padding: 12px; }
      .card { padding: 24px 16px; }
      .details-grid { padding: 12px 14px; }
      .detail-label, .detail-value { display: block; text-align: left; padding: 4px 0; }
      .detail-row { display: block; }
      .greeting { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="header-logo">${options.companyName || 'Collectly'} <span>Lending</span></div>
        <div class="header-sub">Debt management · ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      ${content}
      <div class="footer">
        <p>
          ${options.companyName || 'Collectly Lending Corp'} · ${options.branchAddress || 'Manila, Philippines'}<br>
          <a href="mailto:${options.contactEmail || 'support@collectly.ph'}">${options.contactEmail || 'support@collectly.ph'}</a> · 
          ${options.contactPhone || '(02) 8123-4567'}
        </p>
        <p class="fine-print">
          This is an automated message. Please do not reply to this email.<br>
          © ${new Date().getFullYear()} ${options.companyName || 'Collectly Lending Corp'} · All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return `₱${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate email for PAID debt
 */
function generatePaidEmail(data) {
  const content = `
    <div style="text-align: center;">
      <div class="status-badge status-success">✓ Fully Paid</div>
      <div class="greeting">Congratulations, ${data.debtorName}! 🎉</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your debt has been <strong>fully paid</strong>. Thank you for your prompt payment.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Debt ID</span>
        <span class="detail-value">#${data.debtId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Original Amount</span>
        <span class="detail-value">${formatCurrency(data.originalAmount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Total Paid</span>
        <span class="detail-value" style="color: ${COLORS.success};">${formatCurrency(data.totalPaid)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Date</span>
        <span class="detail-value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>What happens next?</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">✓ Your account is now in good standing</li>
        <li style="margin-bottom: 6px;">✓ You may apply for a new loan if needed</li>
        <li style="margin-bottom: 6px;">✓ A receipt has been issued for your records</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
        💡 <strong>Thank you</strong> for your trust and timely payment.
      </p>
    </div>
  `;
  return baseLayout(content, 'Debt Fully Paid', data);
}

/**
 * Generate email for OVERDUE debt
 */
function generateOverdueEmail(data) {
  const content = `
    <div style="text-align: center;">
      <div class="status-badge status-warning">⏰ Overdue</div>
      <div class="greeting">Dear ${data.debtorName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your debt is now <strong>overdue</strong>. Please settle the outstanding balance immediately to avoid further penalties.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Debt ID</span>
        <span class="detail-value">#${data.debtId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Original Amount</span>
        <span class="detail-value">${formatCurrency(data.originalAmount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Remaining Balance</span>
        <span class="detail-value" style="color: ${COLORS.danger};">${formatCurrency(data.remainingBalance)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Due Date</span>
        <span class="detail-value" style="color: ${COLORS.warning};">${data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Days Overdue</span>
        <span class="detail-value">${data.daysOverdue || 0} days</span>
      </div>
    </div>

    ${data.penaltyAmount ? `
    <div style="background: ${COLORS.bgLight}; border-radius: 12px; padding: 12px 16px; border-left: 4px solid ${COLORS.danger}; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: ${COLORS.textSecondary};">
        <strong>Penalty Applied:</strong> ${formatCurrency(data.penaltyAmount)}
      </p>
    </div>
    ` : ''}

    <hr class="divider">

    <div class="message-body">
      <p><strong>What you need to do:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">⚠️ Settle the remaining balance <strong>immediately</strong></li>
        <li style="margin-bottom: 6px;">📞 Contact us if you need assistance or payment arrangements</li>
        <li style="margin-bottom: 6px;">📧 A reminder will be sent weekly until resolved</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.warning};">
        📞 <strong>Need help?</strong> Call us at <a href="tel:${data.contactPhone || '+63 (2) 8123-4567'}" style="color: ${COLORS.primary};">${data.contactPhone || '+63 (2) 8123-4567'}</a>.
      </p>
    </div>
  `;
  return baseLayout(content, 'Debt Overdue', data);
}

/**
 * Generate email for DEFAULTED debt
 */
function generateDefaultedEmail(data) {
  const content = `
    <div style="text-align: center;">
      <div class="status-badge status-danger">✗ Defaulted</div>
      <div class="greeting">Dear ${data.debtorName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your debt has been declared in <strong>default</strong>. This is a serious matter requiring your immediate attention.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Debt ID</span>
        <span class="detail-value">#${data.debtId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Original Amount</span>
        <span class="detail-value">${formatCurrency(data.originalAmount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Remaining Balance</span>
        <span class="detail-value" style="color: ${COLORS.danger};">${formatCurrency(data.remainingBalance)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Due Date</span>
        <span class="detail-value">${data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>Urgent Action Required:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">⚖️ Legal action may be initiated</li>
        <li style="margin-bottom: 6px;">📞 You must contact our collections team immediately</li>
        <li style="margin-bottom: 6px;">⏰ Settlement options may still be available if you act now</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.danger};">
        📞 <strong>Contact us immediately:</strong> <a href="tel:${data.contactPhone || '+63 (2) 8123-4567'}" style="color: ${COLORS.primary};">${data.contactPhone || '+63 (2) 8123-4567'}</a>
      </p>
    </div>
  `;
  return baseLayout(content, 'Debt Defaulted', data);
}

/**
 * Generate email for RESTORED debt (from overdue/defaulted back to active)
 */
function generateRestoredEmail(data) {
  const content = `
    <div style="text-align: center;">
      <div class="status-badge status-info">↺ Restored</div>
      <div class="greeting">Dear ${data.debtorName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your debt has been <strong>restored</strong> to active status. Please resume your payments as scheduled.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Debt ID</span>
        <span class="detail-value">#${data.debtId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Original Amount</span>
        <span class="detail-value">${formatCurrency(data.originalAmount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Remaining Balance</span>
        <span class="detail-value" style="color: ${COLORS.primary};">${formatCurrency(data.remainingBalance)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Due Date</span>
        <span class="detail-value">${data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>Next steps:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">✓ Continue making payments on time</li>
        <li style="margin-bottom: 6px;">📧 Payment reminders will be sent before due date</li>
        <li style="margin-bottom: 6px;">📞 Contact us if you need assistance</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.primary};">
        💡 <strong>Tip:</strong> Set up auto‑payment to avoid future overdue notices.
      </p>
    </div>
  `;
  return baseLayout(content, 'Debt Restored', data);
}

/**
 * Generate email for FORGIVENESS applied
 */
function generateForgivenessEmail(data) {
  const content = `
    <div style="text-align: center;">
      <div class="status-badge status-success">✓ Forgiveness Applied</div>
      <div class="greeting">Dear ${data.debtorName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        A portion of your debt has been <strong>forgiven</strong>. Your remaining balance has been reduced.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Debt ID</span>
        <span class="detail-value">#${data.debtId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Original Amount</span>
        <span class="detail-value">${formatCurrency(data.originalAmount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount Forgiven</span>
        <span class="detail-value" style="color: ${COLORS.success};">${formatCurrency(data.forgivenAmount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">New Balance</span>
        <span class="detail-value" style="color: ${COLORS.primary}; font-size: 18px;">${formatCurrency(data.newBalance)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reason</span>
        <span class="detail-value">${data.reason || 'Debt forgiveness'}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>What happens next?</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">✓ Your remaining balance is now ${formatCurrency(data.newBalance)}</li>
        <li style="margin-bottom: 6px;">✓ Continue with your payment schedule</li>
        <li style="margin-bottom: 6px;">✓ Ensure future payments are made on time to avoid further issues</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.success};">
        📞 <strong>Questions?</strong> Contact us at <a href="mailto:${data.contactEmail || 'support@collectly.ph'}" style="color: ${COLORS.primary};">${data.contactEmail || 'support@collectly.ph'}</a>.
      </p>
    </div>
  `;
  return baseLayout(content, 'Debt Forgiveness Applied', data);
}

module.exports = {
  generatePaidEmail,
  generateOverdueEmail,
  generateDefaultedEmail,
  generateRestoredEmail,
  generateForgivenessEmail,
};