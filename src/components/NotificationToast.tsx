import { motion, AnimatePresence } from 'motion/react';
import { X, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NotificationToast({ notification, onClose }: { notification: { title: string; body: string } | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Delay the close to allow exit animation
        setTimeout(onClose, 500);
      }, 4500); 
      return () => clearTimeout(timer);
    }
  }, [notification]); // Remove onClose from dependency to prevent loop since parents recreate function every render

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 right-4 z-[100] w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-4 font-sans"
        >
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{notification.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{notification.body}</p>
              </div>
            </div>
            <button onClick={() => { setVisible(false); onClose(); }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
