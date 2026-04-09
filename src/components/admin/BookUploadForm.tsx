import { useState, useRef } from 'react';
import { db, collection, addDoc, serverTimestamp } from '../../lib/firebase';
import { uploadFile } from '../../services/uploadService';
import { Book, Upload, Link as LinkIcon, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';

export default function BookUploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [sourceType, setSourceType] = useState<'file' | 'url'>('file');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const SUBJECTS = ['رياضيات', 'فيزياء', 'علوم', 'أدب', 'فلسفة', 'لغات', 'تاريخ', 'جغرافيا', 'أخرى'];

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || (sourceType === 'file' && !pdfFile) || (sourceType === 'url' && !pdfUrl) || !coverImage) {
      alert('يرجى ملء جميع الحقول المطلوبة واختيار صورة الغلاف');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Cover Image to Cloudinary
      const coverUrl = await uploadFile(coverImage, 'image');

      // 2. Handle PDF (Upload if file, use URL if link)
      let finalPdfUrl = pdfUrl;
      if (sourceType === 'file' && pdfFile) {
        finalPdfUrl = await uploadFile(pdfFile, 'raw');
      }

      // 3. Save to Firestore
      await addDoc(collection(db, 'posts'), {
        type: 'book',
        title,
        content: description,
        subject,
        thumbnail: coverUrl,
        pdf_url: finalPdfUrl,
        author_name: 'الإدارة',
        author_id: 'admin',
        created_at: serverTimestamp(),
        likes_count: 0,
        comments_count: 0,
        tags: [subject, 'كتب']
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setDescription('');
        setSubject('');
        setPdfFile(null);
        setPdfUrl('');
        setCoverImage(null);
        setCoverPreview(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error uploading book:', error);
      alert(`حدث خطأ أثناء رفع الكتاب: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-600/20 p-2 rounded-xl">
          <Book className="text-blue-500 w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-white">إضافة كتاب جديد</h2>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-green-500/20 p-4 rounded-full mb-4">
            <CheckCircle className="text-green-500 w-12 h-12 animate-bounce" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">تم الرفع بنجاح!</h3>
          <p className="text-gray-400">تمت إضافة الكتاب إلى المكتبة بنجاح.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side: Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">عنوان الكتاب</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="مثال: ملخص الفيزياء للبكالوريا"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">المادة</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">اختر المادة</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">وصف قصير</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-24 bg-gray-900 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="اكتب وصفاً بسيطاً للكتاب..."
                />
              </div>
            </div>

            {/* Right Side: Cover Preview */}
            <div className="flex flex-col items-center justify-center">
              <label className="block text-gray-400 text-sm font-bold mb-2 w-full text-right">صورة الغلاف</label>
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="w-full aspect-[3/4] bg-gray-900 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden relative group"
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ImageIcon className="text-white w-8 h-8" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-xs font-bold">اضغط لرفع صورة</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={coverInputRef} 
                onChange={handleCoverChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          {/* PDF Source Selection */}
          <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
            <label className="block text-gray-400 text-sm font-bold mb-4">مصدر ملف PDF</label>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setSourceType('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${sourceType === 'file' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                <Upload size={18} />
                <span>رفع ملف</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${sourceType === 'url' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                <LinkIcon size={18} />
                <span>رابط خارجي</span>
              </button>
            </div>

            {sourceType === 'file' ? (
              <div 
                onClick={() => pdfInputRef.current?.click()}
                className="w-full py-8 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-all"
              >
                <Upload className={`w-8 h-8 mb-2 ${pdfFile ? 'text-green-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-bold ${pdfFile ? 'text-white' : 'text-gray-400'}`}>
                  {pdfFile ? pdfFile.name : 'اختر ملف PDF من جهازك'}
                </span>
                <input 
                  type="file" 
                  ref={pdfInputRef} 
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)} 
                  accept=".pdf" 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 transition-colors text-left dir-ltr"
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-[10px] text-gray-500 font-bold px-1">
                  * سيتم حفظ الرابط مباشرة في قاعدة البيانات دون رفعه لـ Cloudinary.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>جاري الرفع والمعالجة...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>نشر الكتاب في المكتبة</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
