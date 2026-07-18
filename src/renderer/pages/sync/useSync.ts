import { useContext } from "react";
import SyncContext from "./SyncContext";

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used inside a SyncProvider");
  }
  return context;
};
