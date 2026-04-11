import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Link as LinkIcon, Book as BookIcon, User, Tag, Image as ImageIcon } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadFile } from '../../services/uploadService';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('sciences');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const branches = [
    { id: 'sciences', name: 'علوم تجريبية' },
    { id: 'math', name: 'رياضيات' },
    { id: 'technical', name: 'تقني رياضي' },
    { id: 'arts', name: 'آداب وفلسفة' },
    { id: 'humanities', name: 'تسيير واقتصاد' },
    { id: 'languages', name: 'لغات أجنبية' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pdfUrl) return;

    setIsSubmitting(true);
    try {
      let finalCoverUrl = coverUrl;
      
      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile, 'image');
      }

      await addDoc(collection(db, 'books'), {
        title,
        author: author || 'غير معروف',
        subject: subject || 'عام',
        branch,
        cover: finalCoverUrl || `https://picsum.photos/seed/${Math.random()}/400/600`,
        pdfUrl,
        createdAt: serverTimestamp()
      });
      onClose();
      // Reset form
      setTitle('');
      setAuthor('');
      setSubject('');
      setBranch('sciences');
      setCoverUrl('');
      setCoverFile(null);
      setPdfUrl('');
    } catch (error) {
      console.error("Error adding book:", error);
      alert("حدث خطأ أثناء إضافة الكتاب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Upload size={24} className="text-blue-600" />
              إضافة كتاب جديد
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <BookIcon size={16} />
                اسم الكتاب *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="مثال: كتاب المغني في الرياضيات"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <User size={16} />
                المؤلف
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="اسم المؤلف"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Tag size={16} />
                  المادة
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="مثال: رياضيات"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  الشعبة
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <ImageIcon size={16} />
                صورة الغلاف
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-600"
                  >
                    <Upload size={18} />
                    <span className="truncate max-w-[200px]">
                      {coverFile ? coverFile.name : 'رفع صورة من الجهاز'}
                    </span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                  <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></span>
                  <span>أو</span>
                  <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></span>
                </div>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => {
                    setCoverUrl(e.target.value);
                    if (e.target.value) setCoverFile(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white text-left"
                  placeholder="رابط صورة الغلاف (https://...)"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <LinkIcon size={16} />
                رابط ملف PDF *
              </label>
              <input
                type="url"
                required
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white text-left"
                placeholder="https://..."
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة الكتاب'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
