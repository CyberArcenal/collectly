// src/utils/onlineClient.js
const Store = require('electron-store').default;
const fetch = require('electron-fetch').default;
const { logger } = require('./logger');
const { BrowserWindow } = require('electron');
const TokenStorage = require('./tokenStorage');

const store = new Store({ name: 'auth' });

class OnlineClient {
  constructor() {
    this.baseUrl = null;
    this.token = null;
    this.refreshPromise = null;
  }

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getToken() {
    // Use TokenStorage for consistency
    if (this.token) return this.token;
    this.token = TokenStorage.getAccessToken();
    return this.token;
  }

  setToken(token) {
    this.token = token;
    TokenStorage.setToken(token);
  }

  clearToken() {
    this.token = null;
    TokenStorage.clearTokens();
  }

  async refreshToken() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = TokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        
        // Use the correct refresh endpoint from your Django backend
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
        // Handle both response formats: { access, refresh } or { access_token, refresh_token }
        const accessToken = data.access || data.access_token;
        const newRefreshToken = data.refresh || data.refresh_token;
        const expiresIn = data.expires_in || data.expiresIn || 3600;
        
        this.setToken(accessToken);
        if (newRefreshToken) {
          TokenStorage.setRefreshToken(newRefreshToken);
        }
        TokenStorage.setTokenExpiration(expiresIn);
        
        return accessToken;
      } catch (err) {
        this.clearToken();
        // Notify renderer to redirect to login
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

  async request(method, endpoint, body = null, headers = {}) {
    if (!this.baseUrl) throw new Error('Server URL not set');
    const url = `${this.baseUrl}${endpoint}`;
    const makeRequest = async (token) => {
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers,
      };
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
      return await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : null,
      });
    };

    let token = this.getToken();
    let response = await makeRequest(token);

    // If unauthorized and we have a token, try refresh
    if (response.status === 401 && token) {
      try {
        const newToken = await this.refreshToken();
        response = await makeRequest(newToken);
      } catch (refreshErr) {
        // refresh failed – return original 401 response
        return response;
      }
    }
    return response;
  }

  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options.headers || {});
  }
  
  async post(endpoint, body, headers = {}) {
    return this.request('POST', endpoint, body, headers);
  }
  
  async put(endpoint, body, headers = {}) {
    return this.request('PUT', endpoint, body, headers);
  }
  
  async patch(endpoint, body, headers = {}) {
    return this.request('PATCH', endpoint, body, headers);
  }
  
  async delete(endpoint, headers = {}) {
    return this.request('DELETE', endpoint, null, headers);
  }
}

module.exports = new OnlineClient();