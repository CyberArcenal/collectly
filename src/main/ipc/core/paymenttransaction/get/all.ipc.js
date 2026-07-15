// src/main/ipc/core/paymenttransaction/get/all.ipc.js
const paymentTransactionService = require("../../../../../services/PaymentTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/payments/
 */
function mapPaymentParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.debtId) mapped.debt_id = params.debtId;
  if (params.borrowerId) mapped.borrower_id = params.borrowerId;
  if (params.methodId) mapped.method_id = params.methodId;
  if (params.reference) mapped.reference = params.reference;
  if (params.paymentDateFrom) mapped.payment_date_from = params.paymentDateFrom;
  if (params.paymentDateTo) mapped.payment_date_to = params.paymentDateTo;
  if (params.minAmount) mapped.min_amount = params.minAmount;
  if (params.maxAmount) mapped.max_amount = params.maxAmount;
  if (params.includeDeleted !== undefined) mapped.include_deleted = params.includeDeleted;
  if (params.sortBy) mapped.sort_by = params.sortBy;
  if (params.sortOrder) mapped.sort_order = params.sortOrder;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapPaymentParams(params);
    const response = await onlineClient.get('/api/v1/payments/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const options = { ...params };
    const payments = await paymentTransactionService.findAll(options);
    return {
      status: true,
      message: "Payments retrieved locally",
      data: {
        data: payments.data,
        pagination: payments.pagination,
      },
    };
  }
};