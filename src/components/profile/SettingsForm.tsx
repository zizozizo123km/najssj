import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Phone, Lock, Bell, BookOpen, Save, X, Image as ImageIcon, Sparkles, Target, Upload, Loader2 } from 'lucide-react';
import AvatarGallery from './AvatarGallery';
import { BAC_BRANCHES, BAC_SUBJECTS } from '../../data/baccalaureate';
import { uploadFile } from '../../services/uploadService';

interface SettingsFormProps {
  user: {
    displayName: string | null;
    phone: string | null;
    photoURL: string | null;
    avatarId?: string | null;
    branch: string;
    favoriteSubjects: string[];
    targetScore: number;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function SettingsForm({ user, onSave, onCancel }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    phone: user.phone || '',
    photoURL: user.photoURL || '',
    avatarId: user.avatarId || '',
    branch: user.branch || BAC_BRANCHES[0].id,
    favoriteSubjects: user.favoriteSubjects || [],
    targetScore: user.targetScore || 15,
    notifications: true,
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("عذراً، يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP فقط.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت.");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFile(file, 'image');
      setFormData(prev => ({ ...prev, photoURL: url, avatarId: 'custom' }));
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setUploading(false);
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

  const currentSubjects = BAC_SUBJECTS[formData.branch] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-8 transition-colors"
    >
      <div className="flex items-center justify-between border-b dark:border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل الملف الشخصي</h2>
        <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
        {/* Avatar Selection */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-500" /> اختر صورة الملف الشخصي
          </label>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">يمكنك اختيار صورة من المعرض أو رفع صورة خاصة بك</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 text-[10px] font-black bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all text-blue-600 shadow-sm disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                  <span>{uploading ? 'جاري التحميل...' : 'رفع صورة مخصصة'}</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <AvatarGallery 
              selectedAvatar={formData.photoURL} 
              onSelect={(url, id) => setFormData({ ...formData, photoURL: url, avatarId: id })} 
            />
          </div>
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
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Phone size={16} className="text-blue-500" /> رقم الهاتف
            </label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all"
            />
          </div>
        </div>

        {/* Branch and Target Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <BookOpen size={16} className="text-purple-500" /> الشعبة الدراسية
            </label>
            <select 
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value, favoriteSubjects: [] })}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all"
            >
              {BAC_BRANCHES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Target size={16} className="text-red-500" /> الهدف (معدل البكالوريا)
            </label>
            <input 
              type="number" 
              min="10"
              max="20"
              step="0.01"
              value={formData.targetScore || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setFormData({ ...formData, targetScore: isNaN(val) ? 0 : val });
              }}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all text-left"
              dir="ltr"
            />
          </div>
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
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500/50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-blue-500" />
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">تلقي التنبيهات</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">تنبيهات حول الدروس الجديدة والاختبارات</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}
            className={`w-12 h-6 rounded-full transition-colors relative ${formData.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
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
            className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
          >
            إلغاء
          </button>
        </div>
      </form>
    </motion.div>
  );
}
