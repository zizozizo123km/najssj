import { motion } from 'motion/react';
import { Heart, Bookmark, BookOpen, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Book } from '../../types/library';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isFavorite: boolean;
}

export default function BookCard({ book, onClick, onToggleFavorite, isFavorite }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl p-2 md:p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-50 shadow-inner">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            onClick={onToggleFavorite}
            className={cn(
              "p-2 rounded-full backdrop-blur-md border transition-all hover:scale-110",
              isFavorite
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : "bg-black/20 border-white/10 text-white hover:bg-black/40"
            )}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {book.subject}
          </span>
        </div>
      </div>

      <div className="space-y-1 md:space-y-2">
        <h3 className="text-[10px] md:text-sm font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] text-gray-400 font-medium">
          <User size={10} className="md:size-3" />
          <span className="line-clamp-1">{book.author}</span>
        </div>
        <div className="flex items-center justify-between pt-1 md:pt-2">
          <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-blue-600 font-bold">
            <BookOpen size={10} className="md:size-3" />
            <span>قراءة</span>
          </div>
          <div className="text-[8px] md:text-[10px] text-gray-400 font-medium">
            {book.branch}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
