// src/main/ipc/paymentMethod/get/default.ipc.js
const paymentMethodService = require("../../../../../services/PaymentMethod");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async () => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // There is no explicit default endpoint in the spec,
    // so we fetch all with limit=1 and filter by is_default
    const response = await onlineClient.get('/api/v1/payment_methods/', {
      params: { page: 1, page_size: 1 }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    // Extract the default method from the response
    const data = extractData(serverResult);
    const defaultMethod = data?.data?.find(m => m.isDefault) || data?.data?.[0] || null;
    return {
      status: true,
      message: "Default payment method retrieved from server",
      data: defaultMethod,
    };
  } else {
    const defaultMethod = await paymentMethodService.getDefaultPaymentMethod();
    return {
      status: true,
      message: "Default payment method retrieved locally",
      data: defaultMethod,
    };
  }
};