import { Search, Settings, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChatList() {
  const navigate = useNavigate();
  const [chats] = useState([
    { id: 1, name: 'رياضيات 1L', lastMessage: 'Younes: هل تم حل التمرين؟', unread: 9, avatar: 'https://picsum.photos/seed/math/100/100' },
    { id: 2, name: 'فيزياء 2L', lastMessage: 'أنت: شكراً جزيلاً', unread: 0, avatar: 'https://picsum.photos/seed/physics/100/100' },
    { id: 3, name: 'فلسفة 3L', lastMessage: 'Marwa: مقال الحرية جاهز', unread: 2, avatar: 'https://picsum.photos/seed/phil/100/100' },
    { id: 4, name: 'علوم 1L', lastMessage: 'أنت: متى الفرض؟', unread: 0, avatar: 'https://picsum.photos/seed/bio/100/100' },
  ]);

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الرسائل</h1>
        <div className="flex gap-2">
          <button className="p-2 bg-gray-100 rounded-full"><Search size={20} /></button>
          <button className="p-2 bg-gray-100 rounded-full"><Settings size={20} /></button>
        </div>
      </div>

      {/* Chat List */}
      <div className="space-y-4">
        {chats.map(chat => (
          <div 
            key={chat.id} 
            onClick={() => navigate(`/chat/${chat.id}`)}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
          >
            <img src={chat.avatar} alt={chat.name} className="w-14 h-14 rounded-full" referrerPolicy="no-referrer" />
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-bold">{chat.name}</h3>
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
            </div>
            {chat.unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{chat.unread}</span>
            )}
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg">
        <Plus size={24} />
      </button>
    </div>
  );
}
