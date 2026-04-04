import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Award, Filter, Search, Bookmark } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
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

  const [filter, setFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
          ? post.saved // Note: saved functionality might need real implementation later
          : post.tags?.includes(filter) || post.subject === filter;
      
      const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.author?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [posts, filter, searchQuery]);

  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 3);
  }, [posts]);

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
              <span className="font-bold">{auth.currentUser?.displayName?.charAt(0) || 'أ'}</span>
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
                  onDelete={post.authorId === auth.currentUser?.uid ? handleDeletePost : undefined}
                  onEdit={post.authorId === auth.currentUser?.uid ? handleEditPost : undefined}
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
    </div>
  );
}
