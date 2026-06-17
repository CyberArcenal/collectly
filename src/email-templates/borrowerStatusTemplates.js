// src/email-templates/borrowerStatusTemplates.js

/**
 * Professional email templates for borrower status changes
 * (Admin-only system – debtors have no dashboard access)
 */

const COLORS = {
  primary: '#0e9d7c',
  primaryDark: '#0a7a62',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
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
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-warning { background: #fef3c7; color: #92400e; }
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
        <div class="header-sub">Borrower management · ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
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
 * Generate email for BORROWER ACTIVATION
 */
function generateActivatedEmail(data) {
  const content = `
    <div style="text-align: center;">
      <div class="status-badge badge-success">✓ Account Reactivated</div>
      <div class="greeting">Welcome back, ${data.borrowerName}! 🙌</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your account has been <strong>reactivated</strong>. You may now apply for new loans and access your account.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Borrower ID</span>
        <span class="detail-value">#${data.borrowerId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Name</span>
        <span class="detail-value">${data.borrowerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${data.borrowerEmail || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Contact</span>
        <span class="detail-value">${data.borrowerContact || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reactivated On</span>
        <span class="detail-value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>What you can do now:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">✓ Apply for a new loan</li>
        <li style="margin-bottom: 6px;">✓ View your account status</li>
        <li style="margin-bottom: 6px;">✓ Update your contact information</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.success};">
        💡 <strong>Tip:</strong> Keep your contact details up‑to‑date to receive important notifications.
      </p>
    </div>
  `;
  return baseLayout(content, 'Account Reactivated', data);
}

/**
 * Generate email for BORROWER DEACTIVATION
 */
function generateDeactivatedEmail(data) {
  const content = `
    <div style="text-align: center;">
      <div class="status-badge badge-danger">✗ Account Deactivated</div>
      <div class="greeting">Dear ${data.borrowerName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your account has been <strong>deactivated</strong>. All active debts have been marked as <strong>defaulted</strong>.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Borrower ID</span>
        <span class="detail-value">#${data.borrowerId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Name</span>
        <span class="detail-value">${data.borrowerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${data.borrowerEmail || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Contact</span>
        <span class="detail-value">${data.borrowerContact || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Active Debts Affected</span>
        <span class="detail-value" style="color: ${COLORS.danger};">${data.activeDebtCount || 0}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>Important Information:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">⚠️ All active debts have been set to defaulted status</li>
        <li style="margin-bottom: 6px;">⚖️ Legal action may be initiated for outstanding balances</li>
        <li style="margin-bottom: 6px;">📞 Contact us immediately to resolve this matter</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.danger};">
        📞 <strong>Urgent:</strong> Call us at <a href="tel:${data.contactPhone || '+63 (2) 8123-4567'}" style="color: ${COLORS.primary};">${data.contactPhone || '+63 (2) 8123-4567'}</a> to discuss your account.
      </p>
    </div>
  `;
  return baseLayout(content, 'Account Deactivated', data);
}

/**
 * Generate email for BORROWER MERGE
 */
function generateMergedEmail(data) {
  // For the source borrower (the one being merged in)
  const sourceContent = `
    <div style="text-align: center;">
      <div class="status-badge badge-info">↔ Account Merged</div>
      <div class="greeting">Dear ${data.sourceBorrowerName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your account has been <strong>merged</strong> into <strong>${data.targetBorrowerName}</strong>. You will no longer have access to this account.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Source Account ID</span>
        <span class="detail-value">#${data.sourceBorrowerId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Target Account ID</span>
        <span class="detail-value">#${data.targetBorrowerId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Target Name</span>
        <span class="detail-value">${data.targetBorrowerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Debts Transferred</span>
        <span class="detail-value">${data.debtsTransferred || 0}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Merge Date</span>
        <span class="detail-value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>Next steps:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">✓ Use <strong>${data.targetBorrowerName}</strong> for all future transactions</li>
        <li style="margin-bottom: 6px;">✓ All your debts and payment history have been transferred</li>
        <li style="margin-bottom: 6px;">📞 Contact us if you have questions about the merge</li>
      </ul>
    </div>
  `;

  // For the target borrower (the one receiving the merged data)
  const targetContent = `
    <div style="text-align: center;">
      <div class="status-badge badge-info">↔ Account Merge Completed</div>
      <div class="greeting">Dear ${data.targetBorrowerName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        <strong>${data.sourceBorrowerName}</strong> has been merged into your account. All their debts and transactions are now under your name.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Your Account ID</span>
        <span class="detail-value">#${data.targetBorrowerId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Merged From</span>
        <span class="detail-value">${data.sourceBorrowerName} (ID: #${data.sourceBorrowerId})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Additional Debts Added</span>
        <span class="detail-value">${data.debtsTransferred || 0}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Merge Date</span>
        <span class="detail-value">${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>What you need to know:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">✓ All debts from ${data.sourceBorrowerName} are now your responsibility</li>
        <li style="margin-bottom: 6px;">✓ Make sure to review your updated debt list</li>
        <li style="margin-bottom: 6px;">📞 Contact us for any clarification</li>
      </ul>
    </div>
  `;

  // We'll generate two separate emails, so we'll return an object with both.
  return {
    source: baseLayout(sourceContent, 'Account Merge – Your Account Merged', data),
    target: baseLayout(targetContent, 'Account Merge – New Debts Added', data),
  };
}

module.exports = {
  generateActivatedEmail,
  generateDeactivatedEmail,
  generateMergedEmail,
};