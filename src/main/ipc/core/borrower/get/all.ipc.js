// src/main/ipc/borrower/get/all.ipc.js
//@ts-check
const borrowerService = require("../../../../../services/Borrower");
const onlineClient = require("../../../../../utils/onlineClient");
const { transformPaginatedResult } = require("../../../../../utils/responseTransformer");
const { syncMode, serverUrl } = require("../../../../../utils/system");

/**
 * Map frontend params to backend query params for /api/v1/borrowers/
 */
function mapBorrowerParams(params) {
  const mapped = {};
  if (params.page) mapped.page = params.page;
  if (params.limit) mapped.page_size = params.limit;
  if (params.search) mapped.search = params.search;
  if (params.name) mapped.name = params.name;
  if (params.email) mapped.email = params.email;
  if (params.contact) mapped.contact = params.contact;
  if (params.includeDeleted !== undefined) mapped.include_deleted = params.includeDeleted;
  if (params.sortBy) mapped.sort_by = params.sortBy;
  if (params.sortOrder) mapped.sort_order = params.sortOrder;
  return mapped;
}

module.exports = async (params) => {
  const mode = await syncMode();

  if (mode === "online") {
    const url = await serverUrl();
    if (!url) throw new Error("Server URL not configured");
    onlineClient.setBaseUrl(url);

    const query = mapBorrowerParams(params);
    const response = await onlineClient.get('/api/v1/borrowers/', { params: query });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const serverResult = await response.json();
    return transformPaginatedResult(serverResult);
  } else {
    const { page, limit, search, sortBy, sortOrder, includeDeleted, ...filters } = params;
    const options = { page, limit, search, sortBy, sortOrder, includeDeleted, ...filters };
    const borrowers = await borrowerService.findAll(options);
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