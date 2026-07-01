// src/utils/tokenStorage.js
const Store = require('electron-store');

// Use the same store name as onlineClient for consistency
const store = new Store({ name: 'auth' });

// Storage keys
const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  EXPIRES_AT: 'expires_at',
};

class TokenStorage {
  /**
   * Set both access and refresh tokens
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {number} expiresIn - Expiration time in seconds (optional)
   */
  static setTokens(accessToken, refreshToken, expiresIn = null) {
    store.set(KEYS.ACCESS_TOKEN, accessToken);
    store.set(KEYS.REFRESH_TOKEN, refreshToken);
    if (expiresIn) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      store.set(KEYS.EXPIRES_AT, expiresAt.toISOString());
    }
  }

  /**
   * Get access token
   * @returns {string|null}
   */
  static getAccessToken() {
    return store.get(KEYS.ACCESS_TOKEN, null);
  }

  /**
   * Get refresh token
   * @returns {string|null}
   */
  static getRefreshToken() {
    return store.get(KEYS.REFRESH_TOKEN, null);
  }

  /**
   * Check if access token is expired
   * @returns {boolean}
   */
  static isAccessTokenExpired() {
    const expiresAt = store.get(KEYS.EXPIRES_AT, null);
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  }

  /**
   * Get token expiration
   * @returns {string|null} ISO date string
   */
  static getTokenExpiration() {
    return store.get(KEYS.EXPIRES_AT, null);
  }

  /**
   * Set user data
   * @param {Object} user - User object
   */
  static setUser(user) {
    store.set(KEYS.USER, JSON.stringify(user));
  }

  /**
   * Get user data
   * @returns {Object|null}
   */
  static getUser() {
    const user = store.get(KEYS.USER, null);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Check if user is authenticated (has valid tokens)
   * @returns {boolean}
   */
  static isAuthenticated() {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;
    return !this.isAccessTokenExpired();
  }

  /**
   * Clear all tokens and user data
   */
  static clearTokens() {
    store.delete(KEYS.ACCESS_TOKEN);
    store.delete(KEYS.REFRESH_TOKEN);
    store.delete(KEYS.USER);
    store.delete(KEYS.EXPIRES_AT);
  }

  /**
   * Update only the access token (for refresh)
   * @param {string} accessToken - New access token
   * @param {number} expiresIn - Expiration time in seconds (optional)
   */
  static updateAccessToken(accessToken, expiresIn = null) {
    store.set(KEYS.ACCESS_TOKEN, accessToken);
    if (expiresIn) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      store.set(KEYS.EXPIRES_AT, expiresAt.toISOString());
    }
  }

  /**
   * Alias for backward compatibility with onlineClient
   */
  static getToken() {
    return this.getAccessToken();
  }

  /**
   * Alias for backward compatibility with onlineClient
   */
  static setToken(token) {
    store.set(KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Alias for backward compatibility with onlineClient
   */
  static clearToken() {
    store.delete(KEYS.ACCESS_TOKEN);
    store.delete(KEYS.REFRESH_TOKEN);
  }
}

module.exports = TokenStorage;