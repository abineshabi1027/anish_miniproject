import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api('/notifications');
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const socket = getSocket();

      const handleRealtimeNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
        // Show prominent toast banner
        showToast(notif.message, notif.type);
      };

      socket.on('notification', handleRealtimeNotification);

      return () => {
        socket.off('notification', handleRealtimeNotification);
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const showToast = (message, type = 'INFO', duration = 6000) => {
    setActiveToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setActiveToast((current) => (current && current.message === message ? null : current));
    }, duration);
  };

  const markAsRead = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        showToast
      }}
    >
      {children}
      {/* Universal Floating Toast Component */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce sm:animate-none">
          <div
            className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
              activeToast.type === 'TOKEN_CALLED'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30'
                : activeToast.type === 'TOKEN_APPROACHING'
                ? 'bg-amber-600 text-white border-amber-500 shadow-amber-500/30'
                : activeToast.type === 'QUEUE_CANCELLED'
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/30'
                : 'bg-slate-900 text-white border-slate-700 shadow-indigo-500/20'
            }`}
          >
            <div className="text-xl">🔔</div>
            <div className="flex-1">
              <p className="font-semibold text-xs tracking-wider uppercase opacity-90">
                {activeToast.type.replace('_', ' ')}
              </p>
              <p className="text-sm font-medium mt-0.5 leading-snug">{activeToast.message}</p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-white/80 hover:text-white text-sm font-bold ml-2 p-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
