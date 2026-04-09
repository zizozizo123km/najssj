import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, Sparkles, TrendingUp, BookOpen, Video, FileText, AlertTriangle, X } from 'lucide-react';
import { auth, db, collection, query, orderBy, onSnapshot, doc, deleteDoc, onAuthStateChanged, getDocs, where } from '../lib/firebase';
import FeedCard from '../components/feed/FeedCard';
import Loader from '../components/feed/Loader';
import CreatePostModal from '../components/feed/CreatePostModal';
import MiniProfileModal from '../components/profile/MiniProfileModal';

export default function Dashboard() {
  const [feed, setFeed] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({ summaries: 0, videos: 0, successRate: 0 });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
      if (user) {
        fetchStudentStats(user.uid);
      }
    });

    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        authorId: doc.data().author_id,
        authorName: doc.data().author_name,
        authorAvatar: doc.data().author_avatar
      }));
      setFeed(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const fetchStudentStats = async (userId: string) => {
    try {
      // Fetch summaries
      const summariesSnapshot = await getDocs(query(collection(db, 'summaries'), where('user_id', '==', userId)));
      const summariesCount = summariesSnapshot.size;

      // Fetch videos watched
      const videosSnapshot = await getDocs(query(collection(db, 'watched_videos'), where('user_id', '==', userId)));
      const videosCount = videosSnapshot.size;

      // Fetch quiz sessions
      const quizSnapshot = await getDocs(query(collection(db, 'quiz_sessions'), where('user_id', '==', userId)));
      let totalScore = 0;
      let totalQuestions = 0;
      quizSnapshot.forEach(doc => {
        totalScore += doc.data().score;
        totalQuestions += doc.data().total_questions;
      });
      const successRate = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

      setStats({ summaries: summariesCount, videos: videosCount, successRate });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreatePost = (newPost: any) => {
    // The feed will automatically update via onSnapshot
  };

  const handleDeletePost = async (id: string) => {
    setPostToDelete(id);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("حدث خطأ أثناء حذف المنشور.");
    }
  };

  const handleEditPost = (id: string) => {
    const post = feed.find(p => p.id === id);
    if (post) {
      setEditingPost(post);
      setIsCreateModalOpen(true);
    }
  };

  const filteredFeed = activeFilter === 'all' 
    ? feed 
    : feed.filter(item => item.type === activeFilter);

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 font-sans transition-colors">
      {/* Welcome & Stats */}
      <div className="px-2 pt-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black">مرحباً بك، تلميذنا! 👋</h2>
                <p className="text-xs text-blue-100 font-bold">أنت تتقدم بشكل رائع في مراجعتك.</p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <Sparkles size={24} className="text-yellow-300" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/10">
              <div className="text-center">
                <p className="text-lg font-black">{stats.summaries}</p>
                <p className="text-[10px] text-blue-100 font-bold">ملخصات</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-lg font-black">{stats.videos}</p>
                <p className="text-[10px] text-blue-100 font-bold">فيديوهات</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black">{stats.successRate}%</p>
                <p className="text-[10px] text-blue-100 font-bold">نجاح</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 no-scrollbar">
        <FilterButton 
          active={activeFilter === 'all'} 
          onClick={() => setActiveFilter('all')}
          icon={TrendingUp}
          label="الكل"
        />
        <FilterButton 
          active={activeFilter === 'video'} 
          onClick={() => setActiveFilter('video')}
          icon={Video}
          label="فيديوهات"
        />
        <FilterButton 
          active={activeFilter === 'book'} 
          onClick={() => setActiveFilter('book')}
          icon={BookOpen}
          label="كتب"
        />
        <FilterButton 
          active={activeFilter === 'post'} 
          onClick={() => setActiveFilter('post')}
          icon={FileText}
          label="منشورات"
        />
      </div>

      {/* Feed List */}
      <div className="space-y-6 px-2">
        <AnimatePresence mode="popLayout">
          {filteredFeed.map((item, index) => (
              <FeedCard 
                key={item.id} 
                item={item} 
                onClick={() => console.log('Open', item.id)}
                onDelete={item.authorId === currentUserId ? handleDeletePost : undefined}
                onEdit={item.authorId === currentUserId ? handleEditPost : undefined}
                onAvatarClick={setSelectedUserId}
              />
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setEditingPost(null);
          setIsCreateModalOpen(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 md:hidden"
      >
        <Plus size={32} />
      </motion.button>

      {/* Create/Edit Post Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setTimeout(() => setEditingPost(null), 300); // Clear after animation
        }} 
        onPostCreated={handleCreatePost}
        editPost={editingPost}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPostToDelete(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 z-[80] shadow-2xl border border-transparent dark:border-gray-800"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">حذف المنشور</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium pb-4">
                  هل أنت متأكد أنك تريد حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setPostToDelete(null)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MiniProfileModal 
        userId={selectedUserId || ''} 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
      />
    </div>
  );
}

function FilterButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap shadow-sm border ${
        active 
          ? 'bg-blue-600 text-white border-blue-500 scale-105' 
          : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-500/50'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}
