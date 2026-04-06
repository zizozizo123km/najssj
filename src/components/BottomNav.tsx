import React from 'react';
import { Home, Calendar, PlayCircle, BookOpen, LayoutGrid, MessageSquare, User } from 'lucide-react';
import { motion } from 'motion/react';

export type NavItem = 'home' | 'planner' | 'videos' | 'library' | 'quiz' | 'chat' | 'profile';

interface BottomNavProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeItem, onNavigate }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'planner', icon: Calendar, label: 'Planner' },
    { id: 'videos', icon: PlayCircle, label: 'Videos' },
    { id: 'library', icon: BookOpen, label: 'Library' },
    { id: 'quiz', icon: LayoutGrid, label: 'Quiz' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 max-w-4xl mx-auto">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center gap-1 p-2 transition-all duration-300 rounded-xl
                ${isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
