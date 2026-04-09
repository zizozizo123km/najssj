import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, BookOpen, TrendingUp, Bookmark, Award } from 'lucide-react';
import { db, doc, getDoc, collection, query, where, getDocs } from '../../lib/firebase';
import { UserProfile } from '../../types';

interface MiniProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniProfileModal({ userId, isOpen, onClose }: MiniProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', userId));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          
          // Fetch stats
          const [summariesSnap, videosSnap, quizzesSnap] = await Promise.all([
            getDocs(query(collection(db, 'summaries'), where('user_id', '==', userId))),
            getDocs(query(collection(db, 'watched_videos'), where('user_id', '==', userId))),
            getDocs(query(collection(db, 'quiz_sessions'), where('user_id', '==', userId)))
          ]);

          let totalScore = 0;
          let totalQuestions = 0;
          quizzesSnap.forEach(doc => {
            const d = doc.data();
            totalScore += d.score || 0;
            totalQuestions += d.total_questions || 0;
          });
          const successRate = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

          setProfile({
            displayName: data.full_name || 'مستخدم',
            photoURL: data.avatar_url || null,
            branch: data.branch || 'sciences',
            favoriteSubjects: data.favorite_subjects || [],
            stats: {
              savedSummaries: summariesSnap.size,
              analyzedVideos: videosSnap.size,
              completedQuizzes: quizzesSnap.size,
              successRate: successRate,
            }
          });
        }
      } catch (error) {
        console.error("Error fetching mini profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
          ) : profile ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <img 
                  src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}`} 
                  alt={profile.displayName}
                  className="w-24 h-24 rounded-full border-4 border-blue-50 dark:border-blue-900/30 object-cover"
                />
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{profile.displayName}</h3>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                  {profile.branch}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                  <Bookmark className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-black text-gray-900 dark:text-white">{profile.stats.savedSummaries}</div>
                  <div className="text-[10px] text-gray-500">ملخصات</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-black text-gray-900 dark:text-white">{profile.stats.successRate}%</div>
                  <div className="text-[10px] text-gray-500">نجاح</div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500">المواد المفضلة:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.favoriteSubjects.map((s: string) => (
                    <span key={s} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">تعذر تحميل الملف الشخصي</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
