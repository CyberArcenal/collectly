// src/renderer/api/auth.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  user_type:
    | "viewer"
    | "customer"
    | "staff"
    | "collector"
    | "manager"
    | "admin";
  user_type_display: string;
  status: "active" | "restricted" | "suspended" | "deleted";
  status_display: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  is_restricted: boolean;
  is_suspended: boolean;
  is_admin: boolean;
  is_manager: boolean;
  security_settings: {
    id: number;
    two_factor_enabled: boolean;
    recovery_email: string | null;
    recovery_phone: string | null;
    alert_on_new_device: boolean;
    alert_on_password_change: boolean;
    alert_on_failed_login: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: boolean;
  user: User;
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
  message: string;
}

export interface Login2FARequiredResponse {
  status: boolean;
  requires_2fa: true;
  checkpoint_token: string;
  message: string;
  expires_in: number;
}

export type LoginResult = LoginResponse | Login2FARequiredResponse;

export interface LogoutRequest {
  refresh: string;
}

export interface LogoutResponse {
  status: boolean;
  message: string;
  data: { message: string } | null;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  status: boolean;
  message: string;
  data: {
    refresh: string;
    access: string;
    message: string;
  };
}

export interface TokenVerifyRequest {
  token: string;
}

export interface TokenVerifyResponse {
  status: boolean;
  message: string;
  data: {
    valid: boolean;
    user: User;
  };
}

export interface Resend2FARequest {
  checkpoint_token: string;
}

export interface Resend2FAResponse {
  status: boolean;
  message: string;
  expires_in: number;
}

export interface Verify2FARequest {
  checkpoint_token: string;
  otp_code: string;
}

export interface Verify2FAResponse {
  status: boolean;
  user: User;
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
  message: string;
}

// ----------------------------------------------------------------------
// Security Settings
// ----------------------------------------------------------------------

export interface SecuritySettings {
  id: number;
  user: number;
  user_username: string;
  user_email: string;
  two_factor_enabled: boolean;
  recovery_email: string | null;
  recovery_phone: string | null;
  alert_on_new_device: boolean;
  alert_on_password_change: boolean;
  alert_on_failed_login: boolean;
  updated_at: string;
  created_at: string;
}

export interface UpdateSecuritySettingsRequest {
  two_factor_enabled?: boolean;
  recovery_email?: string | null;
  recovery_phone?: string | null;
  alert_on_new_device?: boolean;
  alert_on_password_change?: boolean;
  alert_on_failed_login?: boolean;
}

export interface SecuritySettingsResponse {
  status: boolean;
  message: string;
  data: SecuritySettings;
}

// ----------------------------------------------------------------------
// Security Logs
// ----------------------------------------------------------------------

export interface SecurityLog {
  id: number;
  user: number;
  user_username: string;
  event_type:
    | "login"
    | "logout"
    | "password_change"
    | "2fa_enabled"
    | "2fa_disabled"
    | "failed_login";
  ip_address: string | null;
  user_agent: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityLogListResponse {
  status: boolean;
  message: string;
  pagination: {
    next: string | null;
    previous: string | null;
    count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
  };
  data: SecurityLog[];
}

export interface SecurityLogDetailResponse {
  status: boolean;
  message: string;
  data: SecurityLog;
}

// ----------------------------------------------------------------------
// Login Sessions
// ----------------------------------------------------------------------

export interface LoginSession {
  id: string;
  device_name: string;
  ip_address: string;
  created_at: string;
  last_used: string;
  expires_at: string;
  is_active: boolean;
  status_display: string;
  is_valid_display: boolean;
  user_data: {
    id: number;
    full_name: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    avatar: string | null;
  };
}

export interface SessionsListResponse {
  status: boolean;
  message: string;
  data: LoginSession[];
}

// ----------------------------------------------------------------------
// Security Health & Stats
// ----------------------------------------------------------------------

export interface SecurityHealth {
  two_factor: boolean;
  recovery_email: boolean;
  recovery_phone: boolean;
  strong_password: boolean;
  recent_activity: boolean;
  suspicious_activity: boolean;
  overall: boolean;
  issues: string[];
}

export interface SecurityHealthResponse {
  status: boolean;
  message: string;
  data: SecurityHealth;
}

export interface SecurityStats {
  total_sessions: number;
  active_sessions: number;
  failed_logins_24h: number;
  password_changes_30d: number;
  two_factor_enabled: boolean;
  security_score: number;
}

export interface SecurityStatsResponse {
  status: boolean;
  message: string;
  data: SecurityStats;
}

export interface SecurityConfigResponse {
  status: boolean;
  message: string;
  data: {
    settings: SecuritySettings;
    security_logs: SecurityLog[];
    system_info: {
      total_login_sessions: number;
      active_sessions: number;
      failed_login_attempts: number;
      last_password_change: string | null;
      two_factor_enabled: boolean;
    };
  };
}

// ----------------------------------------------------------------------
// OTP
// ----------------------------------------------------------------------

export interface OTPResponse {
  status: boolean;
  message: string;
  data: { success: boolean; message: string } | null;
}

export interface OTPRequest {
  code: string;
}

// ----------------------------------------------------------------------
// User Management (CRUD)
// ----------------------------------------------------------------------

export interface UserCreateData {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  password_confirmation?: string;
  phone_number?: string;
  user_type?: string;
  status?: string;
  avatar?: string | null;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user_type?: string;
  status?: string;
  avatar?: string | null;
}

export interface UserResponse {
  status: boolean;
  message: string;
  data: User;
}

export interface UsersListResponse {
  status: boolean;
  message: string;
  pagination: {
    next: string | null;
    previous: string | null;
    count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
  };
  data: User[];
}

export interface DeleteUserResponse {
  status: boolean;
  message: string;
  data: null;
}

// ----------------------------------------------------------------------
// 🧠 AuthAPI Class
// ----------------------------------------------------------------------

class AuthAPI {
  /**
   * Ensure the auth IPC is available
   */
  private async call<T>(method: string, params: any = {}): Promise<T> {
    if (!window.backendAPI?.auth) {
      throw new Error("Electron API (auth) not available");
    }
    const response = await window.backendAPI.auth({ method, params });
    return response as T;
  }

  // --------------------------------------------------------------------
  // 🔐 AUTHENTICATION
  // --------------------------------------------------------------------

  /**
   * Login with email/username and password
   * If 2FA is enabled, returns checkpoint_token for OTP verification
   */
  async login(credentials: LoginRequest): Promise<LoginResult> {
    return this.call<LoginResult>("login", credentials);
  }

  /**
   * Logout from current session (blacklists tokens)
   * @param refreshToken - Refresh token to blacklist
   */
  async logout(refreshToken: string): Promise<LogoutResponse> {
    return this.call<LogoutResponse>("logout", { refresh: refreshToken });
  }

  /**
   * Logout from all devices/sessions
   */
  async logoutAll(): Promise<LogoutResponse> {
    return this.call<LogoutResponse>("logoutAll", {});
  }

  /**
   * Refresh JWT tokens (gets new access/refresh pair)
   * @param refreshToken - Current refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.call<RefreshTokenResponse>("refreshToken", {
      refresh: refreshToken,
    });
  }

  /**
   * Verify an access token's validity
   * @param token - Access token to verify
   */
  async verifyToken(token: string): Promise<TokenVerifyResponse> {
    return this.call<TokenVerifyResponse>("verifyToken", { token });
  }

  /**
   * Resend 2FA OTP code to user's email
   * @param checkpointToken - Checkpoint token from login response
   */
  async resend2FA(checkpointToken: string): Promise<Resend2FAResponse> {
    return this.call<Resend2FAResponse>("resend2FA", {
      checkpoint_token: checkpointToken,
    });
  }

  /**
   * Verify 2FA OTP code and complete login
   * @param checkpointToken - Checkpoint token from login response
   * @param otpCode - 6-digit OTP code
   */
  async verify2FA(
    checkpointToken: string,
    otpCode: string,
  ): Promise<Verify2FAResponse> {
    return this.call<Verify2FAResponse>("verify2FA", {
      checkpoint_token: checkpointToken,
      otp_code: otpCode,
    });
  }

  // --------------------------------------------------------------------
  // 👤 USER MANAGEMENT
  // --------------------------------------------------------------------

  /**
   * Get paginated list of users (admin only)
   */
  async getUsers(params?: {
    page?: number;
    page_size?: number;
  }): Promise<UsersListResponse> {
    return this.call<UsersListResponse>("getUsers", params || {});
  }

  /**
   * Get a single user by ID (admin only)
   */
  async getUserById(id: number): Promise<UserResponse> {
    return this.call<UserResponse>("getUserById", { id });
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(data: UserCreateData): Promise<UserResponse> {
    return this.call<UserResponse>("createUser", { data });
  }

  /**
   * Update an existing user (admin only)
   */
  async updateUser(id: number, data: UserUpdateData): Promise<UserResponse> {
    return this.call<UserResponse>("updateUser", { id, data });
  }

  /**
   * Soft delete a user (admin only)
   */
  async deleteUser(id: number): Promise<DeleteUserResponse> {
    return this.call<DeleteUserResponse>("deleteUser", { id });
  }

  // --------------------------------------------------------------------
  // 🔒 SECURITY SETTINGS
  // --------------------------------------------------------------------

  /**
   * Get current user's security settings
   */
  async getSecuritySettings(): Promise<SecuritySettingsResponse> {
    return this.call<SecuritySettingsResponse>("getSecuritySettings", {});
  }

  /**
   * Update current user's security settings
   */
  async updateSecuritySettings(
    data: UpdateSecuritySettingsRequest,
  ): Promise<SecuritySettingsResponse> {
    return this.call<SecuritySettingsResponse>("updateSecuritySettings", {
      data,
    });
  }

  /**
   * Enable two-factor authentication
   */
  async enable2FA(): Promise<{
    status: boolean;
    message: string;
    data: { success: boolean; message: string };
  }> {
    return this.call("enable2FA", {});
  }

  /**
   * Disable two-factor authentication
   */
  async disable2FA(): Promise<{
    status: boolean;
    message: string;
    data: { success: boolean; message: string };
  }> {
    return this.call("disable2FA", {});
  }

  /**
   * Get complete security configuration (settings + logs + system info)
   */
  async getSecurityConfig(): Promise<SecurityConfigResponse> {
    return this.call<SecurityConfigResponse>("getSecurityConfig", {});
  }

  /**
   * Get security health check
   */
  async getSecurityHealth(): Promise<SecurityHealthResponse> {
    return this.call<SecurityHealthResponse>("getSecurityHealth", {});
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(): Promise<SecurityStatsResponse> {
    return this.call<SecurityStatsResponse>("getSecurityStats", {});
  }

  /**
   * Send test security alert
   */
  async testSecurityAlerts(): Promise<OTPResponse> {
    return this.call<OTPResponse>("testSecurityAlerts", {});
  }

  // --------------------------------------------------------------------
  // 📋 SECURITY LOGS
  // --------------------------------------------------------------------

  /**
   * Get paginated security logs
   */
  async getSecurityLogs(params?: {
    page?: number;
    page_size?: number;
    event_type?: string;
    ip_address?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<SecurityLogListResponse> {
    return this.call<SecurityLogListResponse>("getSecurityLogs", params || {});
  }

  /**
   * Get a single security log by ID
   */
  async getSecurityLogById(id: number): Promise<SecurityLogDetailResponse> {
    return this.call<SecurityLogDetailResponse>("getSecurityLogById", { id });
  }

  // --------------------------------------------------------------------
  // 💻 SESSIONS
  // --------------------------------------------------------------------

  /**
   * Get all login sessions for current user
   */
  async getSessions(): Promise<SessionsListResponse> {
    return this.call<SessionsListResponse>("getSessions", {});
  }

  /**
   * Terminate a specific session by ID
   * @param sessionId - UUID of the session
   */
  async terminateSession(
    sessionId: string,
  ): Promise<{ status: boolean; message: string }> {
    return this.call("terminateSession", { session_id: sessionId });
  }

  /**
   * Terminate all sessions except current
   */
  async terminateAllSessions(): Promise<{ status: boolean; message: string }> {
    return this.call("terminateAllSessions", {});
  }

  // --------------------------------------------------------------------
  // 📧 OTP
  // --------------------------------------------------------------------

  /**
   * Send OTP code to user's email
   */
  async sendEmailOTP(): Promise<OTPResponse> {
    return this.call<OTPResponse>("sendEmailOTP", {});
  }

  /**
   * Verify OTP code sent to email
   */
  async verifyEmailOTP(code: string): Promise<OTPResponse> {
    return this.call<OTPResponse>("verifyEmailOTP", { code });
  }

  /**
   * Send OTP code to user's phone
   */
  async sendPhoneOTP(): Promise<OTPResponse> {
    return this.call<OTPResponse>("sendPhoneOTP", {});
  }

  /**
   * Verify OTP code sent to phone
   */
  async verifyPhoneOTP(code: string): Promise<OTPResponse> {
    return this.call<OTPResponse>("verifyPhoneOTP", { code });
  }

  /**
   * Verify recovery email using OTP
   */
  async verifyRecoveryEmail(code: string): Promise<OTPResponse> {
    return this.call<OTPResponse>("verifyRecoveryEmail", { code });
  }

  /**
   * Verify recovery phone using OTP
   */
  async verifyRecoveryPhone(code: string): Promise<OTPResponse> {
    return this.call<OTPResponse>("verifyRecoveryPhone", { code });
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.auth;
  }

  /**
   * Check if a user is authenticated (token valid)
   */
  async isAuthenticated(token: string): Promise<boolean> {
    try {
      const response = await this.verifyToken(token);
      return response.status && response.data.valid;
    } catch {
      return false;
    }
  }
  
  /**
   * Get the current logged-in user from electron-store (main process)
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.call<{ status: boolean; data: User | null }>("getCurrentUser", {});
      if (response.status && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const authAPI = new AuthAPI();
export default authAPI;
