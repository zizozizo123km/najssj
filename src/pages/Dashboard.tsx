import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, Play, Sparkles, TrendingUp, BookOpen, Video, FileText, 
  AlertTriangle, Plus, Trophy, Medal, Star, Flame, Calendar, User, Download, GraduationCap 
} from 'lucide-react';
import { auth, db, collection, query, orderBy, onSnapshot, doc, deleteDoc, onAuthStateChanged, getDocs, where, limit } from '../lib/firebase';
import FeedCard from '../components/feed/FeedCard';
import Loader from '../components/feed/Loader';
import CreatePostModal from '../components/feed/CreatePostModal';
import ProfilePreview from '../components/profile/ProfilePreview';

import BacCountdown from '../components/BacCountdown';

export default function Dashboard() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({ summaries: 0, videos: 0, successRate: 0, points: 0, level: 'مبتدئ' });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid ?? null);
      if (user) {
        fetchStudentStats(user.uid);
        
        // Listen to active user's profile
        const unsubProfile = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        });
        return () => unsubProfile();
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

    // Fetch Leaderboard for Honor Roll
    const fetchLeaderboard = async () => {
      try {
        const lbQuery = query(collection(db, 'profiles'), orderBy('points', 'desc'), limit(10));
        const lbSnapshot = await getDocs(lbQuery);
        const lbData = lbSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaderboard(lbData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };
    fetchLeaderboard();

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const fetchStudentStats = async (userId: string) => {
    try {
      const summariesSnapshot = await getDocs(query(collection(db, 'summaries'), where('user_id', '==', userId)));
      const summariesCount = summariesSnapshot.size;

      const videosSnapshot = await getDocs(query(collection(db, 'watched_videos'), where('user_id', '==', userId)));
      const videosCount = videosSnapshot.size;

      const quizSnapshot = await getDocs(query(collection(db, 'quiz_sessions'), where('user_id', '==', userId)));
      let totalScore = 0;
      let totalQuestions = 0;
      quizSnapshot.forEach(doc => {
        totalScore += doc.data().score;
        totalQuestions += doc.data().total_questions;
      });
      const successRate = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

      const profileDoc = await getDocs(query(collection(db, 'profiles'), where('__name__', '==', userId)));
      let points = 0;
      let level = 'مبتدئ';
      if (!profileDoc.empty) {
        const pData = profileDoc.docs[0].data();
        points = pData.points || 0;
        level = pData.level || 'مبتدئ';
      }

      setStats({ summaries: summariesCount, videos: videosCount, successRate, points, level });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreatePost = (newPost: any) => {};

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

  // Fallback demo highlight video list in case no posts are tagged as videos loaded yet
  const fallbackVideos = [
    {
      id: 'vid-1',
      title: 'مراجعة الميكانيك وحل باكالوريا سابقة بامتياز',
      author: 'الأستاذ خالد فيزياء',
      duration: '12:45m',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
      views: '3.4K'
    },
    {
      id: 'vid-2',
      title: 'أسرار كتابة مقالة فلسفية ممتازة للعلامة الكاملة',
      author: 'الاستاذة سارة فلسفة',
      duration: '7:10m',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      views: '1.2K'
    }
  ];

  if (loading) return <Loader />;

  return (
    <div className="max-w-md md:max-w-7xl mx-auto min-h-screen bg-[#F3F7FA] dark:bg-gray-950 pb-28 md:pb-12 font-sans transition-colors relative antialiased px-4 md:px-8" dir="rtl">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        
        {/* Main Content Column (Takes 8 of 12 columns on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Header Area with Notification & Profile details */}
          <header className="py-2 flex items-center justify-between md:bg-white md:dark:bg-gray-900 md:p-5 md:rounded-3xl md:shadow-sm md:border md:border-gray-100 md:dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-lg">
                    {profile?.full_name?.charAt(0) || 'أ'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-[17px] font-black text-gray-900 dark:text-white leading-tight">
                  {profile?.full_name || 'تلميذنا البطل'}
                </h2>
                <p className="text-xs text-gray-500 font-semibold dark:text-gray-400">الرئيسية</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/notifications')} 
              className="w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-sm relative group active:scale-95 transition-transform border border-gray-100 dark:border-gray-800"
            >
              <Bell size={20} className="text-gray-700 dark:text-gray-300 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
            </button>
          </header>

          {/* 2. Baccalaureate Countdown Timer */}
          <section className="my-4">
            <BacCountdown />
          </section>

          {/* 6. "الجدول" (Sleek Grid Navigation / Quick Cards) - Moved up for high-fidelity PC preview */}
          <section className="mt-4">
            <div className="mb-3 text-right">
              <h3 className="font-black text-gray-900 dark:text-white text-[15px]">الجدول والأقسام</h3>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Link 
                to="/past-exams" 
                className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-emerald-800 dark:text-emerald-300 block">المواضيع السابقة</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">ملخص والامتحانات</span>
                </div>
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Download size={18} />
                </div>
              </Link>

              <Link 
                to="/posts" 
                className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-indigo-800 dark:text-indigo-300 block">المنشورات</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">مشاركة ومساعدة</span>
                </div>
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <FileText size={18} />
                </div>
              </Link>

              <Link 
                to="/quiz" 
                className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-amber-800 dark:text-amber-300 block">الاختبارات</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">تحقق من مستواك</span>
                </div>
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                  <GraduationCap size={18} />
                </div>
              </Link>

              <Link 
                to="/youtube" 
                className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 hover:-translate-y-1 transition-transform group flex items-start justify-between"
              >
                <div className="space-y-1 text-right">
                  <span className="text-[12px] font-black text-rose-800 dark:text-rose-300 block">اليوتيوب</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">مساعد الفيديو الذكي</span>
                </div>
                <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                  <Play size={18} />
                </div>
              </Link>
            </div>
          </section>

          {/* 3. "لوحة الشرف" Honor Roll (Leaderboard horizontally on mobile, sidebar list on PC) */}
          <section className="mt-6 mb-4 lg:hidden">
            <div className="flex items-center justify-between mb-3 text-right">
              <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-[15px]">
                <Trophy size={16} className="text-yellow-500" />
                لوحة الشرف للأبطال
              </h3>
              <span className="text-xs text-blue-600 font-extrabold hover:underline cursor-pointer">لوحة 15</span>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 overflow-x-auto scrollbar-none py-4">
              {leaderboard.map((user, idx) => {
                const indexStr = idx === 0 ? '1 العلمي' : idx === 1 ? '2 ثلافي' : idx === 2 ? '3 الحرب' : `${idx + 1} بطل`;
                const badgeColor = idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-blue-500';

                return (
                  <div 
                    key={user.id} 
                    onClick={() => setPreviewUserId(user.id)}
                    className="flex flex-col items-center text-center cursor-pointer min-w-[70px] group relative"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-gray-900 shadow-md transform group-hover:scale-105 transition-transform bg-gray-100">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-base">
                            {user.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      {/* Top Rank Badge */}
                      <span className={`absolute -bottom-1.5 -left-1 text-[8px] font-black text-white ${badgeColor} px-1.5 py-0.5 rounded-full shadow border border-white dark:border-gray-900 whitespace-nowrap`}>
                        {indexStr}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-2.5 truncate max-w-[65px]">
                      {user.full_name?.split(' ')[0] || 'مستخدم'}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">{user.points || 0} XP</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Filter Button tabs */}
          <section className="mt-6 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <FilterButton 
                active={activeFilter === 'all'} 
                onClick={() => setActiveFilter('all')}
                icon={TrendingUp}
                label="الكل/فيديوهات..."
              />
              <FilterButton 
                active={activeFilter === 'post'} 
                onClick={() => setActiveFilter('post')}
                icon={FileText}
                label="المنشورات"
              />
              <FilterButton 
                active={activeFilter === 'video'} 
                onClick={() => setActiveFilter('video')}
                icon={Video}
                label="الفروق"
              />
            </div>
          </section>

          {/* 5. Custom HIGHLIGHT / VIDEOS list ("مميّز مستمر") */}
          {activeFilter === 'all' && (
            <section className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                {fallbackVideos.map((video) => (
                  <div 
                    key={video.id} 
                    onClick={() => navigate('/youtube')}
                    className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group cursor-pointer"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        {video.duration}
                      </span>
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-blue-600 scale-90 group-hover:scale-100 transition-transform">
                          <Play size={14} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {video.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{video.author}</span>
                        <span>{video.views} مشاهدة</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dynamic Filtered Posts Feed */}
          {activeFilter === 'post' && (
            <section className="space-y-4 mb-6">
              <AnimatePresence mode="popLayout">
                {filteredFeed.length > 0 ? (
                  filteredFeed.map((item) => (
                    <FeedCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => console.log('Open', item.id)}
                      onDelete={item.authorId === currentUserId ? handleDeletePost : undefined}
                      onEdit={item.authorId === currentUserId ? handleEditPost : undefined}
                    />
                  ))
                ) : (
                  <div className="text-center bg-white dark:bg-gray-900 py-12 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400 text-sm">
                    لا توجد منشورات متاحة حالياً
                  </div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>

        {/* Sidebar/Left Column (Takes 4 of 12 columns, hidden on mobile, excellent for PC layout) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">
          {/* Stats card */}
          <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="font-extrabold text-[#1E293B] dark:text-gray-150 text-base">مستوى التقدم الدراسي</h3>
                <p className="text-xs text-gray-400 font-bold">المستوى الحالي: {stats.level}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F8FAFC] dark:bg-gray-950 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-900 shadow-sm">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.points}</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black mt-1">النقاط بالكامل (XP)</p>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-gray-950 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-900 shadow-sm">
                <span className="text-2xl font-black text-emerald-500">{stats.successRate}%</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black mt-1">نسبة النجاح بالاختبار</p>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-gray-950 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-900 shadow-sm">
                <span className="text-2xl font-black text-indigo-500">{stats.summaries}</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black mt-1">ملخصاتك الدراسية</p>
              </div>
              <div className="bg-[#F8FAFC] dark:bg-gray-950 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-900 shadow-sm">
                <span className="text-2xl font-black text-rose-500">{stats.videos * 2 + 10}</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black mt-1">ساعات المراجعة</p>
              </div>
            </div>
          </div>

          {/* Vertical Leaderboard list */}
          <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                <Trophy size={18} className="text-yellow-500 animate-bounce" />
                المتصدرون في لوحة الشرف
              </h3>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((user, idx) => {
                const rankBadgeColor = idx === 0 ? 'bg-yellow-400 text-white shadow-md shadow-yellow-400/20' : idx === 1 ? 'bg-slate-300 text-slate-850' : idx === 2 ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400';
                return (
                  <div 
                    key={user.id}
                    onClick={() => setPreviewUserId(user.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${rankBadgeColor} flex-shrink-0`}>
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-sm">
                            {user.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                        {user.full_name || 'مستخدم جديد'}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {user.points || 0} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action button to post community story */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setEditingPost(null);
          setIsCreateModalOpen(true);
        }}
        className="fixed bottom-24 right-5 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:bg-blue-700 hover:shadow-xl transition-all lg:hidden"
      >
        <Plus size={24} />
      </motion.button>

      {/* For desktop, we can display a clean, elegant bottom-right floating action button or sidebar option */}
      <div className="hidden lg:block fixed bottom-8 left-8 z-[60]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingPost(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-xl shadow-blue-500/20 font-bold transition-all"
        >
          <Plus size={20} />
          <span>أنشئ منشورًا جديدًا</span>
        </motion.button>
      </div>

      {/* Create/Edit Post Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setTimeout(() => setEditingPost(null), 300);
        }} 
        onPostCreated={handleCreatePost}
        editPost={editingPost}
      />
      
      <ProfilePreview 
        userId={previewUserId || ''} 
        isOpen={!!previewUserId} 
        onClose={() => setPreviewUserId(null)} 
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
              <div className="flex flex-col items-center text-center space-y-4" dir="rtl">
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
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-650 transition-colors"
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

function FilterButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border ${
        active 
          ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/10' 
          : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-900 hover:border-blue-200 dark:hover:border-blue-500/50'
      }`}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}
