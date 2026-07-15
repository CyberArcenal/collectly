// src/main/ipc/borrower/search.ipc.js
const borrowerService = require("../../../../services/Borrower");
const onlineClient = require("../../../../utils/onlineClient");
const { syncMode, serverUrl } = require("../../../../utils/system");
const { transformPaginatedResult } = require("../../../../utils/responseTransformer");

module.exports = async (params) => {
  const { searchTerm, page, limit } = params;
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    // Endpoint: GET /api/v1/borrowers/ with search param
    const query = { search: searchTerm };
    if (page) query.page = page;
    if (limit) query.page_size = limit;
    const response = await onlineClient.get('/api/v1/borrowers/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const options = { search: searchTerm, page, limit };
    const result = await borrowerService.findAll(options);
    return {
      status: true,
      message: "Search completed locally",
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    };
  }
};