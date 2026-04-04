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
import { supabase } from '../lib/supabase';
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.role === 'admin') {
            setIsAdmin(true);
          } else if (
            session.user.email === "dzs325105@gmail.com" || 
            session.user.email === "nacero123@gmail.com"
          ) {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };
    checkAdmin();

    // Fetch chat groups
    const fetchGroups = async () => {
      const { data, error } = await supabase
        .from('chat_groups')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error("Error fetching groups:", error);
      } else {
        setGroups(data.map(g => ({
          id: g.id,
          name: g.name,
          branchId: g.branch_id,
          subjectId: g.subject_id,
          memberCount: g.member_count,
          lastMessage: g.last_message,
          isLocked: g.is_locked
        })));
      }
      setLoading(false);
    };
    fetchGroups();

    // Realtime subscription for chat groups
    const groupsChannel = supabase
      .channel('chat_groups_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_groups'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newGroup = payload.new;
          setGroups(prev => [...prev, {
            id: newGroup.id,
            name: newGroup.name,
            branchId: newGroup.branch_id,
            subjectId: newGroup.subject_id,
            memberCount: newGroup.member_count,
            lastMessage: newGroup.last_message,
            isLocked: newGroup.is_locked
          }].sort((a, b) => a.name.localeCompare(b.name)));
        } else if (payload.eventType === 'UPDATE') {
          const updatedGroup = payload.new;
          setGroups(prev => prev.map(g => g.id === updatedGroup.id ? {
            id: updatedGroup.id,
            name: updatedGroup.name,
            branchId: updatedGroup.branch_id,
            subjectId: updatedGroup.subject_id,
            memberCount: updatedGroup.member_count,
            lastMessage: updatedGroup.last_message,
            isLocked: updatedGroup.is_locked
          } : g));
        } else if (payload.eventType === 'DELETE') {
          setGroups(prev => prev.filter(g => g.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(groupsChannel);
    };
  }, []);

  const initializeGroups = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const groupsToCreate = [];
      for (const branch of BAC_BRANCHES) {
        const subjects = BAC_SUBJECTS[branch.id] || [];
        for (const subject of subjects) {
          const groupId = `${branch.id}_${subject.id}`;
          groupsToCreate.push({
            id: groupId,
            name: `${subject.name} - ${branch.name}`,
            branch_id: branch.id,
            subject_id: subject.id,
            member_count: 0,
            is_locked: false
          });
        }
      }

      const { error } = await supabase
        .from('chat_groups')
        .upsert(groupsToCreate, { onConflict: 'id' });

      if (error) throw error;
      
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
