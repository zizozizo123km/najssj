import { motion } from 'motion/react';
import { Heart, Star, BookOpen, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Book } from '../../types/library';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isFavorite: boolean;
}

export default function BookCard({ book, onClick, onToggleFavorite, isFavorite }: BookCardProps) {
  // Generate a consistent pseudo-random rating between 4.4 and 4.9 based on title length
  const rating = (4.4 + ((book.title.length * 3) % 6) / 10).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-md border border-gray-100 hover:shadow-xl hover:border-blue-500/30 transition-all group flex flex-col h-full cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-gray-50 shadow-inner">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Rating overlay pill precisely like the screenshot */}
        <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-gray-950/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm text-[10px] font-black text-gray-800 dark:text-white">
          <Star size={10} fill="currentColor" className="text-yellow-400" />
          <span>{rating}</span>
        </div>

        {/* Favorite circle button overlay */}
        <div className="absolute top-2 right-2">
          <button
            onClick={onToggleFavorite}
            className={cn(
              "p-2 rounded-full backdrop-blur-md border shadow-sm transition-all hover:scale-110 active:scale-95",
              isFavorite
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white/80 dark:bg-gray-950/80 border-gray-200/50 text-gray-700 hover:bg-white"
            )}
          >
            <Heart size={12} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-wider text-blue-600 dark:text-blue-400">
            {book.subject}
          </span>
          <h3 className="text-[12px] font-black text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {book.title}
          </h3>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-[11px] rounded-xl shadow-lg shadow-blue-600/10 dark:shadow-blue-600/5 flex items-center justify-center gap-1.5 transition-all text-center"
        >
          <BookOpen size={12} />
          اقرأ الآن
        </button>
      </div>
    </motion.div>
  );
}

