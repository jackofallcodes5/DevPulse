'use client';
import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationAPI } from '@/lib/api';
import { useNotificationStore } from '@/stores/notificationStore';
import { getSocket } from '@/lib/socket';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, setNotifications, addNotification, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    notificationAPI
      .getAll()
      .then((res) => {
        if (res.data) {
          setNotifications(res.data.notifications, res.data.unreadCount);
        }
      })
      .catch((err) => console.error('Failed to load notifications:', err));

    const socket = getSocket();
    if (socket) {
      const handleNewNotif = (notif) => {
        addNotification(notif);
      };
      socket.on('notification:created', handleNewNotif);
      return () => {
        socket.off('notification:created', handleNewNotif);
      };
    }
  }, [setNotifications, addNotification]);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      markAllRead();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-gray-900/60 border border-white/5 hover:border-purple-500/30 text-gray-300 hover:text-white transition relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-[#0a0a0f] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-white/10 p-3 shadow-2xl z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No notifications yet</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    !n.read
                      ? 'bg-purple-600/10 border-purple-500/30 text-white'
                      : 'bg-gray-900/40 border-white/5 text-gray-400'
                  }`}
                >
                  <p className="font-semibold text-gray-200">{n.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
