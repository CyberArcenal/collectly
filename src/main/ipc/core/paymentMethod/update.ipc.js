// src/main/ipc/paymentMethod/update.ipc.js
const paymentMethodService = require("../../../../services/PaymentMethod");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { extractData } = require("../../../../utils/responseTransformer");

function mapUpdateData(data) {
  const mapped = {};
  if (data.name) mapped.name = data.name;
  if (data.description !== undefined) mapped.description = data.description;
  if (data.icon) mapped.icon = data.icon;
  if (data.isDefault !== undefined) mapped.is_default = data.isDefault;
  return mapped;
}

module.exports = async (params, queryRunner) => {
  const { id, data, user = "system" } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const payload = mapUpdateData(data);
    // Use PATCH for partial update (as per spec)
    const response = await onlineClient.patch(`/api/v1/payment_methods/${id}/`, payload);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Payment method updated on server",
      data: extractData(serverResult),
    };
  } else {
    const result = await paymentMethodService.updatePaymentMethod(id, data, user, queryRunner);
    return {
      status: true,
      message: "Payment method updated locally",
      data: result,
    };
  }
};