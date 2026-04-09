import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, GraduationCap, BookOpen, TrendingUp, HelpCircle, Video, Bookmark } from 'lucide-react';
import { db, doc, getDoc, collection, query, where, getDocs } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { BAC_BRANCHES } from '../../data/baccalaureate';

interface ProfilePreviewProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePreview({ userId, isOpen, onClose }: ProfilePreviewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    savedSummaries: 0,
    analyzedVideos: 0,
    completedQuizzes: 0,
    successRate: 0
  });

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', userId));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setProfile({
            displayName: data.full_name || 'مستخدم جديد',
            photoURL: data.avatar_url || null,
            branch: data.branch || 'sciences',
            favoriteSubjects: data.favorite_subjects || [],
          });

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

          setStats({
            savedSummaries: summariesSnap.size,
            analyzedVideos: videosSnap.size,
            completedQuizzes: quizzesSnap.size,
            successRate
          });
        }
      } catch (error) {
        console.error("Error fetching profile preview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header/Cover */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={40} />
                  </div>
                )}
              </div>

              {loading ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500 font-bold">جاري التحميل...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {profile?.displayName}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <GraduationCap size={14} className="text-purple-500" />
                      <span>{BAC_BRANCHES.find(b => b.id === profile?.branch)?.name || profile?.branch}</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1">
                      <TrendingUp size={16} className="text-green-500" />
                      <span className="text-lg font-black text-gray-900 dark:text-white">{stats.successRate}%</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">نسبة النجاح</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1">
                      <HelpCircle size={16} className="text-orange-500" />
                      <span className="text-lg font-black text-gray-900 dark:text-white">{stats.completedQuizzes}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">اختبار منجز</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1">
                      <Video size={16} className="text-red-500" />
                      <span className="text-lg font-black text-gray-900 dark:text-white">{stats.analyzedVideos}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">فيديو محلل</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1">
                      <Bookmark size={16} className="text-blue-500" />
                      <span className="text-lg font-black text-gray-900 dark:text-white">{stats.savedSummaries}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">ملخص محفوظ</span>
                    </div>
                  </div>

                  {/* Favorite Subjects */}
                  {profile?.favoriteSubjects?.length > 0 && (
                    <div className="w-full space-y-2 pt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">المواد المفضلة</p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {profile.favoriteSubjects.map((subject: string) => (
                          <span key={subject} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold border border-blue-100 dark:border-blue-900/50">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
