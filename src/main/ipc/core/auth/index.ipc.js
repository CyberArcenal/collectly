// src/main/ipc/core/auth/index.ipc.js
const { ipcMain } = require("electron");
const { logger } = require("../../../../utils/logger");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const onlineClient = require("../../../../utils/onlineClient");
const { serverUrl } = require("../../../../utils/system");
const TokenStorage = require("../../../../utils/tokenStorage");

class AuthHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.handlers = {
      // ========== AUTHENTICATION ==========
      login: {
        method: "POST",
        endpoint: "/login/",
        transform: (result) => {
          // Store tokens in electron-store on successful login
          if (result.status && result.accessToken && result.refreshToken) {
            TokenStorage.setTokens(
              result.accessToken,
              result.refreshToken,
              result.expiresIn,
            );
            if (result.user) {
              TokenStorage.setUser(result.user);
            }
          }
          return result;
        },
      },
      logout: {
        method: "POST",
        endpoint: "/logout/",
        transform: (result) => {
          // Always clear tokens on logout
          TokenStorage.clearTokens();
          return result;
        },
      },
      logoutAll: {
        method: "POST",
        endpoint: "/logout/all",
        transform: (result) => {
          TokenStorage.clearTokens();
          return result;
        },
      },
      refreshToken: {
        method: "POST",
        endpoint: "/refresh/",
        transform: (result) => {
          // Update tokens on refresh
          if (result.status && result.data) {
            const { access, refresh } = result.data;
            if (access) {
              TokenStorage.updateAccessToken(access);
            }
            if (refresh) {
              TokenStorage.setRefreshToken(refresh);
            }
          }
          return result;
        },
      },
      verify2FA: {
        method: "POST",
        endpoint: "/login/verify-2fa/",
        transform: (result) => {
          if (result.status && result.accessToken && result.refreshToken) {
            TokenStorage.setTokens(
              result.accessToken,
              result.refreshToken,
              result.expiresIn,
            );
            if (result.user) {
              TokenStorage.setUser(result.user);
            }
          }
          return result;
        },
      },
      // ========== USER MANAGEMENT ==========
      getUsers: {
        method: "GET",
        endpoint: "/api/v1/users",
        transform: (result) => result,
      },
      getUserById: {
        method: "GET",
        endpoint: (params) => `/api/v1/users/${params.id}`,
        transform: (result) => result,
      },
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

      // ========== SECURITY SETTINGS ==========
      getSecuritySettings: {
        method: "GET",
        endpoint: "/api/v1/users/security/settings",
        transform: (result) => result,
      },
      updateSecuritySettings: {
        method: "PATCH",
        endpoint: "/api/v1/users/security/settings",
        transform: (result) => result,
      },
      enable2FA: {
        method: "POST",
        endpoint: "/api/v1/users/security/settings/enable-2fa",
        transform: (result) => result,
      },
      disable2FA: {
        method: "POST",
        endpoint: "/api/v1/users/security/settings/disable-2fa",
        transform: (result) => result,
      },
      getSecurityConfig: {
        method: "GET",
        endpoint: "/api/v1/users/security/settings/config",
        transform: (result) => result,
      },
      getSecurityHealth: {
        method: "GET",
        endpoint: "/api/v1/users/security/settings/health",
        transform: (result) => result,
      },
      getSecurityStats: {
        method: "GET",
        endpoint: "/api/v1/users/security/settings/stats",
        transform: (result) => result,
      },
      testSecurityAlerts: {
        method: "POST",
        endpoint: "/api/v1/users/security/settings/test-alerts",
        transform: (result) => result,
      },

      // ========== SECURITY LOGS ==========
      getSecurityLogs: {
        method: "GET",
        endpoint: "/api/v1/users/security/logs",
        transform: (result) => result,
      },
      getSecurityLogById: {
        method: "GET",
        endpoint: (params) => `/api/v1/users/security/logs/${params.id}`,
        transform: (result) => result,
      },

      // ========== SESSIONS ==========
      getSessions: {
        method: "GET",
        endpoint: "/api/v1/users/security/settings/sessions",
        transform: (result) => result,
      },
      terminateSession: {
        method: "DELETE",
        endpoint: (params) =>
          `/api/v1/users/security/settings/sessions/${params.session_id}`,
        transform: (result) => result,
      },
      terminateAllSessions: {
        method: "DELETE",
        endpoint: "/api/v1/users/security/settings/sessions/terminate-all",
        transform: (result) => result,
      },

      // ========== OTP ==========
      sendEmailOTP: {
        method: "POST",
        endpoint: "/api/v1/users/security/send-email-otp",
        transform: (result) => result,
      },
      verifyEmailOTP: {
        method: "POST",
        endpoint: "/api/v1/users/security/verify-email-otp",
        transform: (result) => result,
      },
      sendPhoneOTP: {
        method: "POST",
        endpoint: "/api/v1/users/security/send-phone-otp",
        transform: (result) => result,
      },
      verifyPhoneOTP: {
        method: "POST",
        endpoint: "/api/v1/users/security/verify-phone-otp",
        transform: (result) => result,
      },
      verifyRecoveryEmail: {
        method: "POST",
        endpoint: "/api/v1/users/security/settings/verify-recovery-email",
        transform: (result) => result,
      },
      verifyRecoveryPhone: {
        method: "POST",
        endpoint: "/api/v1/users/security/settings/verify-recovery-phone",
        transform: (result) => result,
      },
      getCurrentUser: {
        method: "LOCAL", // No HTTP call needed
        endpoint: null,
        transform: () => {
          const store = new Store({ name: "auth" });
          const user = store.get("user", null);
          return {
            status: true,
            message: user ? "User retrieved from store" : "No user found",
            data: user ? JSON.parse(user) : null,
          };
        },
      },
    };
  }

  async handleRequest(event, payload) {
    const { method, params = {} } = payload;
    logger?.info(`AuthHandler: ${method}`, { params });

    const handler = this.handlers[method];
    if (!handler) {
      throw new Error(`Unknown auth method: ${method}`);
    }

    // Handle local-only methods (no server call)
    if (handler.method === "LOCAL" || !handler.endpoint) {
      const result = handler.transform();
      return result;
    }

    const url = await serverUrl();
    if (!url) {
      throw new Error(
        "Server URL not configured. Please set server URL in settings.",
      );
    }
    onlineClient.setBaseUrl(url);

    let endpoint = handler.endpoint;
    if (typeof endpoint === "function") {
      endpoint = endpoint(params);
    }

    let body = null;
    if (
      handler.method === "POST" ||
      handler.method === "PUT" ||
      handler.method === "PATCH"
    ) {
      body = params.data || params;
    }

    let queryParams = null;
    if (handler.method === "GET") {
      const { id, session_id, ...query } = params;
      queryParams = query;
    }

    let response;
    if (handler.method === "GET") {
      response = await onlineClient.get(endpoint, { params: queryParams });
    } else {
      response = await onlineClient.request(handler.method, endpoint, body);
    }

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const transformed = handler.transform(result);
    return transformed;
  }
}

const authHandler = new AuthHandler();

ipcMain.handle(
  "auth",
  withErrorHandling(authHandler.handleRequest.bind(authHandler), "IPC:auth"),
);

module.exports = { AuthHandler, authHandler };
