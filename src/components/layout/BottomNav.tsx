import { Home, Library, MessageSquare, HelpCircle, User, Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/groups', icon: MessageSquare, label: 'دردشة' },
    { to: '/library', icon: Library, label: 'المكتبة' },
    { to: '/quiz', icon: HelpCircle, label: 'اختبارات' },
    { to: '/profile', icon: User, label: 'بروفايل' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 px-4 py-2 flex items-center justify-around z-50 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)] transition-colors">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 p-2 rounded-xl transition-all
            ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
          `}
        >
          {({ isActive }) => (
            <>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
