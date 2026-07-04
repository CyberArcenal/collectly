// src/main/ipc/borrower/get/all.ipc.js
//@ts-check
const borrowerService = require("../../../../../services/Borrower");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformPagination, transformPaginatedResult } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const response = await onlineClient.get('/api/v1/borrowers', { params });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    // Transform server pagination to client format
    return transformPaginatedResult(serverResult);
  } else {
    const { page, limit, search, sortBy, sortOrder, includeDeleted, ...filters } = params;
    const options = { page, limit, search, sortBy, sortOrder, includeDeleted, ...filters };
    const borrowers = await borrowerService.findAll(options);
    // Local service already returns { data, pagination: { page, limit, total, pages } }
    return {
      status: true,
      message: "Borrowers retrieved locally",
      data: {
        data: borrowers.data,
        pagination: borrowers.pagination,
      },
    };
  }
};
