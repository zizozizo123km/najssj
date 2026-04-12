import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  GraduationCap, 
  Search,
  Atom,
  Calculator,
  Beaker,
  Languages,
  History,
  PenTool,
  Globe,
  ScrollText
} from 'lucide-react';
import { auth, db, doc, onSnapshot } from '../lib/firebase';

interface Subject {
  id: string;
  name: string;
  icon: any;
  color: string;
}

const BRANCH_SUBJECTS: { [key: string]: Subject[] } = {
  sciences: [
    { id: 'math', name: 'الرياضيات', icon: Calculator, color: 'bg-blue-500' },
    { id: 'physics', name: 'الفيزياء', icon: Atom, color: 'bg-purple-500' },
    { id: 'science', name: 'علوم الطبيعة والحياة', icon: Beaker, color: 'bg-green-500' },
    { id: 'arabic', name: 'اللغة العربية', icon: ScrollText, color: 'bg-orange-500' },
    { id: 'history_geo', name: 'التاريخ والجغرافيا', icon: Globe, color: 'bg-emerald-500' },
    { id: 'islamic', name: 'التربية الإسلامية', icon: BookOpen, color: 'bg-teal-500' },
    { id: 'philosophy', name: 'الفلسفة', icon: PenTool, color: 'bg-indigo-500' },
    { id: 'french', name: 'اللغة الفرنسية', icon: Languages, color: 'bg-red-500' },
    { id: 'english', name: 'اللغة الإنجليزية', icon: Languages, color: 'bg-blue-400' },
  ],
  literature: [
    { id: 'arabic', name: 'اللغة العربية', icon: ScrollText, color: 'bg-orange-500' },
    { id: 'philosophy', name: 'الفلسفة', icon: PenTool, color: 'bg-indigo-500' },
    { id: 'history_geo', name: 'التاريخ والجغرافيا', icon: Globe, color: 'bg-emerald-500' },
    { id: 'islamic', name: 'التربية الإسلامية', icon: BookOpen, color: 'bg-teal-500' },
    { id: 'math', name: 'الرياضيات', icon: Calculator, color: 'bg-blue-500' },
    { id: 'french', name: 'اللغة الفرنسية', icon: Languages, color: 'bg-red-500' },
    { id: 'english', name: 'اللغة الإنجليزية', icon: Languages, color: 'bg-blue-400' },
  ],
  languages: [
    { id: 'arabic', name: 'اللغة العربية', icon: ScrollText, color: 'bg-orange-500' },
    { id: 'french', name: 'اللغة الفرنسية', icon: Languages, color: 'bg-red-500' },
    { id: 'english', name: 'اللغة الإنجليزية', icon: Languages, color: 'bg-blue-400' },
    { id: 'spanish', name: 'اللغة الإسبانية', icon: Languages, color: 'bg-yellow-500' },
    { id: 'german', name: 'اللغة الألمانية', icon: Languages, color: 'bg-gray-700' },
    { id: 'history_geo', name: 'التاريخ والجغرافيا', icon: Globe, color: 'bg-emerald-500' },
    { id: 'philosophy', name: 'الفلسفة', icon: PenTool, color: 'bg-indigo-500' },
    { id: 'islamic', name: 'التربية الإسلامية', icon: BookOpen, color: 'bg-teal-500' },
  ],
  math: [
    { id: 'math', name: 'الرياضيات', icon: Calculator, color: 'bg-blue-500' },
    { id: 'physics', name: 'الفيزياء', icon: Atom, color: 'bg-purple-500' },
    { id: 'science', name: 'علوم الطبيعة والحياة', icon: Beaker, color: 'bg-green-500' },
    { id: 'arabic', name: 'اللغة العربية', icon: ScrollText, color: 'bg-orange-500' },
    { id: 'history_geo', name: 'التاريخ والجغرافيا', icon: Globe, color: 'bg-emerald-500' },
    { id: 'philosophy', name: 'الفلسفة', icon: PenTool, color: 'bg-indigo-500' },
  ]
};

const BRANCH_NAMES: { [key: string]: string } = {
  sciences: 'شعبة العلوم التجريبية',
  literature: 'شعبة الآداب والفلسفة',
  languages: 'شعبة اللغات الأجنبية',
  math: 'شعبة الرياضيات',
  tech_math: 'شعبة تقني رياضي',
  management: 'شعبة تسيير واقتصاد'
};

export default function Courses() {
  const navigate = useNavigate();
  const [branch, setBranch] = useState('sciences');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'profiles', auth.currentUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setBranch(snapshot.data().branch || 'sciences');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const subjects = BRANCH_SUBJECTS[branch] || BRANCH_SUBJECTS['sciences'];
  const filteredSubjects = subjects.filter(s => s.name.includes(searchQuery));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">جاري تحميل المواد...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <GraduationCap className="text-blue-600" size={32} />
            الدروس والمواد
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold mt-1">
            {BRANCH_NAMES[branch] || branch}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="بحث عن مادة..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl py-3 pr-12 pl-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/courses/${encodeURIComponent(subject.name)}`)}
            className="group bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${subject.color} opacity-5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform`} />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 ${subject.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <subject.icon size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {subject.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">عرض الدروس والفيديوهات</p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">لا توجد نتائج</h3>
          <p className="text-gray-500 dark:text-gray-400">جرب البحث عن مادة أخرى</p>
        </div>
      )}
    </div>
  );
}
