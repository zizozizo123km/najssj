import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updateProfile } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
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
import { auth, db } from '../firebase';
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
  const [isEditing, setIsEditing] = useState(false);
  const [studyPlan, setStudyPlan] = useState<any>(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem('studyPlan');
    if (savedPlan) setStudyPlan(JSON.parse(savedPlan));
    
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              displayName: data.displayName || currentUser.displayName || null,
              email: data.email || currentUser.email || null,
              photoURL: data.photoURL || currentUser.photoURL || null,
              branch: data.branch || 'علوم تجريبية',
              favoriteSubjects: data.favoriteSubjects || ['الرياضيات', 'الفيزياء'],
              stats: data.stats || {
                savedSummaries: 0,
                analyzedVideos: 0,
                completedQuizzes: 0,
                successRate: 0,
              },
              activities: data.activities || []
            });
          } else {
            const initialData: UserProfile = {
              displayName: currentUser.displayName || null,
              email: currentUser.email || null,
              photoURL: currentUser.photoURL || null,
              branch: 'sciences',
              favoriteSubjects: ['الرياضيات', 'الفيزياء'],
              stats: {
                savedSummaries: 0,
                analyzedVideos: 0,
                completedQuizzes: 0,
                successRate: 0,
              },
              activities: []
            };
            
            setDoc(userDocRef, initialData).catch(err => {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            });
            setUser(initialData);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });

        return () => unsubscribeDoc();
      } else {
        navigate('/login');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleSaveSettings = async (newData: any) => {
    if (user && auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: newData.displayName,
          photoURL: newData.photoURL
        });

        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          displayName: newData.displayName || null,
          photoURL: newData.photoURL || null,
          branch: newData.branch || null,
          favoriteSubjects: newData.favoriteSubjects || []
        });

        setIsEditing(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
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
                
                {studyPlan && (
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                      <Calendar size={20} className="text-blue-500" />
                      My Study Plan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studyPlan.map((day: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl space-y-2">
                          <h4 className="font-bold text-gray-900">{day.day}</h4>
                          {day.slots.map((slot: any, j: number) => (
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
