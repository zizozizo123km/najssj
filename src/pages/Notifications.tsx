import { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6 space-y-6 font-sans">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
        <Bell className="text-blue-600" /> الإشعارات
      </h1>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div key={n.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">{n.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{n.body}</p>
              <p className="text-[10px] text-gray-400 mt-2">{n.created_at?.toDate?.().toLocaleString('ar-DZ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
