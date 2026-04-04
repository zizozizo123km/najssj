import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Bookmark, 
  Video, 
  HelpCircle, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  Zap, 
  Target,
  Settings as SettingsIcon,
  Calendar,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProfileHeader from '../components/profile/ProfileHeader';
import StatsCard from '../components/profile/StatsCard';
import ProgressCard from '../components/profile/ProgressCard';
import ActivityList from '../components/profile/ActivityList';
import SettingsForm from '../components/profile/SettingsForm';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  branch: string;
  favoriteSubjects: string[];
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

  function handleSupabaseError(error: any) {
    console.error('Supabase Error: ', error);
    setError("حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.");
  }

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('studyPlan');
      if (savedPlan) setStudyPlan(JSON.parse(savedPlan));
    } catch (e) {
      console.error("Error loading study plan from localStorage:", e);
    }
    
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        handleSupabaseError(error);
        setLoading(false);
        return;
      }

      if (data) {
        setUser({
          displayName: data.display_name || session.user.user_metadata.full_name || null,
          email: data.email || session.user.email || null,
          photoURL: data.photo_url || session.user.user_metadata.avatar_url || null,
          branch: data.branch || 'علوم تجريبية',
          favoriteSubjects: data.favorite_subjects || ['الرياضيات', 'الفيزياء'],
          stats: data.stats || {
            savedSummaries: 0,
            analyzedVideos: 0,
            completedQuizzes: 0,
            successRate: 0,
          },
          activities: Array.isArray(data.activities) ? data.activities : []
        });
      }
      setLoading(false);
    };

    fetchProfile();

    // Realtime subscription for profile changes
    const profileChannel = supabase
      .channel('profile_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles'
      }, (payload) => {
        const data = payload.new;
        setUser(prev => prev ? ({
          ...prev,
          displayName: data.display_name,
          photoURL: data.photo_url,
          branch: data.branch,
          favoriteSubjects: data.favorite_subjects,
          stats: data.stats,
          activities: data.activities
        }) : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSaveSettings = async (newData: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (user && session) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: newData.displayName,
            photo_url: newData.photoURL,
            branch: newData.branch,
            favorite_subjects: newData.favoriteSubjects
          })
          .eq('id', session.user.id);

        if (error) throw error;

        // Also update auth metadata
        await supabase.auth.updateUser({
          data: { 
            full_name: newData.displayName,
            avatar_url: newData.photoURL
          }
        });

        setIsEditing(false);
      } catch (error) {
        handleSupabaseError(error);
      }
    }
  };
  const handleRandomQuiz = () => {
    const subjects = ['رياضيات', 'فيزياء', 'لغة عربية', 'تاريخ وجغرافيا', 'تربية إسلامية', 'فلسفة', 'لغة ألمانية'];
    const terms = ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomTerm = terms[Math.floor(Math.random() * terms.length)];
    navigate(`/quiz?subject=${encodeURIComponent(randomSubject)}&term=${encodeURIComponent(randomTerm)}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">جاري تحميل ملفك الشخصي...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <HelpCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">عذراً، حدث خطأ</h2>
        <p className="text-gray-500 max-w-xs">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans space-y-8 pb-20">
      <AnimatePresence mode="wait">
        {isEditing ? (
          <SettingsForm 
            user={user} 
            onSave={handleSaveSettings} 
            onCancel={() => setIsEditing(false)} 
          />
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black text-gray-900">الملف الشخصي</h1>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-white text-gray-600 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <SettingsIcon size={20} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                >
                  <LogOut size={18} />
                  <span>خروج</span>
                </button>
              </div>
            </div>

            <ProfileHeader user={user} onEdit={() => setIsEditing(true)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgressCard label="الاختبارات المكتملة" current={user.stats.completedQuizzes} total={50} icon={HelpCircle} color="bg-orange-500" delay={0.1} />
              <ProgressCard label="الفيديوهات المحللة" current={user.stats.analyzedVideos} total={50} icon={Video} color="bg-red-500" delay={0.2} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard label="ملخصات محفوظة" value={user.stats.savedSummaries} icon={Bookmark} color="bg-blue-500" delay={0.3} />
              <StatsCard label="نسبة النجاح" value={`${user.stats.successRate}%`} icon={TrendingUp} color="bg-green-500" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <ActivityList activities={user.activities} />
                
                {Array.isArray(studyPlan) && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                      <Calendar size={20} className="text-blue-500" />
                      My Study Plan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studyPlan.map((day: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl space-y-2">
                          <h4 className="font-bold text-gray-900">{day.day}</h4>
                          {Array.isArray(day.slots) && day.slots.map((slot: any, j: number) => (
                            <p key={j} className="text-xs text-gray-600">{slot.time}: {slot.subject}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                    <Award size={20} className="text-yellow-500" />
                    أوسمة الإنجاز
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">سريع التعلم</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 shadow-inner group-hover:scale-110 transition-transform">
                        <Target size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">قناص الأهداف</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group opacity-40 grayscale">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-inner group-hover:scale-110 transition-transform">
                        <ShieldCheck size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">خبير المواد</span>
                    </div>
                  </div>
                  <button className="w-full text-xs text-blue-600 font-bold hover:underline pt-2">عرض كل الأوسمة</button>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 shadow-xl text-white space-y-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative space-y-2">
                    <h4 className="font-bold text-lg">أنت تقترب من هدفك!</h4>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      لقد أكملت 85% من أهداف المراجعة لهذا الأسبوع. استمر في هذا النشاط، البكالوريا في جيبك!
                    </p>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      className="h-full bg-white"
                    />
                  </div>
                  <button 
                    onClick={handleRandomQuiz}
                    className="w-full bg-white text-blue-600 py-3 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all active:scale-95"
                  >
                    ابدأ مراجعة جديدة
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
