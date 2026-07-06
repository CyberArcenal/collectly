// src/utils/onlineClient.js
const Store = require('electron-store').default;
const fetch = require('electron-fetch').default;
const { logger } = require('./logger');
const { BrowserWindow } = require('electron');
const TokenStorage = require('./tokenStorage');

// unused store – remove or keep for compatibility
// const store = new Store({ name: 'auth' });

class OnlineClient {
  constructor() {
    this.baseUrl = null;
    this.refreshPromise = null;
    // Do NOT cache token here – always read from TokenStorage
  }

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  // Always read fresh from storage
  getToken() {
    const token = TokenStorage.getAccessToken();
    logger.debug(`[OnlineClient] getToken: ${token ? 'present' : 'null'}`);
    return token;
  }

  setToken(token) {
    logger.debug('[OnlineClient] setToken called');
    TokenStorage.setAccessToken(token);
  }

  clearToken() {
    logger.debug('[OnlineClient] clearToken called');
    TokenStorage.clearTokens();
  }

  async refreshToken() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = TokenStorage.getRefreshToken();
        logger.debug(`[OnlineClient] refreshToken: refresh token ${refreshToken ? 'exists' : 'missing'}`);
        if (!refreshToken) throw new Error('No refresh token');

        const response = await fetch(`${this.baseUrl}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Refresh failed');
        }

        const data = await response.json();
        const accessToken = data.access || data.access_token;
        const newRefreshToken = data.refresh || data.refresh_token;
        const expiresIn = data.expires_in || data.expiresIn || 3600;

        logger.debug('[OnlineClient] Refresh successful, new tokens received');

        if (newRefreshToken) {
          TokenStorage.setTokens(accessToken, newRefreshToken, expiresIn);
        } else {
          TokenStorage.updateAccessToken(accessToken, expiresIn);
        }
        // Do not store token in this instance – rely on storage

        return accessToken;
      } catch (err) {
        logger.error('[OnlineClient] Refresh failed:', err.message);
        this.clearToken();
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('auth:unauthorized');
        });
        throw err;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  async request(method, endpoint, body = null, headers = {}, query = {}) {
    if (!this.baseUrl) throw new Error('Server URL not set');
    let url = `${this.baseUrl}${endpoint}`;
    const queryString = new URLSearchParams(query).toString();
    if (queryString) url += `?${queryString}`;

    const makeRequest = async (token) => {
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
        logger.debug(`[OnlineClient] Request to ${url} with token`);
      } else {
        logger.debug(`[OnlineClient] Request to ${url} without token`);
      }
      return await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : null,
      });
    };

    // Always read fresh token from storage
    let token = this.getToken();
    let response = await makeRequest(token);

    // If 401 and we have a refresh token, try to refresh
    if (response.status === 401) {
      const refreshToken = TokenStorage.getRefreshToken();
      if (refreshToken) {
        logger.debug('[OnlineClient] 401 received, attempting refresh...');
        try {
          const newToken = await this.refreshToken();
          response = await makeRequest(newToken);
        } catch (refreshErr) {
          logger.debug('[OnlineClient] Refresh failed, returning original 401');
          return response;
        }
      } else {
        logger.debug('[OnlineClient] 401 received but no refresh token available');
      }
    }
    return response;
  }

  async get(endpoint, options = {}) {
    const headers = options.headers || {};
    const query = options.params || {};
    return this.request('GET', endpoint, null, headers, query);
  }

  async post(endpoint, body, headers = {}, query = {}) {
    return this.request('POST', endpoint, body, headers, query);
  }

  async put(endpoint, body, headers = {}, query = {}) {
    return this.request('PUT', endpoint, body, headers, query);
  }

  async patch(endpoint, body, headers = {}, query = {}) {
    return this.request('PATCH', endpoint, body, headers, query);
  }

  async delete(endpoint, options = {}) {
    const headers = options.headers || {};
    const query = options.params || {};
    return this.request('DELETE', endpoint, null, headers, query);
  }
}

module.exports = new OnlineClient();