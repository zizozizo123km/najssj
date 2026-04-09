import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  ChevronRight, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  Trash2,
  Server
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, collection, query, orderBy, onSnapshot, doc, getDoc, writeBatch, setDoc } from '../lib/firebase';
import { BAC_BRANCHES } from '../data/baccalaureate';
import { UserProfile, Group } from '../types';

export default function StudyGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('all');

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
        
        let userBranch = profile.branch || 'sciences';
        const branchById = BAC_BRANCHES.find(b => b.id === userBranch);
        const branchByName = BAC_BRANCHES.find(b => b.name === userBranch);
        if (!branchById && branchByName) {
          userBranch = branchByName.id;
        }

        const isAdminUser = profile.role === 'admin' || user.email === 'dzs325105@gmail.com' || user.email === 'nacero123@gmail.com';
        setIsAdmin(isAdminUser);

        // If not admin, ensure their branch group exists and redirect
        if (!isAdminUser) {
          const groupId = `branch_${userBranch}`;
          const groupRef = doc(db, 'chat_groups', groupId);
          const groupSnap = await getDoc(groupRef);
          
          if (!groupSnap.exists()) {
            await setDoc(groupRef, {
              name: `سيرفر شعبة ${BAC_BRANCHES.find(b => b.id === userBranch)?.name || userBranch}`,
              branch: userBranch,
              memberCount: 0,
              isLocked: false,
              createdAt: new Date()
            });
          }
          
          navigate(`/groups/${groupId}`);
        }
      }
    });

    const q = query(collection(db, 'chat_groups'), orderBy('name', 'asc'));
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
  }, [navigate]);

  const initializeGroups = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      for (const branch of BAC_BRANCHES) {
        const groupId = `branch_${branch.id}`;
        const groupRef = doc(db, 'chat_groups', groupId);
        batch.set(groupRef, {
          name: `سيرفر شعبة ${branch.name}`,
          branch: branch.id,
          memberCount: 0,
          isLocked: false,
          createdAt: new Date()
        }, { merge: true });
      }

      await batch.commit();
      alert("تم تهيئة سيرفرات الشعب بنجاح!");
    } catch (error) {
      console.error("Error initializing groups:", error);
      alert("حدث خطأ أثناء تهيئة السيرفرات.");
    }
    setLoading(false);
  };

  const clearGroups = async () => {
    if (!isAdmin || !window.confirm("هل أنت متأكد من حذف جميع السيرفرات؟")) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      groups.forEach(group => {
        batch.delete(doc(db, 'chat_groups', group.id));
      });
      await batch.commit();
      alert("تم حذف جميع السيرفرات بنجاح!");
    } catch (error) {
      console.error("Error clearing groups:", error);
    }
    setLoading(false);
  };

  // Only admins will see this page, students are redirected
  if (!isAdmin && userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-white dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري تحويلك لسيرفر شعبتك...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 shadow-sm sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">سيرفرات الشعب (لوحة الإدارة)</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة سيرفرات الدردشة الخاصة بكل شعبة.</p>
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
              <Server size={24} />
            </div>
          </div>
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
              تهيئة سيرفرات الشعب
            </button>
          ) : (
            <button
              onClick={initializeGroups}
              className="flex-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
            >
              <Sparkles size={20} className="text-indigo-500" />
              تحديث السيرفرات
            </button>
          )}
        </div>
      )}

      {/* Branch Filter */}
      <div className="px-6 pb-2 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedBranch('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            selectedBranch === 'all' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          الكل
        </button>
        {BAC_BRANCHES.map(branch => (
          <button
            key={branch.id}
            onClick={() => setSelectedBranch(branch.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              selectedBranch === branch.id 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {branch.icon} {branch.name}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري التحميل...</p>
          </div>
        ) : selectedBranch !== 'all' && BAC_SUBJECTS[selectedBranch] ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BAC_SUBJECTS[selectedBranch].map((subject, index) => {
              const group = groups.find(g => g.branch === selectedBranch && g.subject === subject.id) || {
                id: `${selectedBranch}_${subject.id}`,
                name: `مجموعة ${subject.name}`,
                branch: selectedBranch,
                subject: subject.id,
                memberCount: 0,
                createdAt: new Date() as any
              };
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-900 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${subject.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl">{subject.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{subject.name}</h3>
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
                    دخول المجموعة
                    <ChevronRight size={18} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : groups.filter(g => selectedBranch === 'all' || g.branch === selectedBranch).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.filter(g => selectedBranch === 'all' || g.branch === selectedBranch).map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-4 transition-all hover:border-indigo-200 dark:hover:border-indigo-900 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                    <Server size={28} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{group.name}</h3>
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
                  <button 
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    دخول السيرفر
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
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-lg">لا توجد سيرفرات</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">قم بتهيئة السيرفرات لتبدأ.</p>
          </div>
        )}
      </div>
    </div>
  );
}
