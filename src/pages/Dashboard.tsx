import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, Sparkles, TrendingUp, BookOpen, Video, FileText } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import FeedCard from '../components/feed/FeedCard';
import Loader from '../components/feed/Loader';
import CreatePostModal from '../components/feed/CreatePostModal';

export default function Dashboard() {
  const [feed, setFeed] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeed(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = (newPost: any) => {
    // The feed will automatically update via onSnapshot
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      try {
        await deleteDoc(doc(db, 'posts', id));
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("حدث خطأ أثناء حذف المنشور.");
      }
    }
  };

  const handleEditPost = (id: string) => {
    // In a real app, this would open the modal with the post data
    alert('سيتم إضافة ميزة التعديل قريباً');
  };

  const filteredFeed = activeFilter === 'all' 
    ? feed 
    : feed.filter(item => item.type === activeFilter);

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 font-sans">
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
                <p className="text-lg font-black">12</p>
                <p className="text-[10px] text-blue-100 font-bold">ملخصات</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-lg font-black">25</p>
                <p className="text-[10px] text-blue-100 font-bold">فيديوهات</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black">85%</p>
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
              onDelete={item.authorId === auth.currentUser?.uid ? handleDeletePost : undefined}
              onEdit={item.authorId === auth.currentUser?.uid ? handleEditPost : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 md:hidden"
      >
        <Plus size={32} />
      </motion.button>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onPostCreated={handleCreatePost}
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
          : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}
