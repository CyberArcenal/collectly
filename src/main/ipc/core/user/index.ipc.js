// src/main/ipc/core/user/index.ipc.js
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");

class UserHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // Map method names to their corresponding HTTP method and endpoint
    this.handlers = {
      // READ
      getAllUsers: {
        method: "GET",
        endpoint: "/api/v1/users",
        transform: (result) => result, // forward as-is
      },
      getUserById: {
        method: "GET",
        endpoint: (params) => `/api/v1/users/${params.id}`,
        transform: (result) => result,
      },
      // WRITE
      createUser: {
        method: "POST",
        endpoint: "/api/v1/users",
        transform: (result) => result,
      },
      updateUser: {
        method: "PUT",
        endpoint: (params) => `/api/v1/users/${params.id}`,
        transform: (result) => result,
      },
      deleteUser: {
        method: "DELETE",
        endpoint: (params) => `/api/v1/users/${params.id}`,
        transform: (result) => result,
      },
      changePassword: {
        method: "POST",
        endpoint: "/api/v1/users/change-password",
        transform: (result) => result,
      },
    };
  }

  /**
   * Main entry point for IPC
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {Object} payload
   * @param {string} payload.method
   * @param {Object} [payload.params]
   */
  async handleRequest(event, payload) {
    const { method, params = {} } = payload;
    logger?.info(`UserHandler: ${method}`, { params });

    const handler = this.handlers[method];
    if (!handler) {
      throw new Error(`Unknown user method: ${method}`);
    }

    // Get server URL
    const url = await serverUrl();
    if (!url) {
      throw new Error("Server URL not configured. Please set server URL in settings.");
    }
    onlineClient.setBaseUrl(url);

    // Build endpoint
    let endpoint = handler.endpoint;
    if (typeof endpoint === "function") {
      endpoint = endpoint(params);
    }

    // Prepare request body (for POST/PUT)
    let body = null;
    if (handler.method === "POST" || handler.method === "PUT") {
      // For POST/PUT, send params as body
      body = params.data || params;
    }

    // Make request
    const response = await onlineClient.request(handler.method, endpoint, body);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    // Transform if needed (passthrough by default)
    const transformed = handler.transform(result);

    // Return the server response directly (already has { status, message, data })
    return transformed;
  }
}

// Instantiate handler
const userHandler = new UserHandler();

// Register IPC handler
ipcMain.handle(
  "user",
  withErrorHandling(userHandler.handleRequest.bind(userHandler), "IPC:user")
);

module.exports = { UserHandler, userHandler };