// src/renderer/pages/profile/index.tsx
import React, { useState, useEffect } from "react";
import { User, Lock, Shield, Monitor, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authAPI from "../../api/core/auth";
import userAPI from "../../api/core/user";
import type { User as UserType } from "../../api/core/auth";
import { showSuccess, showError } from "../../utils/notification";
import { dialogs } from "../../utils/dialogs";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import ProfileInfo from "./components/ProfileInfo";
import { useAuth } from "../../contexts/AuthContext";
import ChangePassword from "./components/ChangePassword";
import SecuritySettings from "./components/SecuritySettings";
import SessionsList from "./components/SessionsList";

type TabType = "profile" | "password" | "security" | "sessions";

const ProfilePage: React.FC = () => {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(authUser);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (authUser) {
          setUser(authUser);
        } else {
          const response = await authAPI.getCurrentUser();
          if (response) setUser(response);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        showError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [authUser]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-[var(--text-tertiary)] border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)]">
          <User className="w-8 h-8 mx-auto mb-2" />
          <p>You must be logged in to view this page.</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-3 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--primary-color)" }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "password", label: "Change Password", icon: <Lock className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "sessions", label: "Sessions", icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <User className="w-5 h-5 text-[var(--primary-color)]" />
            My Profile
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage your account details and security settings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[var(--primary-color)] text-[var(--primary-color)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
        {activeTab === "profile" && (
          <ProfileInfo user={user} onUpdate={refreshUser} />
        )}
        {activeTab === "password" && <ChangePassword />}
        {activeTab === "security" && <SecuritySettings />}
        {activeTab === "sessions" && <SessionsList />}
      </div>
    </div>
  );
};

export default ProfilePage;