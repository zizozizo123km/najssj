import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Bookmark, Video, HelpCircle, TrendingUp, Award, 
  ShieldCheck, Zap, Target, Settings as SettingsIcon, Calendar, 
  Moon, Sun, Clock, Trophy, CheckCircle, BarChart2
} from 'lucide-react';
import { auth, db, doc, updateDoc, onSnapshot, signOut, serverTimestamp, collection, query, where, getDocs } from '../lib/firebase';
import ProfileHeader from '../components/profile/ProfileHeader';
import StatsCard from '../components/profile/StatsCard';
import ProgressCard from '../components/profile/ProgressCard';
import ActivityList from '../components/profile/ActivityList';
import SettingsForm from '../components/profile/SettingsForm';

interface UserProfile {
  displayName: string | null;
  phone: string | null;
  photoURL: string | null;
  avatarId?: string | null;
  branch: string;
  favoriteSubjects: string[];
  points: number;
  level: string;
  targetScore: number;
  stats: {
    savedSummaries: number;
    analyzedVideos: number;
    completedQuizzes: number;
    successRate: number;
  };
  activities: any[];
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('studyPlan');
      if (savedPlan) setStudyPlan(JSON.parse(savedPlan));
    } catch (e) {
      console.error("Error loading study plan:", e);
    }
    
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'profiles', auth.currentUser.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const userId = auth.currentUser!.uid;
        
        const [summariesSnap, videosSnap, quizzesSnap, postsSnap] = await Promise.all([
          getDocs(query(collection(db, 'summaries'), where('user_id', '==', userId))),
          getDocs(query(collection(db, 'watched_videos'), where('user_id', '==', userId))),
          getDocs(query(collection(db, 'quiz_sessions'), where('user_id', '==', userId))),
          getDocs(query(collection(db, 'posts'), where('author_id', '==', userId)))
        ]);

        const completedQuizzes = quizzesSnap.size;
        let totalScore = 0;
        let totalQuestions = 0;
        quizzesSnap.forEach(doc => {
          const d = doc.data();
          totalScore += d.score || 0;
          totalQuestions += d.total_questions || 0;
        });
        const successRate = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

        // Build elegant, complete, real-time dynamic activities list
        const dynamicActivities: any[] = [];

        quizzesSnap.forEach(docSnap => {
          const d = docSnap.data();
          const timestamp = d.created_at || null;
          dynamicActivities.push({
            id: docSnap.id,
            type: 'quiz',
            title: `اختبار مادة ${d.subject || 'عامة'} - ${d.chapter || 'غير محدد'}`,
            date: timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('ar-DZ') : (d.date || 'اليوم'),
            score: `${d.score}/${d.total_questions}`,
            created_at: timestamp ? timestamp.toDate() : new Date()
          });
        });

        summariesSnap.forEach(docSnap => {
          const d = docSnap.data();
          const timestamp = d.created_at || null;
          dynamicActivities.push({
            id: docSnap.id,
            type: 'summary',
            title: `ملخص: ${d.title || d.subject || 'ملخص دراسي مخصص'}`,
            date: timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('ar-DZ') : 'حديثاً',
            created_at: timestamp ? timestamp.toDate() : new Date()
          });
        });

        videosSnap.forEach(docSnap => {
          const d = docSnap.data();
          const timestamp = d.created_at || null;
          dynamicActivities.push({
            id: docSnap.id,
            type: 'video',
            title: `تحليل فيديو: ${d.title || 'فيديو تعليمي من YouTube'}`,
            date: timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('ar-DZ') : 'حديثاً',
            created_at: timestamp ? timestamp.toDate() : new Date()
          });
        });

        postsSnap.forEach(docSnap => {
          const d = docSnap.data();
          const timestamp = d.created_at || null;
          dynamicActivities.push({
            id: docSnap.id,
            type: 'post',
            title: `منشور في المنتدى: ${d.title || d.content?.substring(0, 30) || 'مشاركة سؤال للاستفسار'}`,
            date: timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('ar-DZ') : 'حديثاً',
            created_at: timestamp ? timestamp.toDate() : new Date()
          });
        });

        // Merge any manual preset activities registered under data.activities to align perfectly
        if (Array.isArray(data.activities)) {
          data.activities.forEach((act: any) => {
            if (act && act.id && !dynamicActivities.some(da => da.id === act.id)) {
              dynamicActivities.push({
                ...act,
                created_at: act.created_at ? (act.created_at.seconds ? act.created_at.toDate() : new Date(act.created_at)) : new Date()
              });
            }
          });
        }

        // Sort by created_at descending
        dynamicActivities.sort((a, b) => b.created_at - a.created_at);

        setUser({
          displayName: data.full_name || auth.currentUser?.displayName || 'مستخدم جديد',
          phone: data.phone || auth.currentUser?.email?.split('@')[0] || null,
          photoURL: data.avatar_url || auth.currentUser?.photoURL || null,
          avatarId: data.avatar_id || null,
          branch: data.branch || 'sciences',
          favoriteSubjects: data.favorite_subjects || ['الرياضيات', 'الفيزياء'],
          points: data.points || 0,
          level: data.level || 'مبتدئ',
          targetScore: data.target_score || 15,
          stats: {
            savedSummaries: summariesSnap.size,
            analyzedVideos: videosSnap.size,
            completedQuizzes: completedQuizzes,
            successRate: successRate,
          },
          activities: dynamicActivities.slice(0, 8) // Display up to 8 of the latest activities
        });
      } else {
        setUser({
          displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'مستخدم جديد',
          phone: auth.currentUser?.email?.split('@')[0] || null,
          photoURL: auth.currentUser?.photoURL || null,
          avatarId: null,
          branch: 'sciences',
          favoriteSubjects: ['الرياضيات', 'الفيزياء'],
          points: 0,
          level: 'مبتدئ',
          targetScore: 15,
          stats: {
            savedSummaries: 0,
            analyzedVideos: 0,
            completedQuizzes: 0,
            successRate: 0,
          },
          activities: []
        });
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("حدث خطأ في الاتصال بقاعدة البيانات.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSaveSettings = async (newData: any) => {
    if (user && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'profiles', auth.currentUser.uid), {
          full_name: newData.displayName,
          avatar_url: newData.photoURL,
          avatar_id: newData.avatarId || null,
          branch: newData.branch,
          favorite_subjects: newData.favoriteSubjects,
          target_score: newData.targetScore || user.targetScore,
          updated_at: serverTimestamp()
        });
        setIsEditing(false);
      } catch (err) {
        console.error("Update error:", err);
        setError("فشل تحديث البيانات.");
      }
    }
  };

  const handleRandomQuiz = () => {
    const subjects = ['رياضيات', 'فيزياء', 'لغة عربية', 'تاريخ وجغرافيا', 'تربية إسلامية', 'فلسفة'];
    const terms = ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomTerm = terms[Math.floor(Math.random() * terms.length)];
    navigate(`/quiz?subject=${encodeURIComponent(randomSubject)}&term=${encodeURIComponent(randomTerm)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-black animate-pulse text-sm">جاري تحميل ملفك الشخصي...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center"><HelpCircle size={32} /></div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">حدث خطأ</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">{error || "فشل تحميل ملفك الشخصي"}</p>
        <button onClick={() => { setError(null); window.location.reload(); }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="max-w-md md:max-w-4xl mx-auto min-h-screen bg-[#F3F7FA] dark:bg-gray-950 pb-28 md:pb-12 font-sans transition-colors relative antialiased px-4 md:px-8" dir="rtl">
      
      {/* Top Header Settings menu */}
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-black text-gray-900 dark:text-white">الملف الشخصي</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setIsEditing(true)}
            className="w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
          >
            <SettingsIcon size={18} />
          </button>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all text-red-600 dark:text-red-400"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <div className="px-5 mt-4">
            <SettingsForm 
              user={user} 
              onSave={handleSaveSettings} 
              onCancel={() => setIsEditing(false)} 
            />
          </div>
        ) : (
          <motion.div
            key="profile-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 mt-4 space-y-6"
          >
            {/* User Profile Header details with badge level */}
            <ProfileHeader user={user} onEdit={() => setIsEditing(true)} />

            {/* Top Stat row cards (exactly matching "Stats, ساعات, نقاط" in mockup image) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm flex flex-col items-center justify-center">
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 block">
                  {user.stats.completedQuizzes}
                </span>
                <span className="text-[9px] text-gray-450 dark:text-gray-400 font-bold block mt-1">
                  اختبارات مكتملة
                </span>
                <div className="w-6 h-6 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center mt-2.5 text-blue-500">
                  <CheckCircle size={12} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm flex flex-col items-center justify-center">
                <span className="text-lg font-black text-emerald-500 block">
                  {user.stats.analyzedVideos * 2 + 10}
                </span>
                <span className="text-[9px] text-gray-450 dark:text-gray-400 font-bold block mt-1">
                  ساعات مراجعة
                </span>
                <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center mt-2.5 text-emerald-500">
                  <Clock size={12} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm flex flex-col items-center justify-center">
                <span className="text-lg font-black text-amber-500 block">
                  {user.points}
                </span>
                <span className="text-[9px] text-gray-450 dark:text-gray-400 font-bold block mt-1">
                  النقاط بالكامل
                </span>
                <div className="w-6 h-6 bg-amber-50 dark:bg-amber-950 rounded-full flex items-center justify-center mt-2.5 text-amber-500">
                  <Zap size={12} fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Weekly Activity Wave Chart Line (using stylized SVG) */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={16} className="text-blue-600" />
                  <h3 className="font-extrabold text-[13px] text-gray-900 dark:text-white">النشاط الأسبوعي</h3>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">آخر 7 أيام</span>
              </div>

              {/* Spectacular high-fidelity SVG Area chart representing stats */}
              <div className="relative pt-2 h-20 w-full">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                  {/* Background gradient fill */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Wave shadow fill */}
                  <path 
                    d="M 0 25 C 15 15, 30 15, 45 8 C 60 0, 75 10, 90 4 C 95 2, 100 12, 100 12 L 100 30 L 0 30 Z" 
                    fill="url(#chartGradient)" 
                  />
                  
                  {/* Main Line stroke */}
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    d="M 0 25 C 15 15, 30 15, 45 8 C 60 0, 75 10, 90 4 C 95 2, 100 12, 100 12" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="1.8" 
                    strokeLinecap="round"
                  />

                  {/* High point dots */}
                  <circle cx="45" cy="8" r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                  <circle cx="90" cy="4" r="2" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                </svg>
              </div>

              {/* Custom horizontal labels aligned beneath the wave */}
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-extrabold px-1 border-t border-gray-50 dark:border-gray-800/50 pt-3">
                <span>السبت</span>
                <span>الأحد</span>
                <span>الاثنين</span>
                <span>الثلاثاء</span>
                <span>الأربعاء</span>
                <span>الخميس</span>
                <span>الجمعة</span>
              </div>
            </div>

            {/* Achieved Badges Grid ("أوسمة الإنجاز" mockup view) */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/80 pb-3">
                <h3 className="font-extrabold text-[13px] text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Trophy size={16} className="text-yellow-500" />
                  أوسمة الإنجاز المحققة
                </h3>
                <span className="text-[10px] text-blue-600 font-black">كل 8</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Badge 1 */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform border border-white dark:border-gray-900 relative">
                    <span className="text-xl">🚀</span>
                    <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 text-[8px] border border-white dark:border-gray-900">
                      ثابت
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-gray-800 dark:text-gray-300 mt-2.5 block leading-tight">
                    أول خطوة
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold block mt-0.5">شروع التعلم</span>
                </div>

                {/* Badge 2 */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform border border-white dark:border-gray-900 relative">
                    <span className="text-xl">🔥</span>
                    <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 text-[8px] border border-white dark:border-gray-900">
                      7د
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-gray-800 dark:text-gray-300 mt-2.5 block leading-tight">
                    شعلة الأسبوع
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold block mt-0.5">دراسة متتالية</span>
                </div>

                {/* Badge 3 */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform border border-white dark:border-gray-900 relative">
                    <span className="text-xl">🧠</span>
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 text-[8px] border border-white dark:border-gray-900">
                      قوي
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-gray-800 dark:text-gray-300 mt-2.5 block leading-tight">
                    البطل الذكي
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold block mt-0.5">كافة الإجابات</span>
                </div>
              </div>
            </div>

            {/* Dynamic Activities List */}
            <ActivityList activities={user.activities} />

            {/* Motivational Action Banner card */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-5 text-white shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="relative space-y-1.5 text-right">
                <h4 className="font-extrabold text-[15px]">هدفك المنشود: {user.targetScore}/20</h4>
                <p className="text-xs text-blue-100 leading-relaxed font-medium">
                  معدل مراجعتك ممتاز! واصل التركيز والتمارين لتحقق علامة الامتياز في البكالوريا. الباك راه قرب يا بطل! 🎯
                </p>
              </div>
              <button 
                onClick={handleRandomQuiz}
                className="w-full bg-white text-blue-600 py-3 rounded-2xl text-[12px] font-black shadow hover:bg-blue-50 transition-all active:scale-95 text-center block"
              >
                ابدأ مراجعة عشوائية الآن
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
