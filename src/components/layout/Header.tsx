import { useState, useEffect } from 'react';
import { Search, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, onAuthStateChanged } from '../../lib/firebase';

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export default function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm shrink-0">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
        >
          <Menu size={22} className="text-gray-700" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">BAC</span>
          </div>
          <h1 className="font-black text-xl tracking-tighter text-gray-900 hidden sm:block">Bac DZ AI</h1>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onSearchClick}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
        >
          <Search size={22} />
        </button>
        <Link 
          to="/profile"
          className="w-9 h-9 rounded-full border-2 border-blue-50 overflow-hidden shadow-sm hover:scale-105 transition-transform"
        >
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
            alt="Profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </Link>
      </div>
    </header>
  );
}
