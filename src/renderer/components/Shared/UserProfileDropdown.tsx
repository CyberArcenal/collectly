// src/renderer/components/Shared/UserProfileDropdown.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, UserCircle, Shield, Mail, ChevronDown, CheckCircle, WifiOff } from "lucide-react";
import authAPI from "../../api/core/auth";
import type { User } from "../../api/core/auth";
import { showSuccess, showError } from "../../utils/notification";
import { dialogs } from "../../utils/dialogs";
import { useSettings } from "../../contexts/SettingsContext";
import { useAuth } from "../../contexts/AuthContext";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const UserProfileDropdown: React.FC = () => {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { getSyncMode, isOnlineMode, isOfflineMode, settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Listen to network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refresh user when settings change (e.g., sync mode changes)
  useEffect(() => {
    if (settings.lastFetched) {
      refreshUser();
    }
  }, [settings.lastFetched, refreshUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const confirmed = await dialogs.confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      cancelText: "Cancel",
      icon: "info",
    });
    if (!confirmed) return;

    try {
      const refreshToken = localStorage.getItem("refreshToken") || "";
      await authAPI.logout(refreshToken);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      showSuccess("Logged out successfully");
      navigate("/login");
    } catch (err: any) {
      showError("Logout failed", err.message);
    }
  };

  const handleProfile = () => {
    setIsOpen(false);
    navigate("/profile");
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate("/system/settings");
  };

  // Determine if we are effectively online (consider both network and sync mode)
  const isEffectivelyOnline = isOnline && isOnlineMode();

  if (authLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--card-secondary-bg)] animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  const fullName = user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;
  const initials = getInitials(fullName);
  const isAdmin = user.is_admin || user.user_type === "admin";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full transition-all duration-200 hover:ring-2 hover:ring-[var(--primary-color)] focus:outline-none group"
        title={fullName}
      >
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[var(--border-color)] group-hover:border-[var(--primary-color)] transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-sm font-medium shadow-md group-hover:shadow-lg transition-all">
              {initials}
            </div>
          )}
          {/* Status dot - green if effectively online, gray if offline */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--card-bg)] ring-1 ${
              isEffectivelyOnline
                ? "bg-[var(--success-color)] ring-[var(--success-color)]/30"
                : "bg-[var(--text-tertiary)] ring-[var(--text-tertiary)]/30"
            }`}
          />
        </div>
        <div className="hidden md:flex items-center gap-1">
          <span className="text-sm text-[var(--text-primary)] font-medium truncate max-w-[100px]">
            {fullName}
          </span>
          <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden z-50 animate-slideDown"
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--text-primary)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          {/* User Info Section */}
          <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--card-secondary-bg)]/50">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={fullName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border-color)]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--primary-hover)] flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base text-[var(--text-primary)] truncate">
                  {fullName}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)]">
                    <Shield className="w-3 h-3" />
                    {user.user_type_display || user.user_type}
                  </span>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[var(--primary-color)] text-white">
                      Admin
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] ${
                      isEffectivelyOnline ? "text-[var(--success-color)]" : "text-[var(--text-tertiary)]"
                    }`}
                  >
                    {isEffectivelyOnline ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <WifiOff className="w-3 h-3" />
                    )}
                    {isEffectivelyOnline ? "Online" : isOfflineMode() ? "Offline Mode" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2 px-1">
            <button
              onClick={handleProfile}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-primary)] group"
            >
              <UserCircle className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--primary-color)] transition-colors" />
              <span>Profile</span>
            </button>
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-[var(--card-hover-bg)] transition-colors text-[var(--text-primary)] group"
            >
              <Settings className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--primary-color)] transition-colors" />
              <span>Settings</span>
            </button>
            <div className="my-1 mx-3 border-t border-[var(--border-color)]" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:bg-[var(--status-overdue-bg)] transition-colors text-[var(--danger-color)] group"
            >
              <LogOut className="w-5 h-5 group-hover:text-[var(--danger-color)] transition-colors" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;