import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Lock, Bell, BookOpen, Save, X, Image as ImageIcon, Sparkles, Key, Moon, Sun } from 'lucide-react';
import AvatarGallery from './AvatarGallery';
import { BAC_BRANCHES, BAC_SUBJECTS } from '../../data/baccalaureate';

interface SettingsFormProps {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    avatarId?: string | null;
    branch: string;
    favoriteSubjects: string[];
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function SettingsForm({ user, onSave, onCancel }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    avatarId: user.avatarId || '',
    branch: user.branch || BAC_BRANCHES[0].id,
    favoriteSubjects: user.favoriteSubjects || [],
    notifications: true,
  });

  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    youtube: '',
    cloudinary: ''
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load custom API keys from local storage
    const localKeys = localStorage.getItem('custom_api_keys');
    if (localKeys) {
      try {
        const parsed = JSON.parse(localKeys);
        setApiKeys({
          gemini: parsed.gemini || '',
          youtube: parsed.youtube || '',
          cloudinary: parsed.cloudinary || ''
        });
      } catch (e) {}
    }

    // Check dark mode
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects.includes(subject)
        ? prev.favoriteSubjects.filter(s => s !== subject)
        : [...prev.favoriteSubjects, subject]
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Save API keys to local storage
    localStorage.setItem('custom_api_keys', JSON.stringify(apiKeys));
    onSave(formData);
  };

  const currentSubjects = BAC_SUBJECTS[formData.branch] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-slate-700 space-y-8"
    >
      <div className="flex items-center justify-between border-b dark:border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل الملف الشخصي</h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
          <X size={20} />
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSave}>
        {/* Appearance Settings */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-orange-500" />}
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">الوضع المظلم</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">تغيير مظهر التطبيق</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
          >
            <motion.div 
              animate={{ x: isDarkMode ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        {/* Avatar Selection */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-500" /> اختر صورة الملف الشخصي
          </label>
          <AvatarGallery 
            selectedAvatar={formData.photoURL} 
            onSelect={(url, id) => setFormData({ ...formData, photoURL: url, avatarId: id })} 
          />
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <User size={16} className="text-blue-500" /> الاسم الكامل
            </label>
            <input 
              type="text" 
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail size={16} className="text-blue-500" /> البريد الإلكتروني
            </label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all"
            />
          </div>
        </div>

        {/* Branch */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <BookOpen size={16} className="text-purple-500" /> الشعبة الدراسية
          </label>
          <select 
            value={formData.branch}
            onChange={(e) => setFormData({ ...formData, branch: e.target.value, favoriteSubjects: [] })}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all"
          >
            {BAC_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
        </div>

        {/* Favorite Subjects */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Sparkles size={16} className="text-orange-500" /> المواد المفضلة
          </label>
          <div className="flex flex-wrap gap-2">
            {currentSubjects.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSubject(s.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  formData.favoriteSubjects.includes(s.name)
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-500'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom API Keys */}
        <div className="space-y-4 pt-4 border-t dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Key size={18} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">مفاتيح API الخاصة (اختياري)</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            إذا كنت تواجه مشاكل في التحليل أو البحث، يمكنك إضافة مفاتيحك الخاصة هنا. سيتم حفظها في متصفحك فقط.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Gemini API Key</label>
              <input 
                type="password" 
                value={apiKeys.gemini}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">YouTube API Key</label>
              <input 
                type="password" 
                value={apiKeys.youtube}
                onChange={(e) => setApiKeys({ ...apiKeys, youtube: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Cloudinary API Key</label>
              <input 
                type="password" 
                value={apiKeys.cloudinary}
                onChange={(e) => setApiKeys({ ...apiKeys, cloudinary: e.target.value })}
                placeholder="Cloudinary Key..."
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-blue-500" />
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">تلقي التنبيهات</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">تنبيهات حول الدروس الجديدة والاختبارات</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
            className={`w-12 h-6 rounded-full transition-colors relative ${formData.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
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
            className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 p-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all active:scale-95"
          >
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}
