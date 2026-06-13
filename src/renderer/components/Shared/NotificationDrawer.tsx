// components/Shared/NotificationDropdown.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Trash2, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import notificationAPI, { type Notification } from "../../api/core/notification";
import { dialogs } from "../../utils/dialogs";

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [show, setShow] = useState(false);
  const [anim, setAnim] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const limit = 10; // limit for dropdown, fewer than drawer

  // Fetch notifications when dropdown opens or page changes
  const fetchNotifications = useCallback(async (reset: boolean = false) => {
    if (!show) return;
    try {
      setLoading(true);
      setError(null);
      const response = await notificationAPI.getAll({
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      if (response.status) {
        const items = response.data.data;
        setNotifications((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(items.length === limit);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, show]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  }, []);

  // Reset and load when dropdown opens
  useEffect(() => {
    if (show) {
      setPage(1);
      setNotifications([]);
      fetchUnreadCount();
      fetchNotifications(true);
    }
  }, [show, fetchNotifications, fetchUnreadCount]);

  // Load more when page changes (pagination)
  useEffect(() => {
    if (show && page > 1) {
      fetchNotifications(false);
    }
  }, [page, show, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      if (response.status) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      const response = await notificationAPI.markManyAsRead(unreadIds);
      if (response.status) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Notification",
      message: "Are you sure you want to delete this notification?",
    });
    if (!confirmed) return;

    try {
      const response = await notificationAPI.delete(id);
      if (response.status) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
        if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const isLongMessage = (message: string) => message.length > 80;

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "payment_confirmation":
        return <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />;
      case "overdue":
        return <div className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />;
      case "reminder":
        return <div className="w-2 h-2 rounded-full bg-[var(--accent-orange)]" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />;
    }
  };

  const toggleDropdown = () => {
    if (!show) {
      setShow(true);
      setTimeout(() => setAnim(true), 10);
    } else {
      setAnim(false);
      setTimeout(() => setShow(false), 150);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && show) {
        setAnim(false);
        setTimeout(() => setShow(false), 150);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-xl hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-all duration-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div
          className={`absolute right-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-150 ease-out origin-top-right
            ${anim ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--sidebar-bg)]">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--primary-color)]" />
              <h3 className="font-semibold text-[var(--sidebar-text)]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-[var(--primary-color)]">({unreadCount} unread)</span>
              )}
            </div>
            <div className="flex gap-2">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[var(--primary-color)] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List area */}
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--primary-color)]" />
              </div>
            ) : error ? (
              <div className="text-center p-6">
                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-[var(--accent-red)]" />
                <p className="text-sm text-[var(--text-primary)]">{error}</p>
                <button
                  onClick={() => {
                    setPage(1);
                    setNotifications([]);
                    fetchNotifications(true);
                  }}
                  className="mt-3 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg text-sm"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8">
                <Bell className="w-10 h-10 mx-auto mb-2 text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-primary)]">No notifications yet</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  When you get notifications, they'll appear here.
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const expanded = expandedIds.has(notification.id);
                  const longMessage = isLongMessage(notification.message);
                  const isUnread = !notification.isRead;

                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--card-hover-bg)] transition-colors
                        ${isUnread ? "bg-[var(--primary-color)]/5" : ""}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-medium ${isUnread ? "text-[var(--sidebar-text)]" : "text-[var(--text-secondary)]"}`}>
                              {notification.title}
                            </p>
                            {isUnread && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary-color)]/20 text-[var(--primary-color)]">
                                New
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5">
                            <p
                              className={`text-sm ${isUnread ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"} ${!expanded ? "line-clamp-2" : ""}`}
                            >
                              {notification.message}
                            </p>
                            {longMessage && (
                              <button
                                onClick={() => toggleExpanded(notification.id)}
                                className="mt-1 text-xs text-[var(--primary-color)] hover:underline flex items-center gap-1"
                              >
                                {expanded ? (
                                  <>Show less <ChevronUp className="w-3 h-3" /></>
                                ) : (
                                  <>Read more <ChevronDown className="w-3 h-3" /></>
                                )}
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-[var(--text-tertiary)] mt-2">
                            {format(new Date(notification.createdAt), "MMM dd, yyyy • hh:mm a")}
                          </p>

                          {notification.debt && expanded && (
                            <div className="mt-3 text-xs text-[var(--text-tertiary)] bg-[var(--card-secondary-bg)] p-2 rounded-md border border-[var(--border-color)]">
                              <span className="font-medium">Debt ID:</span> {notification.debt.id}
                              {notification.debt.borrower && (
                                <>
                                  <br />
                                  <span className="font-medium">Borrower:</span> {notification.debt.borrower.name}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isUnread && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 hover:bg-[var(--card-hover-bg)] rounded-md"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-4 h-4 text-[var(--primary-color)]" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1.5 hover:bg-[var(--card-hover-bg)] rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <div className="px-4 py-2 border-t border-[var(--border-color)] text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full py-2 text-sm text-[var(--primary-color)] hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer link to full page */}
          <div className="px-4 py-2 border-t border-[var(--border-color)] text-center bg-[var(--sidebar-bg)] hidden">
            <button
              onClick={() => {
                navigate("/notifications");
                setShow(false);
              }}
              className="text-xs text-[var(--primary-color)] hover:underline"
            >
              View all in Notifications page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};