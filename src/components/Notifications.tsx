import { useState, useEffect } from 'react';
import { UserProfile, NotificationItem } from '../types';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Heart, Bell, CheckCircle2, UserPlus } from 'lucide-react';

interface NotificationsProps {
  user: UserProfile;
}

export default function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [user.uid]);

  const fetchNotifications = async () => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedNotifications: NotificationItem[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedNotifications.push(docSnap.data() as NotificationItem);
      });
      
      // Sort in memory since we might need a composite index for where + orderBy
      const sorted = fetchedNotifications.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(sorted);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;

    try {
      const promises = unreadNotifs.map(n => {
        const notifRef = doc(db, 'notifications', n.id);
        return updateDoc(notifRef, { read: true });
      });
      
      await Promise.all(promises);
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="pb-12 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center">
          <Bell className="w-6 h-6 mr-2 text-[#1e1b4b]" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
              {unreadCount} new
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e1b4b]"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white rounded-[2rem] p-5 shadow-sm border transition-all ${
                notification.read ? 'border-slate-100' : 'border-indigo-100 bg-indigo-50/30'
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  notification.type === 'follow' ? 'bg-indigo-50' : 'bg-red-50'
                }`}>
                  {notification.type === 'follow' ? (
                    <UserPlus className="w-6 h-6 text-indigo-500" />
                  ) : (
                    <Heart className="w-6 h-6 text-red-500 fill-current" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm mb-1 leading-snug">
                    <span className="font-bold">{notification.fromUserName}</span>
                    {notification.type === 'follow' ? (
                      <span> started following you</span>
                    ) : (
                      <>
                        <span> liked your link</span>
                        {notification.linkUrl && (
                          <span className="text-indigo-600"> {notification.linkUrl}</span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(notification.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-lg">No notifications yet</p>
          <p className="text-slate-400 text-sm mt-1">When someone interacts with your links, you'll see it here.</p>
        </div>
      )}
    </div>
  );
}
