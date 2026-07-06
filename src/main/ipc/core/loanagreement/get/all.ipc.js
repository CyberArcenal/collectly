// src/main/ipc/core/loanagreement/get/all.ipc.js
const loanAgreementService = require("../../../../../services/LoanAgreement");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/loan_agreements/
 */
function mapAgreementParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.sortBy) mapped.sort_by = params.sortBy;
  if (params.sortOrder) mapped.sort_order = params.sortOrder;
  if (params.includeDeleted !== undefined) mapped.include_deleted = params.includeDeleted;
  if (params.debtId) mapped.debt_id = params.debtId;
  if (params.borrowerId) mapped.borrower_id = params.borrowerId;
  if (params.lenderName) mapped.lender_name = params.lenderName;
  if (params.status) mapped.status = params.status;
  if (params.hasFile !== undefined) mapped.has_file = params.hasFile;
  if (params.agreementDateFrom) mapped.agreement_date_from = params.agreementDateFrom;
  if (params.agreementDateTo) mapped.agreement_date_to = params.agreementDateTo;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapAgreementParams(params);
    const response = await onlineClient.get('/api/v1/loan_agreements/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeDeleted,
      debtId,
      borrowerId,
      lenderName,
      agreementDateFrom,
      agreementDateTo,
    } = params;
    const options = {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      includeDeleted,
      debtId,
      borrowerId,
      lenderName,
      agreementDateFrom,
      agreementDateTo,
    };
    const agreements = await loanAgreementService.findAll(options);
    return {
      status: true,
      message: "Loan agreements retrieved locally",
      data: {
        data: agreements.data,
        pagination: agreements.pagination,
      },
    };
  }
};