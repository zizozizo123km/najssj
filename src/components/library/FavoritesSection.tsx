import { motion } from 'motion/react';
import { Heart, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Book } from '../../types/library';

interface FavoritesSectionProps {
  favorites: Book[];
  onBookClick: (book: Book) => void;
  onRemoveFavorite: (id: number) => void;
}

export default function FavoritesSection({ favorites, onBookClick, onRemoveFavorite }: FavoritesSectionProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
          <Heart size={20} className="text-red-500 md:size-6" fill="currentColor" />
          كتبي المفضلة
        </h2>
        <button className="text-[10px] md:text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
          عرض الكل
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {favorites.map((book) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="flex-shrink-0 w-24 md:w-40 group cursor-pointer"
            onClick={() => onBookClick(book)}
          >
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-gray-50 shadow-sm border border-gray-100 group-hover:shadow-lg group-hover:border-blue-100 transition-all">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFavorite(book.id);
                }}
                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
              >
                <Heart size={10} fill="currentColor" />
              </button>
            </div>
            <h3 className="text-[10px] md:text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {book.title}
            </h3>
            <p className="text-[8px] md:text-[10px] text-gray-400 font-medium">{book.subject}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
