// src/renderer/utils/tokenStorage.ts

import type { User } from "../core/auth";

// ============================================================
// TYPES
// ============================================================

export interface TokensData {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  user: User | null;
  hasTokens: boolean;
}

export interface SetTokensParams {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number | null;
  user?: User | null;
}

export interface UpdateAccessTokenParams {
  accessToken: string;
  expiresIn?: number | null;
}

export interface AuthResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

// ============================================================
// TOKEN STORAGE CLASS
// ============================================================

/**
 * TokenStorage - Renderer-side token storage using IPC
 * 
 * This class communicates with the main process tokenStorage.js
 * via the 'auth' IPC channel. All token operations are handled
 * in the main process using electron-store.
 */
class TokenStorage {
  /**
   * Call the auth IPC handler
   */
  private async call<T = any>(
    method: string,
    params: Record<string, any> = {}
  ): Promise<AuthResponse<T>> {
    if (!window.backendAPI?.tokenStorage) {
      throw new Error('Electron API (tokenStorage) not available');
    }
    const response = await window.backendAPI.tokenStorage({ method, params });
    return response as AuthResponse<T>;
  }

  // ============================================================
  // TOKEN OPERATIONS
  // ============================================================

  /**
   * Set both access and refresh tokens
   * @param accessToken - JWT access token
   * @param refreshToken - JWT refresh token
   * @param expiresIn - Expiration time in seconds (optional)
   * @param user - User object (optional)
   */
  async setTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn?: number | null,
    user?: User | null
  ): Promise<void> {
    const response = await this.call('setTokens', {
      accessToken,
      refreshToken,
      expiresIn: expiresIn ?? null,
      user: user ?? null,
    });
    if (!response.status) {
      throw new Error(response.message || 'Failed to save tokens');
    }
  }

  /**
   * Get all tokens and user data
   * @returns TokensData
   */
  async getTokens(): Promise<TokensData> {
    const response = await this.call<TokensData>('getTokens');
    if (!response.status) {
      throw new Error(response.message || 'Failed to retrieve tokens');
    }
    return response.data;
  }

  /**
   * Get access token
   * @returns string | null
   */
  async getAccessToken(): Promise<string | null> {
    const response = await this.call<{ token: string | null }>('getAccessToken');
    if (!response.status) {
      throw new Error(response.message || 'Failed to get access token');
    }
    return response.data.token;
  }

  /**
   * Get refresh token
   * @returns string | null
   */
  async getRefreshToken(): Promise<string | null> {
    const response = await this.call<{ token: string | null }>('getRefreshToken');
    if (!response.status) {
      throw new Error(response.message || 'Failed to get refresh token');
    }
    return response.data.token;
  }

  /**
   * Update only the access token (for refresh)
   * @param accessToken - New access token
   * @param expiresIn - Expiration time in seconds (optional)
   */
  async updateAccessToken(accessToken: string, expiresIn?: number | null): Promise<void> {
    const response = await this.call('updateAccessToken', {
      accessToken,
      expiresIn: expiresIn ?? null,
    });
    if (!response.status) {
      throw new Error(response.message || 'Failed to update access token');
    }
  }

  /**
   * Check if access token is expired
   * @returns boolean
   */
  async isAccessTokenExpired(): Promise<boolean> {
    const response = await this.call<{ expired: boolean }>('isAccessTokenExpired');
    if (!response.status) {
      throw new Error(response.message || 'Failed to check token expiration');
    }
    return response.data.expired;
  }

  /**
   * Get token expiration date
   * @returns string | null - ISO date string
   */
  async getTokenExpiration(): Promise<string | null> {
    const response = await this.call<{ expiresAt: string | null }>('getTokenExpiration');
    if (!response.status) {
      throw new Error(response.message || 'Failed to get token expiration');
    }
    return response.data.expiresAt;
  }

  /**
   * Clear all tokens and user data
   */
  async clearTokens(): Promise<void> {
    const response = await this.call('clearTokens');
    if (!response.status) {
      throw new Error(response.message || 'Failed to clear tokens');
    }
  }

  // ============================================================
  // USER OPERATIONS
  // ============================================================

  /**
   * Set user data
   * @param user - User object
   */
  async setUser(user: User): Promise<void> {
    const response = await this.call('setUser', { user });
    if (!response.status) {
      throw new Error(response.message || 'Failed to save user');
    }
  }

  /**
   * Get user data
   * @returns User | null
   */
  async getUser(): Promise<User | null> {
    const response = await this.call<{ user: User | null }>('getUser');
    if (!response.status) {
      throw new Error(response.message || 'Failed to get user');
    }
    return response.data.user;
  }

  // ============================================================
  // AUTH STATUS
  // ============================================================

  /**
   * Check if user is authenticated (has valid tokens)
   * @returns boolean
   */
  async isAuthenticated(): Promise<boolean> {
    const response = await this.call<{ authenticated: boolean }>('isAuthenticated');
    if (!response.status) {
      throw new Error(response.message || 'Failed to check authentication');
    }
    return response.data.authenticated;
  }

  // ============================================================
  // CONVENIENCE METHODS (Aliases for backward compatibility)
  // ============================================================

  /**
   * Alias for getAccessToken()
   * @deprecated Use getAccessToken() instead
   */
  async getToken(): Promise<string | null> {
    return this.getAccessToken();
  }

  /**
   * Alias for setTokens() with only access token
   * @deprecated Use setTokens() instead
   */
  async setToken(accessToken: string): Promise<void> {
    // This is a minimal implementation - ideally you'd also have the refresh token
    // But this maintains backward compatibility with the original API
    const refreshToken = await this.getRefreshToken() || '';
    await this.setTokens(accessToken, refreshToken);
  }

  /**
   * Alias for clearTokens()
   * @deprecated Use clearTokens() instead
   */
  async clearToken(): Promise<void> {
    return this.clearTokens();
  }
}

// ============================================================
// EXPORT SINGLETON
// ============================================================

const tokenStorage = new TokenStorage();
export default tokenStorage;