// src/renderer/api/utils/online_system_config.ts
import type {
  GroupedSettingsData,
  SystemInfoData,
  SystemSettingData,
  SettingType,
  UpdateCategorySettingsData,
  CreateSettingData,
  UpdateSettingData,
  SetValueByKeyData,
  BulkUpdateData,
  SettingsStatsResponse,
  OperationResponse,
  SettingResponse,
  SettingsListResponse,
  SystemConfigResponse,
  SystemInfoResponse,
  BulkOperationResponse,
} from "./system_config";



class OnlineSystemConfigAPI {
  private async call<T>(method: string, params: any = {}): Promise<T> {
    if (!window.backendAPI?.onlineSystemConfig) {
      throw new Error("Electron API (onlineSystemConfig) not available");
    }
    const response = await window.backendAPI.onlineSystemConfig({ method, params });
    return response as T;
  }

  // ============================================================
  // READ OPERATIONS
  // ============================================================

  async getGroupedConfig(): Promise<SystemConfigResponse> {
    return this.call<SystemConfigResponse>("getGroupedConfig", {});
  }

  async getSystemInfo(): Promise<SystemInfoResponse> {
    return this.call<SystemInfoResponse>("getSystemInfo", {});
  }

  async getAllSettings(params?: {
    page?: number;
    limit?: number;
    settingType?: SettingType;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<SettingsListResponse> {
    return this.call<SettingsListResponse>("getAllSettings", params || {});
  }

  async getPublicSettings(): Promise<SettingsListResponse> {
    return this.call<SettingsListResponse>("getPublicSettings", {});
  }

  async getSettingByKey(key: string, settingType?: SettingType): Promise<SettingResponse> {
    return this.call<SettingResponse>("getSettingByKey", { key, settingType });
  }

  async getByType(settingType: SettingType): Promise<SettingsListResponse> {
    return this.call<SettingsListResponse>("getByType", { settingType });
  }

  async getValueByKey(key: string, defaultValue?: any): Promise<SettingResponse> {
    return this.call<SettingResponse>("getValueByKey", { key, defaultValue });
  }

  async getSettingsStats(): Promise<SettingsStatsResponse> {
    return this.call<SettingsStatsResponse>("getSettingsStats", {});
  }

  async getSystemInfoForFrontend(): Promise<{
    system_info: any;
    public_settings: any;
    cache_timestamp: string;
  }> {
    const response = await this.call<any>("getSystemInfoForFrontend", {});
    return response.data;
  }

  // ============================================================
  // TEST CONNECTIONS
  // ============================================================

  async testSmtpConnection(settings: any): Promise<OperationResponse> {
    return this.call<OperationResponse>("testSmtpConnection", { settings });
  }

  async testSmsConnection(settings: any): Promise<OperationResponse> {
    return this.call<OperationResponse>("testSmsConnection", { settings });
  }

  // ============================================================
  // WRITE OPERATIONS
  // ============================================================

  async updateGroupedConfig(configData: UpdateCategorySettingsData): Promise<SystemConfigResponse> {
    return this.call<SystemConfigResponse>("updateGroupedConfig", { configData });
  }

  async createSetting(settingData: CreateSettingData): Promise<SettingResponse> {
    return this.call<SettingResponse>("createSetting", { settingData });
  }

  async updateSetting(id: number, settingData: UpdateSettingData): Promise<SettingResponse> {
    return this.call<SettingResponse>("updateSetting", { id, settingData });
  }

  async deleteSetting(id: number): Promise<OperationResponse> {
    return this.call<OperationResponse>("deleteSetting", { id });
  }

  async setValueByKey(key: string, value: any, options?: Partial<SetValueByKeyData>): Promise<SettingResponse> {
    return this.call<SettingResponse>("setValueByKey", { key, value, options });
  }

  async bulkUpdate(settingsData: Array<{
  key: string;
  value: any;
  setting_type?: string;
  description?: string;
  isPublic?: boolean;
}>): Promise<BulkOperationResponse> {
  return this.call<BulkOperationResponse>("bulkUpdate", { settingsData });
}

  async bulkDelete(ids: number[]): Promise<BulkOperationResponse> {
    return this.call<BulkOperationResponse>("bulkDelete", { ids });
  }

  // ============================================================
  // CATEGORY-SPECIFIC CONVENIENCE
  // ============================================================

  async updateCategorySettings(category: string, settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateGroupedConfig({ [category]: settings });
  }

  async updateGeneralSettings(settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("general", settings);
  }

  async updateCollectionsSettings(settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("collections", settings);
  }

  async updateLoanSettings(settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("loans", settings);
  }

  async updateNotificationsSettings(settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("notifications", settings);
  }

  async updateReportsSettings(settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("reports", settings);
  }

  async updateIntegrationsSettings(settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("integrations", settings);
  }

  async updateAuditSecuritySettings(settings: Record<string, any>): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("audit_security", settings);
  }

  // ============================================================
  // UTILITY
  // ============================================================

  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.onlineSystemConfig;
  }

  async settingExists(key: string, settingType?: SettingType): Promise<boolean> {
    try {
      const response = await this.getSettingByKey(key, settingType);
      return response.status && response.data !== null;
    } catch {
      return false;
    }
  }

  async getBooleanSetting(category: string, key: string, defaultValue = false): Promise<boolean> {
    const value = await this.getValueByKey(key, defaultValue);
    const val = value.data;
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.toLowerCase() === "true" || val === "1";
    if (typeof val === "number") return val === 1;
    return defaultValue;
  }

  async getNumberSetting(category: string, key: string, defaultValue = 0): Promise<number> {
    const value = await this.getValueByKey(key, defaultValue);
    const num = parseFloat(value.data);
    return isNaN(num) ? defaultValue : num;
  }

  async getStringSetting(category: string, key: string, defaultValue = ""): Promise<string> {
    const value = await this.getValueByKey(key, defaultValue);
    return String(value.data);
  }
}

const onlineSystemConfigAPI = new OnlineSystemConfigAPI();
export default onlineSystemConfigAPI;