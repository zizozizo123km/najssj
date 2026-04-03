import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Bell, BookOpen, Save, X } from 'lucide-react';

interface SettingsFormProps {
  user: {
    displayName: string | null;
    email: string | null;
    branch: string;
    favoriteSubjects: string[];
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

const BRANCHES = ['علوم تجريبية', 'رياضيات', 'تقني رياضي', 'تسيير واقتصاد', 'لغات أجنبية', 'آداب وفلسفة'];
const SUBJECTS = ['رياضيات', 'فيزياء', 'لغة عربية', 'تاريخ وجغرافيا', 'تربية إسلامية', 'فلسفة', 'لغة ألمانية'];

export default function SettingsForm({ user, onSave, onCancel }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    branch: user.branch || BRANCHES[0],
    favoriteSubjects: user.favoriteSubjects || [],
    notifications: true,
  });

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects.includes(subject)
        ? prev.favoriteSubjects.filter(s => s !== subject)
        : [...prev.favoriteSubjects, subject]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-8"
    >
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">تعديل الملف الشخصي</h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User size={16} className="text-blue-500" /> الاسم الكامل
            </label>
            <input 
              type="text" 
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-blue-500" /> البريد الإلكتروني
            </label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Branch */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <BookOpen size={16} className="text-purple-500" /> الشعبة الدراسية
          </label>
          <select 
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
          >
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Favorite Subjects */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Sparkles size={16} className="text-orange-500" /> المواد المفضلة
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubject(s)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  formData.favoriteSubjects.includes(s)
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-blue-500" />
            <div>
              <p className="text-sm font-bold text-gray-800">تلقي التنبيهات</p>
              <p className="text-[10px] text-gray-500">تنبيهات حول الدروس الجديدة والاختبارات</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
            className={`w-12 h-6 rounded-full transition-colors relative ${formData.notifications ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <motion.div 
              animate={{ x: formData.notifications ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
          >
            <Save size={20} />
            <span>حفظ التغييرات</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}

const Sparkles = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
