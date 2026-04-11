import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book as BookIcon, Filter, LayoutGrid, List, Search, Plus } from 'lucide-react';
import { books as initialBooks } from '../data/books';
import { Book } from '../types/library';
import BookGrid from '../components/library/BookGrid';
import BookCard from '../components/library/BookCard';
import SubjectSelector from '../components/library/SubjectSelector';
import SearchBar from '../components/library/SearchBar';
import PDFViewer from '../components/library/PDFViewer';
import FavoritesSection from '../components/library/FavoritesSection';
import AddBookModal from '../components/library/AddBookModal';
import { db, collection, onSnapshot, query, orderBy } from '../lib/firebase';

export default function Library() {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [firebaseBooks, setFirebaseBooks] = useState<Book[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBooks = snapshot.docs.map(doc => ({
        id: doc.id as any, // Using string ID from Firestore, casting to any to fit Book interface which expects number
        title: doc.data().title,
        subject: doc.data().subject,
        branch: doc.data().branch,
        cover: doc.data().cover,
        pdfUrl: doc.data().pdfUrl,
        author: doc.data().author
      }));
      setFirebaseBooks(fetchedBooks);
    });

    return () => unsubscribe();
  }, []);

  const allBooks = useMemo(() => {
    return [...firebaseBooks, ...initialBooks];
  }, [firebaseBooks]);

  const subjectList = [
    { id: 'sciences', name: 'علوم تجريبية' },
    { id: 'math', name: 'رياضيات' },
    { id: 'technical', name: 'تقني رياضي' },
    { id: 'arts', name: 'آداب وفلسفة' },
    { id: 'humanities', name: 'تسيير واقتصاد' },
    { id: 'languages', name: 'لغات أجنبية' },
  ];

  const favoriteBooks = useMemo(() => {
    return allBooks.filter((book) => favorites.includes(book.id));
  }, [favorites, allBooks]);

  const filteredBooks = useMemo(() => {
    return allBooks.filter((book) => {
      const matchesSubject = selectedSubject === 'all' || book.branch === selectedSubject;
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [selectedSubject, searchQuery, allBooks]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleBookClick = (book: Book) => {
    if (book.pdfUrl.includes('/drive/folders/')) {
      window.open(book.pdfUrl, '_blank');
    } else {
      setSelectedBook(book);
    }
  };

  return (
    <div className="min-h-full bg-gray-50/50 pb-20" dir="rtl">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-100 md:sticky md:top-0 z-30 px-4 py-4 md:px-8 -mx-4 -mt-4 mb-4">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="space-y-0.5 md:space-y-1">
              <h1 className="text-lg md:text-3xl font-black text-gray-900 flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
                  <BookIcon size={18} className="md:size-6" />
                </div>
                <span className="break-words">المكتبة الرقمية</span>
              </h1>
              <p className="text-gray-500 text-[10px] md:text-sm font-medium">
                تصفح وحمل الكتب المدرسية لجميع الشعب
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                className="flex-1 md:w-80"
              />
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-colors shrink-0"
              >
                <Plus size={20} />
                <span className="hidden md:inline">إضافة كتاب</span>
              </button>
            </div>
          </div>

          <SubjectSelector 
            selectedSubject={selectedSubject} 
            onSelect={setSelectedSubject} 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 md:px-8">
        <div className="space-y-8 md:space-y-12">
          <FavoritesSection 
            favorites={favoriteBooks} 
            onBookClick={handleBookClick} 
            onRemoveFavorite={toggleFavorite} 
          />

          {selectedSubject === 'all' && !searchQuery ? (
            // Netflix Style Rows for "All" view
            <div className="space-y-8">
              {subjectList.map((subject) => {
                const subjectBooks = allBooks.filter(b => b.branch === subject.id);
                if (subjectBooks.length === 0) return null;
                return (
                  <div key={subject.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm md:text-lg font-black text-gray-900 px-1">
                        {subject.name}
                      </h2>
                    </div>
                    <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
                      {subjectBooks.map((book) => (
                        <div key={book.id} className="w-32 md:w-48 shrink-0">
                          <BookCard
                            book={book}
                            onClick={() => handleBookClick(book)}
                            isFavorite={favorites.includes(book.id)}
                            onToggleFavorite={(e) => {
                              e.stopPropagation();
                              toggleFavorite(book.id);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Standard Grid for specific subject or search
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {filteredBooks.length} كتاب متوفر
                  </span>
                </div>
              </div>

              <BookGrid 
                books={filteredBooks} 
                onBookClick={handleBookClick}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          )}
        </div>
      </main>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {selectedBook && (
          <PDFViewer
            url={selectedBook.pdfUrl}
            title={selectedBook.title}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>

      <AddBookModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Mobile Navigation Spacer */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
