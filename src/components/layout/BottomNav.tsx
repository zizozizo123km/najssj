import { Home, Library, BookOpen, Calendar, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const navItems = [
    { to: '/profile', icon: User, label: 'الملف الشخصي' },
    { to: '/planner', icon: Calendar, label: 'الجدول' },
    { to: '/courses', icon: BookOpen, label: 'الدروس' },
    { to: '/library', icon: Library, label: 'المكتبة' },
    { to: '/', icon: Home, label: 'الرئيسية' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-100/80 dark:border-gray-900/80 px-4 py-2 flex items-center justify-around z-50 md:hidden shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.3)] transition-all rounded-t-3xl border-x">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-2xl transition-all duration-300 relative
            ${isActive ? 'text-blue-600 dark:text-blue-400 scale-105 font-bold bg-blue-50/50 dark:bg-blue-950/40' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
          `}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-1 right-3.5 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
              )}
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

