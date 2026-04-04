import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Send, Video, Loader2, ChevronDown } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { uploadFile } from '../../services/uploadService';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

const SUBJECTS = ['رياضيات', 'فيزياء', 'علوم', 'أدب', 'فلسفة', 'لغات', 'أخرى'];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !auth.currentUser) return;

    setIsSubmitting(true);

    try {
      let thumbnailUrl = null;
      let isVideoPost = false;

      if (media) {
        thumbnailUrl = await uploadFile(media);
        isVideoPost = media.type.startsWith('video');
      } else if (videoUrl.trim()) {
        thumbnailUrl = await uploadFile(videoUrl.trim(), 'video');
        isVideoPost = true;
      }

      const newPost = {
        type: isVideoPost ? 'video' : 'post',
        title: subject ? `سؤال في ${subject}` : 'منشور جديد',
        content,
        author: auth.currentUser.displayName || 'مستخدم',
        authorId: auth.currentUser.uid,
        authorAvatar: auth.currentUser.photoURL || null,
        date: new Date().toLocaleDateString('ar-EG'),
        createdAt: Date.now(),
        tags: subject ? [subject] : [],
        thumbnail: thumbnailUrl,
      };

      console.log('Saving post with thumbnail:', typeof thumbnailUrl, thumbnailUrl?.length);

      const docRef = await addDoc(collection(db, 'posts'), newPost);

      if (onPostCreated) {
        onPostCreated({ id: docRef.id, ...newPost });
      }
      
      // Reset state
      setContent('');
      setSubject('');
      setMedia(null);
      setMediaPreview(null);
      setVideoUrl('');
      setShowUrlInput(false);
      onClose();
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('حدث خطأ أثناء نشر المنشور. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-3xl md:rounded-3xl p-6 pb-8 z-[60] md:w-full md:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800">إنشاء منشور جديد</h2>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSubjects(!showSubjects)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700"
                >
                  <span>{subject || 'اختر المادة (اختياري)'}</span>
                  <ChevronDown size={16} className={`transition-transform ${showSubjects ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showSubjects && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-2 grid grid-cols-2 gap-2"
                    >
                      {SUBJECTS.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSubject(s);
                            setShowSubjects(false);
                          }}
                          className={`p-2 text-sm font-bold rounded-lg transition-colors ${
                            subject === s ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="بم تفكر؟ شارك أفكارك، أسئلتك، أو نصائحك مع زملائك..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                  required
                />
              </div>

              {/* Video URL Input */}
              {showUrlInput && !mediaPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="ضع رابط الفيديو هنا (مثال: https://.../video.mp4)"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium text-left dir-ltr"
                  />
                </motion.div>
              )}

              {/* Media Preview */}
              {mediaPreview && (
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video">
                  {media?.type.startsWith('video') ? (
                    <video src={mediaPreview} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMedia(null);
                      setMediaPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, video/mp4"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowUrlInput(false);
                      setVideoUrl('');
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="إضافة صورة أو فيديو من الجهاز"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlInput(!showUrlInput);
                      setMedia(null);
                      setMediaPreview(null);
                    }}
                    className={`p-2 rounded-xl transition-colors ${showUrlInput ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="إضافة رابط فيديو"
                  >
                    <Video size={20} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span>جاري النشر...</span>
                      <Loader2 size={18} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>نشر</span>
                      <Send size={18} className="rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
