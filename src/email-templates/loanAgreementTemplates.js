// src/email-templates/loanAgreementTemplates.js

/**
 * Professional email templates for loan agreement status changes
 * (Admin-only system – debtors have no dashboard access)
 */

const COLORS = {
  primary: "#0e9d7c",
  primaryDark: "#0a7a62",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  text: "#1e293b",
  textSecondary: "#64748b",
  textLight: "#94a3b8",
  border: "#e5e7eb",
  bgLight: "#f8fafc",
  bgCard: "#ffffff",
  footerBg: "#f1f5f9",
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
    .badge-draft { background: #fef3c7; color: #92400e; }
    .badge-signed { background: #d1fae5; color: #065f46; }
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
        <div class="header-logo">${options.companyName || "Collectly"} <span>Lending</span></div>
        <div class="header-sub">Loan agreement management · ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</div>
      </div>
      ${content}
      <div class="footer">
        <p>
          ${options.companyName || "Collectly Lending Corp"} · ${options.branchAddress || "Manila, Philippines"}<br>
          <a href="mailto:${options.contactEmail || "support@collectly.ph"}">${options.contactEmail || "support@collectly.ph"}</a> · 
          ${options.contactPhone || "(02) 8123-4567"}
        </p>
        <p class="fine-print">
          This is an automated message. Please do not reply to this email.<br>
          © ${new Date().getFullYear()} ${options.companyName || "Collectly Lending Corp"} · All rights reserved.
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
 * Generate email for DRAFT AGREEMENT CREATED
 */
function generateDraftCreatedEmail(data) {
  const periodLabel =
    data.interestPeriod === "per_month" ? "per month" : "per annum";
  const content = `
    <div style="text-align: center;">
      <div class="status-badge badge-draft">📄 Draft Created</div>
      <div class="greeting">Dear ${data.borrowerName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        A <strong>draft loan agreement</strong> has been created for your debt. Please review the details below.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Agreement ID</span>
        <span class="detail-value">#${data.agreementId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Debt ID</span>
        <span class="detail-value">#${data.debtId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Debt Name</span>
        <span class="detail-value">${data.debtName || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Principal Amount</span>
        <span class="detail-value">${formatCurrency(data.principalAmount)}</span>
      </div>
    <div class="detail-row">
      <span class="detail-label">Interest Rate</span>
      <span class="detail-value">${data.interestRate || 0}% ${periodLabel}</span>
    </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value" style="color: ${COLORS.warning};">Draft – Awaiting Signature</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>Next steps:</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">📄 Please review the agreement terms carefully</li>
        <li style="margin-bottom: 6px;">✍️ The agreement will be sent for signing when ready</li>
        <li style="margin-bottom: 6px;">📞 Contact us if you have questions or concerns</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.warning};">
        💡 <strong>Note:</strong> This is a draft document and is not yet legally binding.
      </p>
    </div>
  `;
  return baseLayout(content, "Draft Loan Agreement Created", data);
}

/**
 * Generate email for AGREEMENT SIGNED
 */
function generateSignedEmail(data) {
  const periodLabel =
    data.interestPeriod === "per_month" ? "per month" : "per annum";
  const content = `
    <div style="text-align: center;">
      <div class="status-badge badge-signed">✓ Signed & Binding</div>
      <div class="greeting">Dear ${data.borrowerName},</div>
      <p class="message-body" style="font-size: 15px; color: ${COLORS.textSecondary}; margin-bottom: 12px;">
        Your loan agreement has been <strong>officially signed</strong>. The document is now legally binding.
      </p>
    </div>

    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Agreement ID</span>
        <span class="detail-value">#${data.agreementId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Debt ID</span>
        <span class="detail-value">#${data.debtId}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Debt Name</span>
        <span class="detail-value">${data.debtName || "N/A"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Principal Amount</span>
        <span class="detail-value">${formatCurrency(data.principalAmount)}</span>
      </div>
        <div class="detail-row">
      <span class="detail-label">Interest Rate</span>
      <span class="detail-value">${data.interestRate || 0}% ${periodLabel}</span>
    </div>
      <div class="detail-row">
        <span class="detail-label">Signed On</span>
        <span class="detail-value">${new Date(data.signedAt || Date.now()).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Signed By</span>
        <span class="detail-value">${data.signedBy || "System Admin"}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="message-body">
      <p><strong>What happens next?</strong></p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
        <li style="margin-bottom: 6px;">✓ The loan agreement is now legally enforceable</li>
        <li style="margin-bottom: 6px;">✓ A copy of the signed agreement is available for your records</li>
        <li style="margin-bottom: 6px;">✓ Your loan payments will follow the agreed schedule</li>
      </ul>
      <p style="margin-top: 12px; font-size: 14px; background: ${COLORS.bgLight}; padding: 12px 16px; border-radius: 8px; border-left: 4px solid ${COLORS.success};">
        📞 <strong>Questions?</strong> Contact us at <a href="mailto:${data.contactEmail || "support@collectly.ph"}" style="color: ${COLORS.primary};">${data.contactEmail || "support@collectly.ph"}</a>.
      </p>
    </div>
  `;
  return baseLayout(content, "Loan Agreement Signed", data);
}

module.exports = {
  generateDraftCreatedEmail,
  generateSignedEmail,
};
