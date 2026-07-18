import React, { useMemo, useState } from "react";
import { AlertCircle, Upload } from "lucide-react";
import { useSettings } from "../../contexts/SettingsContext";
import Modal from "../../components/UI/Modal";
import { SyncProvider } from "./SyncContext";
import { useSync } from "./useSync";
import SyncEntityList from "./SyncEntityList";
import { SYNC_ENTITIES, SyncEntityKey } from "./SyncStateStore";

const SyncPageContent: React.FC = () => {
  const { getSetting, isStrictOnlineMode } = useSettings();
  const {
    syncing,
    error,
    progress,
    currentTask,
    pendingCounts,
    lastSyncTimestamps,
    activeTasks,
    syncEntity,
    cancelSync,
    getPendingRecords,
  } = useSync();

  const serverUrl = getSetting("general", "server_url", "");
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<SyncEntityKey | null>(null);

  const hasOnlineAccess = isStrictOnlineMode();

  const pendingRecords = useMemo(
    () => (selectedEntity ? getPendingRecords(selectedEntity) : []),
    [getPendingRecords, selectedEntity],
  );

  const selectedEntityLabel = selectedEntity
    ? SYNC_ENTITIES.find((entity) => entity.key === selectedEntity)?.label ?? selectedEntity
    : "";

  const openPendingModal = (entityKey: SyncEntityKey) => {
    setSelectedEntity(entityKey);
    setPendingModalOpen(true);
  };

  const closePendingModal = () => {
    setPendingModalOpen(false);
    setSelectedEntity(null);
  };

  if (!hasOnlineAccess) {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)]">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Sync is only available in Online Mode.</p>
        <p className="text-sm">Please enable Online Mode in Settings.</p>
      </div>
    );
  }

  return (
    <div className="m-1 space-y-4">
      <div className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Upload className="w-5 h-5" /> Data Sync
            </h1>
            <p className="text-sm text-[var(--text-tertiary)]">
              Manual sync is available while the app is connected to the configured server.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-secondary-bg)] p-3 text-sm">
            <div className="font-semibold">Server</div>
            <div className="font-mono break-all">{serverUrl || "Not configured"}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-500/10 p-4 text-sm text-red-700">
          <div className="font-semibold">Sync error</div>
          <div>{error}</div>
        </div>
      )}

      <SyncEntityList
        entities={SYNC_ENTITIES}
        pendingCounts={pendingCounts}
        lastSyncTimestamps={lastSyncTimestamps}
        activeTasks={activeTasks}
        syncing={syncing}
        currentTask={currentTask}
        progressMessage={progress?.message ?? null}
        onSync={syncEntity}
        onCancel={cancelSync}
        onViewPending={openPendingModal}
      />

      <Modal
        isOpen={pendingModalOpen}
        onClose={closePendingModal}
        title={selectedEntityLabel ? `Pending records for ${selectedEntityLabel}` : "Pending records"}
        size="md"
      >
        {pendingRecords.length > 0 ? (
          <div className="space-y-3">
            {pendingRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] p-3"
              >
                <div className="font-semibold">{record.title}</div>
                <p className="text-sm text-[var(--text-tertiary)]">{record.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            There are no pending records for this entity at the moment.
          </p>
        )}
      </Modal>
    </div>
  );
};

const SyncPage: React.FC = () => {
  return (
    <SyncProvider>
      <SyncPageContent />
    </SyncProvider>
  );
};

export default SyncPage;