// src/utils/responseTransformer.js

/**
 * Convert a string from snake_case to camelCase
 */
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively transform all object keys from snake_case to camelCase
 * Handles arrays, nested objects, and null/undefined values.
 */
function transformKeysToCamelCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => transformKeysToCamelCase(v));
  }
  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = transformKeysToCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

/**
 * Extract the `data` field from a server response and convert keys to camelCase.
 * Server always returns { status, message, data, ... }
 */
function extractData(serverResponse) {
  const data = serverResponse?.data ?? null;
  return transformKeysToCamelCase(data);
}

/**
 * Transform Django pagination to client pagination format.
 * Server: { current_page, page_size, count, total_pages }
 * Client: { page, limit, total, pages }
 */
function transformPagination(serverPagination) {
  if (!serverPagination) {
    return { page: 1, limit: 10, total: 0, pages: 0 };
  }
  return {
    page: serverPagination.current_page || 1,
    limit: serverPagination.page_size || 10,
    total: serverPagination.count || 0,
    pages: serverPagination.total_pages || 0,
  };
}

/**
 * Transform a paginated server response into client format with camelCase keys.
 * Server: { status, message, pagination: {...}, data: [...] }
 * Client: { status: true, message, data: { data: [...], pagination: { page, limit, total, pages } } }
 */
function transformPaginatedResult(serverResponse) {
  // Transform data array to camelCase
  const data = transformKeysToCamelCase(serverResponse.data || []);
  const pagination = serverResponse.pagination || {};
  
  // Check if server already returns client format
  if (pagination.page !== undefined && pagination.pages !== undefined) {
    return {
      status: true,
      message: serverResponse.message || "Success",
      data: {
        data: data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          pages: pagination.pages,
        },
      },
    };
  }
  
  // Transform from Django format
  const transformed = transformPagination(pagination);
  return {
    status: true,
    message: serverResponse.message || "Success",
    data: {
      data: data,
      pagination: transformed,
    },
  };
}

/**
 * Transform a single-object server response.
 * Just passes through the data with status/message wrapper and camelCase conversion.
 */
function transformSingle(serverResponse) {
  return {
    status: true,
    message: serverResponse.message || "Success",
    data: transformKeysToCamelCase(serverResponse.data ?? null),
  };
}

module.exports = {
  extractData,
  transformPagination,
  transformPaginatedResult,
  transformSingle,
  transformKeysToCamelCase,
};