// src/utils/tokenStorage.js
const Store = require('electron-store').default;
const { logger } = require('./logger'); // if you have a logger, otherwise replace with console

// Use a fixed store name – make sure it matches everywhere else (e.g., 'auth')
const store = new Store({ name: 'auth' });

// Log the store file path to verify where data is saved
logger.debug(`[TokenStorage] Store file path: ${store.path}`);

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  EXPIRES_AT: 'expires_at',
};

class TokenStorage {
  static setTokens(accessToken, refreshToken, expiresIn = null) {
    logger.debug('[TokenStorage] setTokens called');
    store.set(KEYS.ACCESS_TOKEN, accessToken);
    store.set(KEYS.REFRESH_TOKEN, refreshToken);
    if (expiresIn) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      store.set(KEYS.EXPIRES_AT, expiresAt.toISOString());
    }
    logger.debug('[TokenStorage] Tokens saved. Access token present:', !!accessToken);
  }

  static getAccessToken() {
    const token = store.get(KEYS.ACCESS_TOKEN, null);
    logger.debug(`[TokenStorage] getAccessToken: ${token ? 'present' : 'null'}`);
    return token;
  }

  static getRefreshToken() {
    const token = store.get(KEYS.REFRESH_TOKEN, null);
    logger.debug(`[TokenStorage] getRefreshToken: ${token ? 'present' : 'null'}`);
    return token;
  }

  static isAccessTokenExpired() {
    const expiresAt = store.get(KEYS.EXPIRES_AT, null);
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  }

  static getTokenExpiration() {
    return store.get(KEYS.EXPIRES_AT, null);
  }

  static setUser(user) {
    store.set(KEYS.USER, JSON.stringify(user));
  }

  static getUser() {
    const user = store.get(KEYS.USER, null);
    return user ? JSON.parse(user) : null;
  }

  static isAuthenticated() {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;
    return !this.isAccessTokenExpired();
  }

  static clearTokens() {
    logger.debug('[TokenStorage] clearTokens called');
    store.delete(KEYS.ACCESS_TOKEN);
    store.delete(KEYS.REFRESH_TOKEN);
    store.delete(KEYS.USER);
    store.delete(KEYS.EXPIRES_AT);
  }

  static updateAccessToken(accessToken, expiresIn = null) {
    logger.debug('[TokenStorage] updateAccessToken called');
    store.set(KEYS.ACCESS_TOKEN, accessToken);
    if (expiresIn) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      store.set(KEYS.EXPIRES_AT, expiresAt.toISOString());
    }
  }

  static setAccessToken(accessToken) {
    logger.debug('[TokenStorage] setAccessToken called');
    store.set(KEYS.ACCESS_TOKEN, accessToken);
  }

  static setRefreshToken(refreshToken) {
    logger.debug('[TokenStorage] setRefreshToken called');
    store.set(KEYS.REFRESH_TOKEN, refreshToken);
  }

  // Aliases (kept for compatibility)
  static getToken() {
    return this.getAccessToken();
  }

  static setToken(token) {
    store.set(KEYS.ACCESS_TOKEN, token);
  }

  static clearToken() {
    store.delete(KEYS.ACCESS_TOKEN);
    store.delete(KEYS.REFRESH_TOKEN);
  }
}

module.exports = TokenStorage;