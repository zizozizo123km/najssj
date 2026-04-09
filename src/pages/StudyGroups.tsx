import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  ChevronRight, 
  AlertCircle,
  Sparkles,
  Trash2,
  Server,
  BookOpen,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, collection, query, orderBy, onSnapshot, doc, getDoc, writeBatch, setDoc } from '../lib/firebase';
import { BAC_BRANCHES, BAC_SUBJECTS } from '../data/baccalaureate';
import { UserProfile, Group } from '../types';

export default function StudyGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    if (user.email === 'dzs325105@gmail.com' || user.email === 'nacero123@gmail.com') {
      setIsAdmin(true);
    }

    const unsubscribeProfile = onSnapshot(doc(db, 'profiles', user.uid), async (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data() as any;
        setUserProfile(profile as UserProfile);
        const isAdminUser = profile.role === 'admin' || user.email === 'dzs325105@gmail.com' || user.email === 'nacero123@gmail.com';
        setIsAdmin(isAdminUser);
        
        // Set default subject if not set
        if (!selectedSubject) {
          const branch = profile.branch || 'sciences';
          const subjects = BAC_SUBJECTS[branch] || [];
          if (subjects.length > 0) {
            setSelectedSubject(subjects[0].id);
          }
        }
      }
    });

    const q = query(collection(db, 'chat_groups'), orderBy('createdAt', 'desc'));
    const unsubscribeGroups = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Group));
      setGroups(groupsData);
      setLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeGroups();
    };
  }, [navigate, selectedSubject]);

  const initializeGroups = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Create groups for each subject in each branch
      for (const branch of BAC_BRANCHES) {
        const subjects = BAC_SUBJECTS[branch.id] || [];
        for (const subject of subjects) {
          const groupId = `group_${branch.id}_${subject.id}`;
          const groupRef = doc(db, 'chat_groups', groupId);
          batch.set(groupRef, {
            name: `مجموعة ${subject.name} - ${branch.name}`,
            branch: branch.id,
            subject: subject.id,
            memberCount: 0,
            isLocked: false,
            createdAt: new Date()
          }, { merge: true });
        }
      }

      await batch.commit();
      alert("تم تهيئة مجموعات المواد بنجاح!");
    } catch (error) {
      console.error("Error initializing groups:", error);
      alert("حدث خطأ أثناء تهيئة المجموعات.");
    }
    setLoading(false);
  };

  const clearGroups = async () => {
    if (!isAdmin || !window.confirm("هل أنت متأكد من حذف جميع المجموعات؟")) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      groups.forEach(group => {
        batch.delete(doc(db, 'chat_groups', group.id));
      });
      await batch.commit();
      alert("تم حذف جميع المجموعات بنجاح!");
    } catch (error) {
      console.error("Error clearing groups:", error);
    }
    setLoading(false);
  };

  const userBranch = userProfile?.branch || 'sciences';
  const subjects = BAC_SUBJECTS[userBranch] || [];
  
  const filteredGroups = groups.filter(g => 
    g.branch === userBranch && 
    (!selectedSubject || g.subject === selectedSubject)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20" dir="rtl">
      <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 shadow-sm sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">مجموعات المواد</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">تواصل مع زملائك في نفس الشعبة والمادة.</p>
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
              <MessageCircle size={24} />
            </div>
          </div>
        </div>

        {/* Subject Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap shadow-sm border ${
                selectedSubject === subject.id 
                  ? 'bg-indigo-600 text-white border-indigo-500 scale-105' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50'
              }`}
            >
              <span>{subject.icon}</span>
              <span>{subject.name}</span>
            </button>
          ))}
        </div>
      </div>

      {isAdmin && !loading && (
        <div className="p-6 flex gap-3">
          {groups.length === 0 ? (
            <button
              onClick={initializeGroups}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all"
            >
              <AlertCircle size={20} />
              تهيئة مجموعات المواد
            </button>
          ) : (
            <button
              onClick={initializeGroups}
              className="flex-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
            >
              <Sparkles size={20} className="text-indigo-500" />
              تحديث المجموعات
            </button>
          )}
        </div>
      )}

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {filteredGroups.length > 0 ? (
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
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen size={28} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{group.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users size={14} className="text-indigo-500" /> {group.memberCount || 0} طالب نشط
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

                <button 
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  دخول الدردشة
                  <ChevronRight size={18} className="rotate-180" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400">
              <Filter size={40} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد مجموعات لهذه المادة</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">يرجى اختيار مادة أخرى أو مراجعة الإدارة.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
