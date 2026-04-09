import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, BookOpen, FileText, MoreVertical, Trash2, Edit2, Send, Smile } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { auth, db, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, getDocs, setDoc, getDoc } from '../../lib/firebase';
import ActionButtons from './ActionButtons';

interface FeedCardProps {
  item: {
    id: string;
    type: 'video' | 'book' | 'post';
    title: string;
    content: string;
    authorName: string;
    authorId?: string;
    authorAvatar?: string;
    thumbnail?: string;
    pdf_url?: string;
    date: string;
    tags?: string[];
  };
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAvatarClick?: (uid: string) => void;
}

export default function FeedCard({ item, onClick, onDelete, onEdit, onAvatarClick }: FeedCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleEmojiClick = (emojiObject: any) => { 
    setNewComment(prev => prev + emojiObject.emoji); 
    setShowEmojiPicker(false); 
  };

  const user = auth.currentUser;

  useEffect(() => {
    if (!item.id) return;

    // Subscribe to likes
    const likesQuery = collection(db, 'posts', item.id, 'likes');
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      setLikesCount(snapshot.size);
      if (user) {
        setIsLikedByMe(snapshot.docs.some(doc => doc.id === user.uid));
      }
    });

    // Subscribe to comments
    const commentsQuery = query(collection(db, 'posts', item.id, 'comments'), orderBy('created_at', 'asc'));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        authorName: doc.data().author_name,
        authorAvatar: doc.data().author_avatar,
        createdAt: doc.data().created_at
      }));
      setComments(commentsData);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [item.id, user]);

  const handleLike = async () => {
    if (!user) return alert('يجب تسجيل الدخول أولاً');
    
    try {
      const likeRef = doc(db, 'posts', item.id, 'likes', user.uid);
      if (isLikedByMe) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          user_id: user.uid,
          created_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      const profileData = profileDoc.exists() ? profileDoc.data() : null;

      await addDoc(collection(db, 'posts', item.id, 'comments'), {
        user_id: user.uid,
        author_name: profileData?.full_name || user.displayName || user.email?.split('@')[0] || 'مستخدم',
        author_avatar: profileData?.avatar_url || user.photoURL || null,
        content: newComment.trim(),
        created_at: serverTimestamp()
      });
      
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
      alert('حدث خطأ أثناء إضافة التعليق');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100/50 dark:border-gray-800 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-visible"
    >
      {/* Type Badge */}
      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider z-10 flex items-center gap-1.5 shadow-sm ${
        item.type === 'video' ? 'bg-red-500 text-white' : 
        item.type === 'book' ? 'bg-blue-500 text-white' : 
        'bg-green-500 text-white'
      }`}>
        {item.type === 'video' ? <Play size={10} fill="currentColor" /> : 
         item.type === 'book' ? <BookOpen size={10} /> : 
         <FileText size={10} />}
        {item.type === 'video' ? 'فيديو' : item.type === 'book' ? 'كتاب' : 'منشور'}
      </div>

      {/* Author Info & Menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full border-2 border-gray-50 dark:border-gray-800 overflow-hidden shadow-sm cursor-pointer"
            onClick={() => item.authorId && onAvatarClick?.(item.authorId)}
          >
            <img 
              src={item.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.authorName}`} 
              alt={item.authorName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white">{item.authorName}</h4>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{item.date}</p>
          </div>
        </div>

        {/* Options Menu */}
        {(onDelete || onEdit) && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <MoreVertical size={18} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute left-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-20"
                  >
                    {onEdit && (
                      <button 
                        onClick={() => { setShowMenu(false); onEdit(item.id); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Edit2 size={14} />
                        <span className="font-bold">تعديل</span>
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => { setShowMenu(false); onDelete(item.id); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span className="font-bold">حذف</span>
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <div onClick={onClick} className="cursor-pointer space-y-3">
        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {item.title}
        </h3>
        
        {item.thumbnail && (
          <div 
            className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner group-hover:shadow-lg transition-all"
            onClick={(e) => {
              if (item.type === 'video') {
                e.stopPropagation(); // Prevent card click when interacting with video
              }
            }}
          >
            {item.type === 'video' ? (
              <video 
                src={item.thumbnail} 
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
            ) : (
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 font-medium">
          {item.content}
        </p>

        {item.tags && (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.tags.map(tag => (
              <span key={tag} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <ActionButtons 
        type={item.type}
        likesCount={likesCount}
        commentsCount={comments.length}
        isLiked={isLikedByMe}
        onLike={handleLike}
        onComment={() => setShowComments(!showComments)}
        onAnalyze={() => {
          if (item.type === 'book' && item.pdf_url) {
            window.open(item.pdf_url, '_blank');
          } else {
            console.log('Analyze', item.id);
          }
        }}
        onTest={() => console.log('Test', item.id)}
      />

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4 pt-4 border-t border-gray-50 dark:border-gray-800"
          >
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-gray-400 font-medium py-4">لا توجد تعليقات بعد. كن أول من يعلق!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <img 
                      src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorName}`} 
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 object-cover cursor-pointer"
                      referrerPolicy="no-referrer"
                      onClick={() => comment.user_id && onAvatarClick?.(comment.user_id)}
                    />
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 rounded-tr-none border border-transparent dark:border-gray-800">
                      <h5 className="text-xs font-black text-gray-900 dark:text-white mb-1">{comment.authorName}</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 relative">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="اكتب تعليقاً..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/50 transition-all font-medium"
              />
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-50">
                  <EmojiPicker 
                    onEmojiClick={handleEmojiClick} 
                    width={250} 
                    height={350} 
                    theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} 
                  />
                </div>
              )}
              <button 
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={18} className="rotate-180" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
