// src/main/ipc/paymentMethod/create.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

/**
 * Map frontend create data to backend format
 */
function mapCreateData(data) {
  const mapped = {};
  if (data.name) mapped.name = data.name;
  if (data.description !== undefined) mapped.description = data.description;
  if (data.icon) mapped.icon = data.icon;
  if (data.isDefault !== undefined) mapped.is_default = data.isDefault;
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = mapCreateData(data);
    const response = await onlineClient.post('/api/v1/payment_methods/', payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment method created on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await paymentMethodService.createPaymentMethod(data, user, queryRunner);
    return {
      status: true,
      message: "Payment method created locally",
      data: result,
    };
  }
};