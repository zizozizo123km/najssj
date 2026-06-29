import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Award, Filter, Search, Bookmark, AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, collection, query, orderBy, onSnapshot, doc, deleteDoc } from '../lib/firebase';
import CreatePostModal from '../components/feed/CreatePostModal';
import FeedCard from '../components/feed/FeedCard';
import Loader from '../components/feed/Loader';

const SUBJECTS = [
  'الكل', 'ملاحظاتي', 'رياضيات', 'فيزياء', 'لغة عربية', 'تاريخ وجغرافيا', 
  'تربية إسلامية', 'فلسفة', 'لغة ألمانية'
];

export default function Posts() {
  const location = useLocation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [filter, setFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const isHardcodedAdmin = user.email === 'nacero123@gmail.com' || user.email === 'dzs325105@gmail.com';
    if (isHardcodedAdmin) {
      setIsAdmin(true);
    } else {
      const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setIsAdmin(docSnap.data().role === 'admin');
        }
      });
      return () => unsubProfile();
    }
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        authorId: doc.data().author_id,
        authorName: doc.data().author_name,
        authorAvatar: doc.data().author_avatar,
        likesCount: doc.data().likes_count,
        commentsCount: doc.data().comments_count,
        createdAt: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    if (filterParam === 'saved') {
      setFilter('ملاحظاتي');
    }
  }, [location]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesFilter = filter === 'الكل' 
        ? true 
        : filter === 'ملاحظاتي' 
          ? post.saved 
          : post.tags?.includes(filter) || post.subject === filter;
      
      const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [posts, filter, searchQuery]);

  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 3);
  }, [posts]);

  const handleDeletePost = (id: string) => {
    setPostToDelete(id);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleEditPost = (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post) {
      setEditingPost(post);
      setIsCreateModalOpen(true);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar - Filters */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
              <Filter size={20} />
              <span>تصفية حسب المادة</span>
            </div>
            <div className="space-y-1">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                    filter === s ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{s}</span>
                  {s === 'ملاحظاتي' && <Bookmark size={14} className={filter === s ? 'text-white' : 'text-gray-400'} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mobile Search & Filter */}
          <div className="lg:hidden space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="ابحث في المنشورات..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    filter === s ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-100'
                  }`}
                >
                  {s === 'ملاحظاتي' && <Bookmark size={12} />}
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              setEditingPost(null);
              setIsCreateModalOpen(true);
            }}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors text-right"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="font-bold">{user?.displayName?.charAt(0) || 'أ'}</span>
            </div>
            <span className="text-gray-500 font-medium">بم تفكر؟ شارك أفكارك مع زملائك...</span>
          </button>

          <CreatePostModal 
            isOpen={isCreateModalOpen} 
            onClose={() => {
              setIsCreateModalOpen(false);
              setTimeout(() => setEditingPost(null), 300);
            }} 
            editPost={editingPost}
          />

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map(post => (
                <FeedCard 
                  key={post.id} 
                  item={post} 
                  onClick={() => console.log('Open', post.id)}
                  onDelete={post.authorId === user?.uid || isAdmin ? handleDeletePost : undefined}
                  onEdit={post.authorId === user?.uid || isAdmin ? handleEditPost : undefined}
                />
              ))}
            </AnimatePresence>
            
            {filteredPosts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">لا توجد منشورات تطابق بحثك.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Trending & Helpful */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث هنا..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Trending */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
              <TrendingUp size={20} className="text-red-500" />
              <span>منشورات شائعة</span>
            </div>
            <div className="space-y-4">
              {trendingPosts.map(post => (
                <div key={post.id} className="group cursor-pointer">
                  <span className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">{post.subject}</span>
                  <p className="text-xs font-medium text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                    <span>{post.likesCount || 0} إعجاب</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Helpful */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg text-white">
            <div className="flex items-center gap-2 mb-4 font-bold">
              <Award size={20} className="text-yellow-400" />
              <span>الأكثر مساعدة</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed mb-4">
              هنا تجد المنشورات التي حصلت على أعلى تقييم من زملائك لمساعدتهم في المراجعة.
            </p>
            <button className="w-full bg-white text-blue-600 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors">
              تصفح الآن
            </button>
          </div>
        </div>

      </div>

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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-[#120F30] rounded-3xl p-6 z-[80] shadow-2xl border border-transparent dark:border-purple-900/10"
            >
              <div className="flex flex-col items-center text-center space-y-4" dir="rtl">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">حذف المنشور</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium pb-4">
                  هل أنت متأكد أنك تريد حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setPostToDelete(null)}
                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
