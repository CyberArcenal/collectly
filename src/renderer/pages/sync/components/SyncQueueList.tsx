// src/renderer/pages/sync/components/SyncQueueList.tsx
import React from "react";
import type { QueueItem } from "../../../api/utils/sync";

interface SyncQueueListProps {
  queueItems: QueueItem[];
}

const SyncQueueList: React.FC<SyncQueueListProps> = ({ queueItems }) => {
  if (queueItems.length === 0) {
    return (
      <div className="text-center py-2 text-[var(--text-tertiary)] text-sm">
        Queue is empty
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {queueItems.slice(0, 5).map((item, idx) => (
        <div key={idx} className="text-xs flex justify-between py-1 border-b border-[var(--border-color)] last:border-0">
          <span className="text-[var(--text-secondary)]">
            {item.entity}#{item.entityId}
          </span>
          <span className={`font-medium ${
            item.status === "pending" ? "text-yellow-500" :
            item.status === "failed" ? "text-red-500" :
            "text-green-500"
          }`}>
            {item.status}
          </span>
        </div>
      ))}
      {queueItems.length > 5 && (
        <div className="text-xs text-[var(--text-tertiary)] text-center pt-1">
          +{queueItems.length - 5} more
        </div>
      )}
    </div>
  );
};

export default SyncQueueList;