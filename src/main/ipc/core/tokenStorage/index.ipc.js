// src/main/ipc/core/auth/index.ipc.js
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../../middlewares/errorHandler");
const { logger } = require("../../../../utils/logger");
const TokenStorage = require("../../../../utils/tokenStorage");

class AuthHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // Register the main auth handler
    ipcMain.handle(
      "token-storage",
      withErrorHandling(this.handleRequest.bind(this), "IPC:token-storage")
    );
  }

  async handleRequest(event, payload) {
    const { method, params = {} } = payload;
    logger?.info(`TokenStorageHandler: ${method}`, { params });

    try {
      switch (method) {
        // === TOKEN OPERATIONS ===
        case "getTokens":
          return this.getTokens();
        case "setTokens":
          return this.setTokens(params);
        case "clearTokens":
          return this.clearTokens();
        case "getAccessToken":
          return this.getAccessToken();
        case "getRefreshToken":
          return this.getRefreshToken();
        case "updateAccessToken":
          return this.updateAccessToken(params);
        case "getTokenExpiration":
          return this.getTokenExpiration();
        case "isAccessTokenExpired":
          return this.isAccessTokenExpired();

        // === USER OPERATIONS ===
        case "getUser":
          return this.getUser();
        case "setUser":
          return this.setUser(params);

        // === AUTH STATUS ===
        case "isAuthenticated":
          return this.isAuthenticated();

        default:
          return {
            status: false,
            message: `Unknown token storage method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      logger?.error(`TokenStorageHandler error (${method}):`, error);
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // ============================================================
  // TOKEN OPERATIONS
  // ============================================================

  getTokens() {
    const accessToken = TokenStorage.getAccessToken();
    const refreshToken = TokenStorage.getRefreshToken();
    const expiresAt = TokenStorage.getTokenExpiration();
    const user = TokenStorage.getUser();

    return {
      status: true,
      message: "Tokens retrieved successfully",
      data: {
        accessToken,
        refreshToken,
        expiresAt,
        user,
        hasTokens: !!accessToken,
      },
    };
  }

  setTokens({ accessToken, refreshToken, expiresIn, user = null }) {
    if (!accessToken || !refreshToken) {
      return {
        status: false,
        message: "Access token and refresh token are required",
        data: null,
      };
    }

    TokenStorage.setTokens(accessToken, refreshToken, expiresIn);
    if (user) {
      TokenStorage.setUser(user);
    }

    return {
      status: true,
      message: "Tokens saved successfully",
      data: {
        accessToken,
        refreshToken,
        expiresIn,
        hasUser: !!user,
      },
    };
  }

  clearTokens() {
    TokenStorage.clearTokens();
    return {
      status: true,
      message: "Tokens cleared successfully",
      data: null,
    };
  }

  getAccessToken() {
    const token = TokenStorage.getAccessToken();
    return {
      status: true,
      message: token ? "Access token retrieved" : "No access token found",
      data: { token },
    };
  }

  getRefreshToken() {
    const token = TokenStorage.getRefreshToken();
    return {
      status: true,
      message: token ? "Refresh token retrieved" : "No refresh token found",
      data: { token },
    };
  }

  updateAccessToken({ accessToken, expiresIn = null }) {
    if (!accessToken) {
      return {
        status: false,
        message: "Access token is required",
        data: null,
      };
    }

    TokenStorage.updateAccessToken(accessToken, expiresIn);
    return {
      status: true,
      message: "Access token updated successfully",
      data: { accessToken, expiresIn },
    };
  }

  getTokenExpiration() {
    const expiresAt = TokenStorage.getTokenExpiration();
    return {
      status: true,
      message: expiresAt ? "Token expiration retrieved" : "No expiration set",
      data: { expiresAt },
    };
  }

  isAccessTokenExpired() {
    const expired = TokenStorage.isAccessTokenExpired();
    return {
      status: true,
      message: expired ? "Access token is expired" : "Access token is valid",
      data: { expired },
    };
  }

  // ============================================================
  // USER OPERATIONS
  // ============================================================

  getUser() {
    const user = TokenStorage.getUser();
    return {
      status: true,
      message: user ? "User retrieved" : "No user found",
      data: { user },
    };
  }

  setUser({ user }) {
    if (!user) {
      return {
        status: false,
        message: "User data is required",
        data: null,
      };
    }
    TokenStorage.setUser(user);
    return {
      status: true,
      message: "User saved successfully",
      data: { user },
    };
  }

  // ============================================================
  // AUTH STATUS
  // ============================================================

  isAuthenticated() {
    const authenticated = TokenStorage.isAuthenticated();
    const user = TokenStorage.getUser();
    return {
      status: true,
      message: authenticated ? "User is authenticated" : "User is not authenticated",
      data: {
        authenticated,
        user: authenticated ? user : null,
      },
    };
  }
}

// Singleton instance
const tokenStorageHandler = new AuthHandler();
module.exports = { AuthHandler, tokenStorageHandler };