// src/main/ipc/core/notification/search.ipc.js
const notificationService = require("../../../../services/Notification");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { transformPaginatedResult } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { searchTerm, page, limit, type, isRead, debtId } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Use the list endpoint with search param
    const query = { search: searchTerm };
    if (page) query.page = page;
    if (limit) query.page_size = limit;
    if (type) query.type = type;
    if (isRead !== undefined) query.is_read = isRead;
    if (debtId) query.debt_id = debtId;

    const response = await onlineClient.get('/api/v1/notifications/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const options = { search: searchTerm, page, limit, type, isRead, debtId };
    const notifications = await notificationService.findAll(options);
    return {
      status: true,
      message: "Search completed locally",
      data: {
        data: notifications.data,
        pagination: notifications.pagination,
      },
    };
  }
};