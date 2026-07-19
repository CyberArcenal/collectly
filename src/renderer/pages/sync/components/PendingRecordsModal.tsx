import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useSyncContext } from '../../../contexts/SyncContext';
import Modal from '../../../components/UI/Modal';

interface PendingRecordsModalProps {
  entityName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const PendingRecordsModal: React.FC<PendingRecordsModalProps> = ({
  entityName,
  isOpen,
  onClose,
}) => {
  const { getPendingRecords } = useSyncContext();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && entityName) {
      setLoading(true);
      setError(null);
      getPendingRecords(entityName)
        .then((data) => setRecords(data.records))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, entityName, getPendingRecords]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pending Records - ${entityName || ''}`}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary-color)]" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-[var(--text-tertiary)] text-sm">No pending records</div>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
              <tr>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)]">ID</th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)]">Data</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={idx} className="border-b border-[var(--border-color)]">
                  <td className="py-2 px-3 font-mono text-xs">{record.id || idx}</td>
                  <td className="py-2 px-3">
                    <pre className="text-xs whitespace-pre-wrap break-all">
                      {JSON.stringify(record, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default PendingRecordsModal;