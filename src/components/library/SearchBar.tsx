import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SearchBar({ value, onChange, className }: SearchBarProps) {
  return (
    <div className={cn("relative group", className)} dir="rtl">
      <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
      <div className="relative flex items-center bg-white p-1 rounded-2xl shadow-sm border border-gray-100 group-focus-within:border-blue-200 group-focus-within:shadow-md transition-all">
        <Search className="absolute right-4 text-gray-400" size={20} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ابحث عن كتاب أو مادة..."
          className="w-full pr-12 pl-4 py-3 bg-transparent outline-none text-gray-800 font-medium text-sm text-right"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
