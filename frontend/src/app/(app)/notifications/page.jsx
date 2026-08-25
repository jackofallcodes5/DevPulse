'use client';
import React, { useEffect, useState } from 'react';
import { notificationAPI } from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    notificationAPI
      .getAll()
      .then((res) => {
        if (res.data?.notifications) setNotifications(res.data.notifications);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark notifications read');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Bell className="w-6 h-6 text-purple-400" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time alerts for issue assignments, @mentions, GitHub commits, and API monitoring incidents
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All as Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You're all caught up! Notifications will appear here when you're assigned issues, mentioned in comments, or when monitors trigger incidents."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`space-y-1 transition ${
                !n.read ? 'bg-purple-600/10 border-purple-500/30' : 'opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{n.title}</h4>
                <span className="text-[10px] text-gray-500">
                  {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-gray-300">{n.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
