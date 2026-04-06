import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  MessageCircle, 
  ChevronRight, 
  BookOpen,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, collection, query, orderBy, onSnapshot, doc, getDoc, writeBatch, where } from '../lib/firebase';
import { BAC_BRANCHES, BAC_SUBJECTS } from '../data/baccalaureate';
import { UserProfile, Group } from '../types';

export default function StudyGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Check if user is one of the hardcoded admins
    if (user.email === 'dzs325105@gmail.com' || user.email === 'nacero123@gmail.com') {
      setIsAdmin(true);
    }

    // Reactive profile listener
    const unsubscribeProfile = onSnapshot(doc(db, 'profiles', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data() as any;
        // Map favorite_subjects to enrolledSubjects if not present
        if (!profile.enrolledSubjects && profile.favorite_subjects) {
          profile.enrolledSubjects = profile.favorite_subjects;
        }
        setUserProfile(profile as UserProfile);
        
        // Normalize branch (handle old data where branch might be a name)
        let userBranch = profile.branch || 'sciences';
        const branchById = BAC_BRANCHES.find(b => b.id === userBranch);
        const branchByName = BAC_BRANCHES.find(b => b.name === userBranch);
        if (!branchById && branchByName) {
          userBranch = branchByName.id;
        }

        // If admin, they can see all by default
        // If student, they are locked to their branch
        if (profile.role === 'admin' || user.email === 'dzs325105@gmail.com' || user.email === 'nacero123@gmail.com') {
          setIsAdmin(true);
          setSelectedBranch('all');
        } else {
          setSelectedBranch(userBranch);
        }
      }
    }, (error) => {
      console.error("Error fetching profile snapshot:", error);
    });

    const q = query(collection(db, 'chat_groups'), orderBy('name', 'asc'));
    const unsubscribeGroups = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Group));
      setGroups(groupsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching groups:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeGroups();
    };
  }, []);

  // Automatic group creation for user's branch/subjects
  useEffect(() => {
    if (!userProfile || !userProfile.branch || loading || groups.length === 0) return;

    const ensureGroupsExist = async () => {
      const enrolled = userProfile.enrolledSubjects || (userProfile as any).favorite_subjects || [];
      const branchSubjects = BAC_SUBJECTS[userProfile.branch!] || [];
      
      const missingSubjects = branchSubjects.filter(s => 
        enrolled.includes(s.name) && 
        !groups.some(g => g.branch === userProfile.branch && g.subject === s.id)
      );

      if (missingSubjects.length > 0) {
        try {
          const batch = writeBatch(db);
          for (const subject of missingSubjects) {
            const groupId = `${userProfile.branch}_${subject.id}`;
            const groupRef = doc(db, 'chat_groups', groupId);
            batch.set(groupRef, {
              name: `${subject.name} - ${BAC_BRANCHES.find(b => b.id === userProfile.branch)?.name}`,
              branch: userProfile.branch,
              subject: subject.id,
              memberCount: 0,
              isLocked: false,
              createdAt: new Date()
            }, { merge: true });
          }
          await batch.commit();
        } catch (error) {
          console.error("Error auto-creating groups:", error);
        }
      }
    };

    ensureGroupsExist();
  }, [userProfile, groups, loading]);

  const initializeGroups = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      for (const branch of BAC_BRANCHES) {
        const subjects = BAC_SUBJECTS[branch.id] || [];
        for (const subject of subjects) {
          const groupId = `${branch.id}_${subject.id}`;
          const groupRef = doc(db, 'chat_groups', groupId);
          batch.set(groupRef, {
            name: `${subject.name} - ${branch.name}`,
            branch: branch.id,
            subject: subject.id,
            memberCount: 0,
            isLocked: false,
            createdAt: new Date()
          }, { merge: true });
        }
      }

      await batch.commit();
      alert("تم تهيئة غرف الدردشة بنجاح!");
    } catch (error) {
      console.error("Error initializing groups:", error);
      alert("حدث خطأ أثناء تهيئة غرف الدردشة.");
    }
    setLoading(false);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || group.branch === selectedBranch;
    
    // For students, only show rooms for their enrolled subjects
    if (userProfile && userProfile.role !== 'admin' && auth.currentUser?.email !== 'dzs325105@gmail.com') {
      const enrolled = userProfile.enrolledSubjects || (userProfile as any).favorite_subjects || [];
      const subjects = BAC_SUBJECTS[userProfile.branch || 'sciences'] || [];
      const subject = subjects.find(s => s.id === group.subject);
      const isEnrolled = enrolled.includes(subject?.name || '');
      return matchesSearch && matchesBranch && isEnrolled;
    }
    
    return matchesSearch && matchesBranch;
  });

  const getSubjectIcon = (subjectId: string, branchId: string) => {
    const subjects = BAC_SUBJECTS[branchId] || [];
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.icon || '📚';
  };

  const clearGroups = async () => {
    if (!isAdmin || !window.confirm("هل أنت متأكد من حذف جميع غرف الدردشة؟")) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      groups.forEach(group => {
        batch.delete(doc(db, 'chat_groups', group.id));
      });
      await batch.commit();
      alert("تم حذف جميع الغرف بنجاح!");
    } catch (error) {
      console.error("Error clearing groups:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 shadow-sm sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">غرف الدردشة الدراسية</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">ناقش الدروس مع طلاب شعبتك في الوقت الفعلي.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && groups.length > 0 && (
              <button
                onClick={clearGroups}
                className="p-2.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="حذف الكل"
              >
                <Trash2 size={24} />
              </button>
            )}
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm">
              <MessageSquare size={24} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن مادة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-none"
            />
          </div>

          {userProfile && (
            <div className="flex items-center gap-2 px-1">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                عرض مواد شعبة: {BAC_BRANCHES.find(b => b.id === selectedBranch)?.name || selectedBranch}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && !loading && (
        <div className="p-6 flex gap-3">
          {groups.length === 0 ? (
            <button
              onClick={initializeGroups}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
            >
              <AlertCircle size={20} />
              تهيئة غرف الدردشة الدراسية
            </button>
          ) : (
            <button
              onClick={initializeGroups}
              className="flex-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
            >
              <Sparkles size={20} className="text-indigo-500" />
              تحديث غرف الدردشة
            </button>
          )}
        </div>
      )}

      {/* Groups List */}
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري تحميل الغرف...</p>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-900 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {getSubjectIcon(group.subject, group.branch)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{group.name.split(' - ')[0]}</h3>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                          {BAC_BRANCHES.find(b => b.id === group.branch)?.name || group.branch}
                        </span>
                      </div>
                      {group.isLocked && (
                        <span className="bg-red-50 dark:bg-red-900/30 text-red-500 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-red-100 dark:border-red-900/50">مغلق</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users size={14} className="text-indigo-500" /> {group.memberCount || 0} طالب نشط
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

                <div className="flex flex-col gap-3">
                  {group.lastMessage ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-indigo-500 shrink-0">{group.lastMessage.senderName}:</span>
                      <span className="truncate italic">"{group.lastMessage.text}"</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic px-1">لا توجد رسائل بعد.. كن أول من يشارك!</p>
                  )}

                  <button 
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    انضم للمناقشة
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <MessageCircle size={40} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">لا توجد غرف دردشة</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">لم نجد أي غرف دردشة تطابق بحثك أو شعبتك.</p>
          </div>
        )}
      </div>

      {/* Floating AI Hint */}
      <div className="fixed bottom-24 right-6 left-6 flex justify-center pointer-events-none">
        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-lg border border-indigo-100 dark:border-indigo-900 flex items-center gap-2 animate-bounce pointer-events-auto">
          <Sparkles size={14} className="text-indigo-500" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">اسأل المساعد الذكي داخل الغرف!</span>
        </div>
      </div>
    </div>
  );
}
