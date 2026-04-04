import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  MessageCircle, 
  ChevronRight, 
  Filter,
  GraduationCap,
  BookOpen,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { BAC_BRANCHES, BAC_SUBJECTS } from '../data/baccalaureate';

interface ChatGroup {
  id: string;
  name: string;
  branchId: string;
  subjectId: string;
  memberCount: number;
  lastMessage?: {
    text: string;
    sender: string;
    timestamp: any;
  };
  isLocked?: boolean;
}

export default function StudyGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else if (
          auth.currentUser.email === "dzs325105@gmail.com" || 
          auth.currentUser.email === "nacero123@gmail.com"
        ) {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();

    // Listen to chat groups
    const q = query(collection(db, 'chatGroups'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatGroup[];
      setGroups(groupsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching groups:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initializeGroups = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      for (const branch of BAC_BRANCHES) {
        const subjects = BAC_SUBJECTS[branch.id] || [];
        for (const subject of subjects) {
          const groupId = `${branch.id}_${subject.id}`;
          const groupRef = doc(db, 'chatGroups', groupId);
          const groupSnap = await getDoc(groupRef);
          
          if (!groupSnap.exists()) {
            await setDoc(groupRef, {
              name: `${subject.name} - ${branch.name}`,
              branchId: branch.id,
              subjectId: subject.id,
              memberCount: 0,
              isLocked: false,
              createdAt: serverTimestamp()
            });
          }
        }
      }
      alert("تم تهيئة المجموعات بنجاح!");
    } catch (error) {
      console.error("Error initializing groups:", error);
      alert("حدث خطأ أثناء تهيئة المجموعات.");
    }
    setLoading(false);
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || group.branchId === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مجموعات الدراسة</h1>
            <p className="text-gray-500 text-sm">ناقش الدروس، اطرح الأسئلة، وساعد زملائك.</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
            <Users size={24} />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث عن مجموعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedBranch('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedBranch === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              الكل
            </button>
            {BAC_BRANCHES.map(branch => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedBranch === branch.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {branch.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && groups.length === 0 && !loading && (
        <div className="p-6">
          <button
            onClick={initializeGroups}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <AlertCircle size={20} />
            تهيئة المجموعات الدراسية
          </button>
        </div>
      )}

      {/* Groups List */}
      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-bold">جاري تحميل المجموعات...</p>
          </div>
        ) : filteredGroups.length > 0 ? (
          filteredGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <BookOpen size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{group.name}</h3>
                  {group.isLocked && (
                    <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold">مغلق</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {group.memberCount} طالب
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    نشط الآن
                  </span>
                </div>

                {group.lastMessage ? (
                  <p className="text-xs text-gray-400 truncate italic">
                    {group.lastMessage.sender}: "{group.lastMessage.text}"
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">لا توجد رسائل بعد</p>
                )}
              </div>

              <ChevronRight className="text-gray-300 shrink-0" size={20} />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <MessageCircle size={32} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">لا توجد مجموعات</h3>
            <p className="text-gray-500 text-sm">لم نجد أي مجموعات تطابق بحثك.</p>
          </div>
        )}
      </div>
    </div>
  );
}
