// src/renderer/pages/sync/hooks/useSync.ts

import { useSyncContext } from "../../../contexts/SyncContext";

export const useSync = () => {
  const context = useSyncContext();
  if (!context) {
    throw new Error("useSync must be used inside a SyncProvider");
  }
  return context;
};

export default useSync;