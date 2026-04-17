import { useNotifications } from '../context/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

export default function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2 overflow-hidden">
      <div className="p-3 border-b border-gray-100 font-bold text-gray-900">الإشعارات</div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">لا توجد إشعارات</div>
        ) : (
          notifications.map(n => (
            <button 
              key={n.id} 
              onClick={() => { markAsRead(n.id); onClose(); }} 
              className={`w-full text-right p-3 hover:bg-gray-50 flex items-start gap-3 rounded-xl transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${!n.read ? 'bg-blue-600' : 'bg-transparent'}`} />
              <div className="flex-1">
                <p className={`font-bold ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                    {formatDistanceToNow(n.created_at?.toDate(), { addSuffix: true, locale: arSA })}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
