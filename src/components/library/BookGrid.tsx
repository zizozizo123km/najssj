import { Book } from '../../types/library';
import BookCard from './BookCard';

interface BookGridProps {
  books: Book[];
  onBookClick: (book: Book) => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
}

export default function BookGrid({ books, onBookClick, favorites, onToggleFavorite }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
          <span className="text-4xl">📚</span>
        </div>
        <p className="text-sm font-medium">لا توجد كتب متوفرة حالياً لهذه الشعبة</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onClick={() => onBookClick(book)}
          isFavorite={favorites.includes(book.id)}
          onToggleFavorite={(e) => {
            e.stopPropagation();
            onToggleFavorite(book.id);
          }}
        />
      ))}
    </div>
  );
}
