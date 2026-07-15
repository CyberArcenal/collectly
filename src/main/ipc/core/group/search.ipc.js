// src/main/ipc/group/search.ipc.js
const groupService = require("../../../../services/Group");
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

    // Endpoint: GET /api/v1/groups/ with search param
    const query = { search: searchTerm };
    if (page) query.page = page;
    if (limit) query.page_size = limit;
    const response = await onlineClient.get('/api/v1/groups/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const result = await groupService.searchGroups(searchTerm, page, limit);
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