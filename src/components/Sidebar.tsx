import { MessageSquare, Brain, FileText, Search, Home, X, BookOpen, Video, Youtube, Bookmark, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) {
  const menuItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'الدردشة العامة', path: '/chat', icon: MessageSquare },
    { name: 'الأستاذ الافتراضي', path: '/ai', icon: Brain },
    { name: 'المنشورات', path: '/posts', icon: FileText },
    { name: 'ملاحظاتي', path: '/posts?filter=saved', icon: Bookmark },
    { name: 'الريلز', path: '/reels', icon: Video },
    { name: 'محلل يوتيوب الذكي', path: '/youtube', icon: Youtube },
    { name: 'اختبارات', path: '/quiz', icon: BookOpen },
    { name: 'الملف الشخصي', path: '/profile', icon: User },
    { name: 'البحث', path: '/search', icon: Search },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggle} />
      )}
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-6 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static transition-transform duration-300 font-sans`}>
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold text-blue-400">Bac DZ AI</h1>
          <button onClick={toggle} className="md:hidden p-2 hover:bg-gray-800 rounded"><X /></button>
        </div>
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={toggle}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                  isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon size={22} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
