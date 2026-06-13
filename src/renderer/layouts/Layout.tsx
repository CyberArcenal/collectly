// src/layouts/Layout.tsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import TopBar from "./TopBar";
import { NotificationToastListener } from "../components/Shared/NotificationToastListener";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!mounted) return null;

  return (
    <div className="flex h-screen flex-col bg-[var(--background-color)]">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar wrapper na may margin sa itaas at ibaba */}
        <div className="my-1">
          <Sidebar isOpen={sidebarOpen} />
        </div>

        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content area – nakabalot sa card */}
        <div className="flex-1 flex flex-col overflow-hidden m-1">
          <div className="flex-1 flex flex-col bg-[var(--card-bg)] rounded-2xl shadow-lg overflow-hidden border border-[var(--border-color)]">
            <TopBar toggleSidebar={toggleSidebar} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <NotificationToastListener />
    </div>
  );
};

export default Layout;