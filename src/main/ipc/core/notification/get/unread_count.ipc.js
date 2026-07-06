// src/main/ipc/core/notification/get/unread_count.ipc.js
const notificationService = require("../../../../../services/Notification");
const onlineClient = require("../../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../../utils/system");
const { extractData } = require("../../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { debtId, type, includeDeleted = false } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Note: spec does not list query params for this endpoint,
    // but we send them anyway; backend may ignore if not supported.
    const query = {};
    if (debtId) query.debt_id = debtId;
    if (type) query.type = type;
    if (includeDeleted !== undefined) query.include_deleted = includeDeleted;

    const response = await onlineClient.get('/api/v1/notifications/unread-count/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return {
      status: true,
      message: "Unread count retrieved from server",
      data: extractData(serverResult), // { count }
    };
  } else {
    const count = await notificationService.getUnreadCount({ debtId, type }, includeDeleted);
    return {
      status: true,
      message: "Unread count retrieved locally",
      data: { count },
    };
  }
};