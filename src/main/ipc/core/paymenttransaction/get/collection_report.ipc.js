// src/main/ipc/core/paymenttransaction/get/collection_report.ipc.js
const paymentTransactionService = require("../../../../../services/PaymentTransaction");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

/**
 * Map frontend params to backend query params for /api/v1/payments/collection-report/
 */
function mapCollectionReportParams(params) {
  const mapped = {};
  if (params.fromDate) mapped.from_date = params.fromDate;
  if (params.toDate) mapped.to_date = params.toDate;
  if (params.target !== undefined) mapped.target = params.target;
  return mapped;
}

module.exports = async (params) => {
  const { fromDate, toDate, target } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapCollectionReportParams({ fromDate, toDate, target });
    const response = await onlineClient.get('/api/v1/payments/collection-report/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Collection report generated from server",
      data: extractData(serverResult),
    };
  } else {
    const report = await paymentTransactionService.getCollectionReport(fromDate, toDate, target);
    return {
      status: true,
      message: "Collection report generated locally",
      data: report,
    };
  }
};