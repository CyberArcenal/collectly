// src/renderer/types/global.d.ts

export {};

declare global {
  interface Window {
    backendAPI: {
      // ========== CORE MODULES ==========
      auditLog: (payload: any) => Promise<any>;
      activation: (payload: any) => Promise<any>;
      notification: (payload: any) => Promise<any>;
      reminderLog: (payload: any) => Promise<any>;
      notificationLog: (payload: any) => Promise<any>;
      systemConfig: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
      onlineSystemConfig: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
      dashboard: (payload: any) => Promise<any>;
      updater: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
      handshake: (payload: any) => Promise<any>;
      tokenStorage: (payload: { method: string; params?: any }) => Promise<any>;

      // ========== DEBT MANAGEMENT MODULES ==========
      borrower: (payload: any) => Promise<any>;
      debt: (payload: any) => Promise<any>;
      loanAgreement: (payload: any) => Promise<any>;
      paymentTransaction: (payload: any) => Promise<any>;
      penaltyTransaction: (payload: any) => Promise<any>;
      interestRateChangeLog: (payload: any) => Promise<any>;
      controls: (payload: any) => Promise<any>;

      // ========== NEW DEBT MANAGEMENT MODULES ==========
      group: (payload: any) => Promise<any>;
      loanApplication: (payload: any) => Promise<any>;
      paymentMethod: (payload: any) => Promise<any>;
      printer: (payload: any) => Promise<any>;
      creditCheck: (payload: any) => Promise<any>;

      // ========== SYNC MODULE (SIMPLIFIED) ==========
      sync: (payload: {
        method:
          | "fullSync"
          | "getSyncStatus"
          | "getSyncSummary"
          | "getTaskStatus"
          | "getTaskList"
          | "pollTask"
          | "isSyncAvailable"
          | "cancelSync"
          | "getPendingChanges";
        params?: any;
      }) => Promise<{
        status: boolean;
        message: string;
        data?: any;
      }>;

      // ========== PRINTER CONVENIENCE METHODS ==========
      printerGetStatus: () => Promise<{
        driverLoaded: boolean;
        isReady: boolean;
      }>;
      printerIsAvailable: () => Promise<boolean>;
      printerReload: () => Promise<{ driverLoaded: boolean; isReady: boolean }>;
      printerPrint: (sale: any) => Promise<boolean>;
      printerTestPrint: () => Promise<boolean>;

      // ========== UTILITIES & WINDOW CONTROL ==========
      windowControl: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<{
        status: boolean;
        message: string;
        data?: any;
      }>;
      openExternal: (url: string) => Promise<void>;
      openAgreementFile: (relativePath: string) => Promise<{
        status: boolean;
        message: string;
      }>;
      notifyAppReady: () => void;

      // ========== EVENT LISTENERS ==========
      onAppReady: (callback: () => void) => () => void;
      on: (
        channel: string,
        callback: (event: any, ...args: any[]) => void
      ) => () => void;
      off: (channel: string, callback: (...args: any[]) => void) => void;

      // ========== WINDOW STATE EVENTS ==========
      onWindowMaximized: (callback: () => void) => void;
      onWindowRestored: (callback: () => void) => void;
      onWindowMinimized: (callback: () => void) => void;
      onWindowClosed: (callback: () => void) => void;
      onWindowResized: (callback: (bounds: any) => void) => void;
      onWindowMoved: (callback: (position: any) => void) => void;

      // ========== FILE HANDLERS ==========
      showItemInFolder: (fullPath: string) => Promise<any>;
      openFile: (filePath: string) => Promise<any>;
      getFileInfo: (filePath: string) => Promise<any>;
      fileExists: (filePath: string) => Promise<any>;
      openDirectory: (dirPath: string) => Promise<any>;
      getFilesInDirectory: (dirPath: string, extensions?: string[]) => Promise<any>;
      getRecentExports: (exportDir: string, limit: number) => Promise<any>;
      deleteFile: (filePath: string) => Promise<any>;
      copyFileToClipboard: (filePath: string) => Promise<any>;

      // ========== USER MODULE ==========
      user: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
        pagination?: {
          next: string | null;
          previous: string | null;
          count: number;
          current_page: number;
          total_pages: number;
          page_size: number;
        };
      }>;

      // ========== AUTHENTICATION & SECURITY ==========
      auth: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
        pagination?: any;
      }>;

      // ========== LOGGING ==========
      log: {
        info: (message: string, data?: any) => void;
        error: (message: string, error?: any) => void;
        warn: (message: string, warning?: any) => void;
      };
    };
  }
}