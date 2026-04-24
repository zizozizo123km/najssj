import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationPermissionBanner() {
  const { permission, requestPermission } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(true);

  if (permission === 'granted' || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bell size={20} />
            </div>
            <h4 className="font-bold text-sm">تفعيل الإشعارات</h4>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed">
          فعل الإشعارات لتبقى على اطلاع بأحدث الدروس والملاحظات فور صدورها.
        </p>
        <button
          onClick={requestPermission}
          className="w-full bg-white text-blue-600 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors"
        >
          تفعيل الآن
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
