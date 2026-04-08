import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Send, Video, Loader2, ChevronDown, Smile } from 'lucide-react';
import { auth, db, doc, setDoc, addDoc, collection, serverTimestamp, updateDoc, getDoc } from '../../lib/firebase';
import { uploadFile } from '../../services/uploadService';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
  editPost?: any;
}

const SUBJECTS = ['رياضيات', 'فيزياء', 'علوم', 'أدب', 'فلسفة', 'لغات', 'أخرى'];

export default function CreatePostModal({ isOpen, onClose, onPostCreated, editPost }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && editPost) {
      setContent(editPost.content || '');
      setSubject(editPost.subject || '');
      setMediaPreview(editPost.author_avatar || null); // Note: using avatar as placeholder for media preview in edit
    } else if (isOpen && !editPost) {
      setContent('');
      setSubject('');
      setMedia(null);
      setMediaPreview(null);
      setVideoUrl('');
      setShowUrlInput(false);
    }
  }, [isOpen, editPost]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

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
    const user = auth.currentUser;
    if (!content.trim() || !user) return;

    setIsSubmitting(true);

    try {
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      const profileData = profileDoc.exists() ? profileDoc.data() : null;

      let thumbnailUrl = editPost?.author_avatar || null;
      let isVideoPost = editPost?.type === 'video' || false;

      if (media) {
        thumbnailUrl = await uploadFile(media);
        isVideoPost = media.type.startsWith('video');
      }

      const postData: any = {
        type: isVideoPost ? 'video' : 'post',
        content,
        subject: subject || 'أخرى',
        author_id: user.uid,
        author_name: profileData?.full_name || user.displayName || user.email?.split('@')[0] || 'مستخدم',
        author_avatar: user.photoURL || null,
        thumbnail: thumbnailUrl,
        updated_at: serverTimestamp()
      };

      if (editPost) {
        await updateDoc(doc(db, 'posts', editPost.id), postData);
        if (onPostCreated) onPostCreated({ id: editPost.id, ...postData });
      } else {
        postData.created_at = serverTimestamp();
        postData.likes_count = 0;
        postData.comments_count = 0;
        const docRef = await addDoc(collection(db, 'posts'), postData);
        if (onPostCreated) onPostCreated({ id: docRef.id, ...postData });
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
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl p-6 pb-8 z-[60] md:w-full md:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar border border-transparent dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-800 dark:text-white">{editPost ? 'تعديل المنشور' : 'إنشاء منشور جديد'}</h2>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300"
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
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-10 p-2 grid grid-cols-2 gap-2"
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
                            subject === s ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
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
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="بم تفكر؟ شارك أفكارك، أسئلتك، أو نصائحك مع زملائك..."
                  className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-all text-sm font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-16 right-0 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width={250} height={350} theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'} />
                  </div>
                )}
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
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 focus:border-transparent transition-all text-sm font-medium text-left dir-ltr"
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
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
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
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
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
                    className={`p-2 rounded-xl transition-colors ${showUrlInput ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
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
                      <span>{editPost ? 'جاري التعديل...' : 'جاري النشر...'}</span>
                      <Loader2 size={18} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>{editPost ? 'تعديل' : 'نشر'}</span>
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
