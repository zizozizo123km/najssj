import { useState, useEffect } from 'react';
import { db, doc, onSnapshot, Timestamp } from '../lib/firebase';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BroadcastNotification() {
  const [notification, setNotification] = useState<{ title: string; message: string; id: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'admin_settings', 'broadcast_notification'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const expiresAt = data.expiresAt as Timestamp;
        const now = Timestamp.now();

        // Only show if it hasn't expired yet
        if (expiresAt.toMillis() > now.toMillis()) {
          // Use sentAt as a unique ID to trigger the 5-second timer for new notifications
          const sentAt = data.sentAt as Timestamp;
          const notificationId = sentAt?.toMillis().toString() || 'default';
          
          setNotification({
            title: data.title,
            message: data.message,
            id: notificationId
          });
          setIsVisible(true);

          // Hide after 5 seconds
          const timer = setTimeout(() => {
            setIsVisible(false);
          }, 5000);

          return () => clearTimeout(timer);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 20, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%' }}
          className="fixed top-0 left-1/2 z-[9999] w-[90%] max-w-md"
          dir="rtl"
        >
          <div className="bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-2xl shadow-2xl shadow-blue-500/30 border border-white/20 flex items-start gap-4">
            <div className="bg-white/20 p-2 rounded-xl shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-lg leading-tight mb-1 truncate">
                {notification.title}
              </h3>
              <p className="text-blue-50 text-sm leading-relaxed line-clamp-2">
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
