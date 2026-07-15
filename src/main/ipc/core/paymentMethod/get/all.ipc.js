// src/main/ipc/paymentMethod/get/all.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/payment_methods/
 */
function mapPaymentMethodParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.includeDeleted !== undefined) mapped.include_deleted = params.includeDeleted;
  return mapped;
}

module.exports = async (params) => {
  const { page = 1, limit = 10, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapPaymentMethodParams({ page, limit, includeDeleted });
    const response = await onlineClient.get('/api/v1/payment_methods/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await paymentMethodService.getAllPaymentMethods(page, limit, includeDeleted);
    return {
      status: true,
      message: "Payment methods retrieved locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};