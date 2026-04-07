import { useState, useEffect } from 'react';
import { MessageSquare, Brain, FileText, Search, Home, X, BookOpen, Video, Youtube, Bookmark, User as UserIcon, Library, LogOut, MoreVertical, Calendar } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged, signOut } from '../lib/firebase';

export default function Sidebar({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { name: 'الرئيسية', path: '/', icon: Home },
    { name: 'مجموعات الدراسة', path: '/groups', icon: MessageSquare },
    { name: 'الأستاذ الافتراضي', path: '/ai', icon: Brain },
    { name: 'المنشورات', path: '/posts', icon: FileText },
    { name: 'المكتبة', path: '/library', icon: Library },
    { name: 'ملاحظاتي', path: '/posts?filter=saved', icon: Bookmark },
    { name: 'محلل يوتيوب الذكي', path: '/youtube', icon: Youtube },
    { name: 'اختبارات', path: '/quiz', icon: BookOpen },
    { name: 'جدول الدراسة', path: '/planner', icon: Calendar },
    { name: 'الملف الشخصي', path: '/profile', icon: UserIcon },
  ];

  return (
    <>
      {/* Three-dot button for mobile */}
      {!isOpen && (
        <button 
          onClick={toggle} 
          className="fixed top-4 left-4 z-40 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-gray-800 md:hidden"
        >
          <MoreVertical size={24} />
        </button>
      )}

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggle} />
      )}
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-6 flex flex-col transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static transition-transform duration-300 font-sans`}>
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold text-blue-400">Bac DZ AI</h1>
          <button onClick={toggle} className="md:hidden p-2 hover:bg-gray-800 rounded"><X /></button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto scrollbar-none">
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

        {/* User Profile Section at Bottom */}
        {user && (
          <div className="mt-auto pt-6 border-t border-gray-800 space-y-4">
            <NavLink 
              to="/profile"
              onClick={toggle}
              className="flex items-center gap-3 px-2 hover:bg-gray-800 p-2 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/30 flex-shrink-0 group-hover:border-blue-500 transition-all">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate group-hover:text-blue-400 transition-all">{user.displayName || 'مستخدم جديد'}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
            </NavLink>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span className="text-sm font-bold">تسجيل الخروج</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
