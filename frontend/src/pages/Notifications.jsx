import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { notificationAPI } from '../api/axios';
import { PageTransition, StaggerContainer, StaggerItem } from '../components/ui/Motion';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import {
  HiOutlineBell, HiOutlineCheck, HiOutlineCheckCircle,
  HiOutlineShoppingBag, HiOutlineInformationCircle, HiOutlineXCircle
} from 'react-icons/hi';

const TYPE_ICONS = {
  order_confirmation: HiOutlineShoppingBag,
  order_status_update: HiOutlineInformationCircle,
  order_cancelled: HiOutlineXCircle,
  welcome: HiOutlineBell,
  general: HiOutlineBell
};

const TYPE_COLORS = {
  order_confirmation: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  order_status_update: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  order_cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  welcome: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  general: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ unreadOnly: unreadOnly.toString(), limit: 50 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <PageTransition>
      <div className="page-container max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Notifications</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`text-sm px-4 py-2 rounded-xl transition-all ${
                unreadOnly
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Unread Only
            </button>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-ghost text-sm">
                <HiOutlineCheckCircle className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={HiOutlineBell}
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            description="Notifications about your orders will appear here."
          />
        ) : (
          <StaggerContainer className="space-y-3">
            {notifications.map((notif) => {
              const Icon = TYPE_ICONS[notif.type] || HiOutlineBell;
              const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.general;

              return (
                <StaggerItem key={notif._id}>
                  <motion.div
                    layout
                    className={`glass-card p-5 flex gap-4 transition-all ${
                      !notif.isRead ? 'border-l-4 border-l-primary-500' : 'opacity-75'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`font-semibold text-sm ${!notif.isRead ? '' : 'text-gray-500 dark:text-gray-400'}`}>
                            {notif.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif._id)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-primary-500 flex-shrink-0"
                            title="Mark as read"
                          >
                            <HiOutlineCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </PageTransition>
  );
}
