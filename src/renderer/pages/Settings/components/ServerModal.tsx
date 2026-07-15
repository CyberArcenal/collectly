// src/renderer/pages/Settings/components/ServerModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { X, History, Trash2, Clock, Wifi, CheckCircle, AlertCircle, ChevronDown, CornerDownLeft } from "lucide-react";

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  onConnect: () => void;
  connecting: boolean;
  onUpdate: (field: string, value: any) => void;
  currentServerUrl: string;
}

const URL_HISTORY_KEY = "server_url_history";

const getUrlHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(URL_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    }
    return [];
  } catch { return []; }
};

const saveUrlHistory = (url: string) => {
  if (!url || !url.trim()) return;
  const history = getUrlHistory();
  const filtered = history.filter((u) => u !== url);
  const updated = [url, ...filtered].slice(0, 10);
  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(updated));
};

const clearUrlHistory = () => localStorage.removeItem(URL_HISTORY_KEY);

const removeUrlFromHistory = (url: string) => {
  const history = getUrlHistory();
  const filtered = history.filter((u) => u !== url);
  localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(filtered));
};

export const ServerModal: React.FC<ServerModalProps> = ({
  isOpen,
  onClose,
  serverUrl,
  onServerUrlChange,
  onConnect,
  connecting,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHistory(getUrlHistory());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleConnect = () => {
    if (serverUrl.trim()) {
      saveUrlHistory(serverUrl.trim());
      onConnect();
    }
  };

  const handleSelectHistory = (url: string) => {
    onServerUrlChange(url);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden animate-slideDown" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full" style={{ backgroundColor: "var(--primary-color)/10" }}>
              <Wifi className="w-5 h-5" style={{ color: "var(--primary-color)" }} />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Connect to Server</h3>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Enter your server URL to enable online mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="relative">
            <div className="flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary-color)] transition-all" style={{ borderColor: "var(--input-border)", backgroundColor: "var(--input-bg)" }}>
              <div className="pl-3 pr-1" style={{ color: "var(--text-tertiary)" }}>
                <Wifi className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type="url"
                value={serverUrl}
                onChange={(e) => onServerUrlChange(e.target.value)}
                onFocus={() => setShowHistory(true)}
                placeholder="https://your-server.com/api"
                className="flex-1 py-2.5 px-2 text-sm bg-transparent outline-none placeholder-[var(--text-tertiary)]"
                style={{ color: "var(--text-primary)" }}
                autoComplete="off"
              />
              {history.length > 0 && (
                <button onClick={() => setShowHistory(!showHistory)} className="p-1.5 mx-1 rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors" style={{ color: "var(--text-tertiary)" }}>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            {showHistory && history.length > 0 && (
              <div ref={historyRef} className="absolute left-0 right-0 mt-1.5 rounded-xl border shadow-lg overflow-hidden z-50 animate-slideDown" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", maxHeight: "220px" }}>
                <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)" }}>
                  <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
                    <Clock className="w-3.5 h-3.5" />
                    Recently used
                  </span>
                  <button onClick={() => { clearUrlHistory(); setHistory([]); setShowHistory(false); }} className="text-xs hover:transition-colors flex items-center gap-1" style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger-color)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}>
                    <Trash2 className="w-3 h-3" />
                    Clear all
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[170px]">
                  {history.map((url, index) => (
                    <div key={index} onClick={() => handleSelectHistory(url)} className="flex items-center justify-between px-3 py-2 hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer group border-b last:border-0" style={{ borderColor: "var(--border-color)" }}>
                      <span className="text-sm truncate flex-1" style={{ color: "var(--text-primary)" }}>{url}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); removeUrlFromHistory(url); setHistory(getUrlHistory()); }} className="p-0.5 rounded hover:bg-[var(--card-hover-bg)] transition-colors" style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger-color)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Your connection history is stored locally for quick access.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--card-secondary-bg)" }}>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: "var(--btn-secondary-bg)", color: "var(--btn-secondary-text)", border: "1px solid var(--btn-secondary-border)" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-hover)"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--btn-secondary-bg)"}>
            Cancel
          </button>
          <button onClick={handleConnect} disabled={connecting || !serverUrl.trim()} className="px-5 py-1.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50" style={{ backgroundColor: "var(--primary-color)" }} onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "var(--primary-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-color)"; }}>
            {connecting ? (
              <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Connecting...</>
            ) : (
              <><Wifi className="w-4 h-4" /> Connect</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerModal;