// src/renderer/contexts/SettingsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import type {
  GroupedSettingsData,
  SettingType,
  UpdateCategorySettingsData,
  GeneralSettings,
} from "../api/utils/system_config";
import systemConfigAPI from "../api/utils/system_config";

// ============================================================
// TYPES
// ============================================================

export type SyncMode = "offline" | "online" | "offline_first";

export interface SettingsState {
  grouped: GroupedSettingsData | null;
  flat: Record<string, any>;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

type SettingsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: GroupedSettingsData }
  | { type: "FETCH_ERROR"; payload: string }
  | {
      type: "UPDATE_CATEGORY";
      payload: {
        category: keyof GroupedSettingsData["grouped_settings"];
        data: any;
      };
    }
  | { type: "UPDATE_FLAT"; payload: { key: string; value: any } }
  | { type: "REFRESH" };

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: SettingsState = {
  grouped: null,
  flat: {},
  loading: true,
  error: null,
  lastFetched: null,
};

// Helper to build flat object from grouped settings
const buildFlatSettings = (grouped: GroupedSettingsData): Record<string, any> => {
  const flat: Record<string, any> = {};
  if (!grouped?.grouped_settings) return flat;

  Object.entries(grouped.grouped_settings).forEach(([category, settings]) => {
    if (settings && typeof settings === "object") {
      Object.entries(settings).forEach(([key, value]) => {
        flat[`${category}.${key}`] = value;
      });
    }
  });

  grouped.settings?.forEach((setting) => {
    flat[`${setting.setting_type}.${setting.key}`] = setting.value;
  });

  return flat;
};

// ============================================================
// REDUCER
// ============================================================

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        grouped: action.payload,
        flat: buildFlatSettings(action.payload),
        loading: false,
        error: null,
        lastFetched: Date.now(),
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "UPDATE_CATEGORY":
      if (!state.grouped) return state;
      const updatedGrouped = {
        ...state.grouped,
        grouped_settings: {
          ...state.grouped.grouped_settings,
          [action.payload.category]: {
            ...(state.grouped.grouped_settings[action.payload.category] as object),
            ...action.payload.data,
          },
        },
      };
      return {
        ...state,
        grouped: updatedGrouped,
        flat: buildFlatSettings(updatedGrouped),
      };
    case "UPDATE_FLAT":
      return {
        ...state,
        flat: { ...state.flat, [action.payload.key]: action.payload.value },
      };
    default:
      return state;
  }
}

// ============================================================
// CONTEXT VALUE
// ============================================================

interface SettingsContextValue {
  settings: SettingsState;
  getSetting: <T = any>(category: string, key: string, defaultValue?: T) => T;
  getCategory: <T = any>(category: string) => T | null;
  updateCategory: (category: string, data: Record<string, any>) => Promise<void>;
  updateSetting: (
    category: string,
    key: string,
    value: any,
    description?: string,
  ) => Promise<void>;
  refreshSettings: () => Promise<void>;

  // ============================================================
  // 🆕 SYNC MODE SPECIFIC METHODS
  // ============================================================

  /**
   * Get the current sync mode from settings
   * @returns SyncMode - 'offline' | 'online' | 'offline_first'
   */
  getSyncMode: () => SyncMode;

  /**
   * Check if the app is in online mode
   * @returns boolean - true if sync_mode is 'online' or 'offline_first'
   */
  isOnlineMode: () => boolean;

  /**
   * Check if the app is in strict online mode
   * @returns boolean - true if sync_mode is 'online'
   */
  isStrictOnlineMode: () => boolean;

  /**
   * Check if the app is in offline mode
   * @returns boolean - true if sync_mode is 'offline'
   */
  isOfflineMode: () => boolean;

  /**
   * Update the sync mode setting
   * @param mode - The new sync mode
   * @param serverUrl - Optional server URL (required when mode is 'online')
   */
  setSyncMode: (mode: SyncMode, serverUrl?: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  const fetchSettings = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const response = await systemConfigAPI.getGroupedConfig();
      if (response.status && response.data) {
        dispatch({ type: "FETCH_SUCCESS", payload: response.data });
      } else {
        dispatch({
          type: "FETCH_ERROR",
          payload: response.message || "Failed to load settings",
        });
      }
    } catch (err: any) {
      dispatch({
        type: "FETCH_ERROR",
        payload: err.message || "Unknown error",
      });
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ============================================================
  // BASE SETTINGS METHODS
  // ============================================================

  const getSetting = useCallback(
    <T = any,>(category: string, key: string, defaultValue?: T): T => {
      const flatKey = `${category}.${key}`;
      return (state.flat[flatKey] as T) ?? (defaultValue as T);
    },
    [state.flat],
  );

  const getCategory = useCallback(
    <T = any,>(category: string): T | null => {
      if (!state.grouped) return null;
      return (
        (state.grouped.grouped_settings[
          category as keyof typeof state.grouped.grouped_settings
        ] as T) ?? null
      );
    },
    [state.grouped],
  );

  const updateCategory = useCallback(
    async (category: string, data: Record<string, any>) => {
      try {
        const payload: UpdateCategorySettingsData = { [category]: data };
        const response = await systemConfigAPI.updateGroupedConfig(payload);
        if (response.status && response.data) {
          dispatch({
            type: "UPDATE_CATEGORY",
            payload: { category: category as any, data },
          });
        } else {
          await fetchSettings();
          throw new Error(response.message || "Update failed");
        }
      } catch (err) {
        console.error("Failed to update category settings:", err);
        throw err;
      }
    },
    [fetchSettings],
  );

  const updateSetting = useCallback(
    async (category: string, key: string, value: any, description?: string) => {
      try {
        const response = await systemConfigAPI.setValueByKey(key, value, {
          setting_type: category as SettingType,
          description,
          isPublic: false,
        });
        if (response.status) {
          dispatch({
            type: "UPDATE_FLAT",
            payload: { key: `${category}.${key}`, value },
          });
          if (
            state.grouped?.grouped_settings[
              category as keyof typeof state.grouped.grouped_settings
            ]
          ) {
            dispatch({
              type: "UPDATE_CATEGORY",
              payload: {
                category: category as any,
                data: { [key]: value },
              },
            });
          }
        } else {
          await fetchSettings();
          throw new Error(response.message || "Update failed");
        }
      } catch (err) {
        console.error("Failed to update setting:", err);
        throw err;
      }
    },
    [fetchSettings, state.grouped],
  );

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  // ============================================================
  // 🆕 SYNC MODE METHODS
  // ============================================================

  /**
   * Get the current sync mode from settings
   * Defaults to 'offline' if not set or invalid
   */
  const getSyncMode = useCallback((): SyncMode => {
    const mode = getSetting<string>("general", "sync_mode", "offline");
    // Validate that the mode is one of the allowed values
    if (mode === "online" || mode === "offline_first" || mode === "offline") {
      return mode as SyncMode;
    }
    return "offline";
  }, [getSetting]);

  /**
   * Check if the app is in online mode
   * Returns true for 'online' and 'offline_first' modes
   */
  const isOnlineMode = useCallback((): boolean => {
    const mode = getSyncMode();
    return mode === "online" || mode === "offline_first";
  }, [getSyncMode]);

  /**
   * Check if the app is in strict online mode
   * Returns true only for 'online' mode
   */
  const isStrictOnlineMode = useCallback((): boolean => {
    return getSyncMode() === "online";
  }, [getSyncMode]);

  /**
   * Check if the app is in offline mode
   */
  const isOfflineMode = useCallback((): boolean => {
    return getSyncMode() === "offline";
  }, [getSyncMode]);

  /**
   * Update the sync mode setting
   * @param mode - The new sync mode
   * @param serverUrl - Optional server URL (required when mode is 'online')
   */
  const setSyncMode = useCallback(
    async (mode: SyncMode, serverUrl?: string): Promise<void> => {
      // Validate: if mode is 'online', serverUrl must be provided
      if (mode === "online" && !serverUrl) {
        throw new Error("Server URL is required when switching to online mode");
      }

      // Update the sync mode
      await updateSetting("general", "sync_mode", mode, "Sync mode: offline/online/offline_first");

      // If online mode, also update the server URL
      if (mode === "online" && serverUrl) {
        await updateSetting("general", "server_url", serverUrl, "Server URL for online sync");
      } else if (mode === "offline") {
        // Optionally clear server URL when going offline
        // await updateSetting("general", "server_url", "", "Server URL (cleared for offline)");
      }

      // Refresh settings to ensure consistency
      await refreshSettings();
    },
    [updateSetting, refreshSettings],
  );

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const value: SettingsContextValue = {
    settings: state,
    getSetting,
    getCategory,
    updateCategory,
    updateSetting,
    refreshSettings,
    // Sync mode methods
    getSyncMode,
    isOnlineMode,
    isStrictOnlineMode,
    isOfflineMode,
    setSyncMode,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

// ============================================================
// HOOK
// ============================================================

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;