'use client';

import { Notification } from '@/lib/api';
import { useNotifications } from '@/lib/contexts/NotificationContext';
import moment from 'moment';
import { useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-dark-surface border border-dark-border rounded-md shadow-lg z-50 max-h-96 flex flex-col">
      <div className="p-4 border-b border-dark-border flex items-center justify-between">
        <h3 className="text-lg font-medium text-dark-text">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-dark-accent hover:text-dark-accentHover transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-dark-textSecondary">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer hover:bg-dark-border transition-colors ${
                  !notification.isRead ? 'bg-dark-border/50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-dark-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {notification.triggeredByUser.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-text">
                      {notification.message}
                    </p>
                    <p className="text-xs text-dark-textSecondary mt-1">
                      {moment(notification.createdAt).fromNow()}
                    </p>
                  </div>

                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-dark-accent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
