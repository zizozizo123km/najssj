import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Search, 
  ChevronRight, 
  Youtube, 
  Clock, 
  BookOpen,
  ArrowLeft,
  X,
  ListChecks,
  Database
} from 'lucide-react';
import { auth, db, doc, getDoc, setDoc, serverTimestamp, collection, addDoc, updateDoc, getDocs, query, where } from '../lib/firebase';
import { getApiKey } from '../lib/apiKeys';

// Representative Annual Programs for Algerian Baccalaureate
const ANNUAL_PROGRAMS: { [key: string]: string[] } = {
  'الرياضيات': [
    'الدوال العددية',
    'الدوال الأسية واللوغاريتمية',
    'الأعداد المركبة',
    'المتتاليات العددية',
    'الاحتمالات',
    'الهندسة في الفضاء',
    'الدوال الأصلية والحساب التكاملي'
  ],
  'الفيزياء': [
    'المتابعة الزمنية لتحول كيميائي',
    'التحولات النووية',
    'الظواهر الكهربائية (RC, RL)',
    'تطور جملة ميكانيكية',
    'تطور جملة كيميائية نحو حالة التوازن',
    'مراقبة تطور جملة كيميائية'
  ],
  'علوم الطبيعة والحياة': [
    'تركيب البروتين',
    'العلاقة بين بنية ووظيفة البروتين',
    'النشاط الإنزيمي للبروتينات',
    'دور البروتينات في الدفاع عن الذات (المناعة)',
    'دور البروتينات في الاتصال العصبي',
    'آليات تحويل الطاقة الضوئية إلى طاقة كيميائية'
  ],
  'الفلسفة': [
    'السؤال بين المشكلة والإشكالية',
    'في الإدراك الحسي',
    'في الأخلاق الموضوعية والأخلاق النسبية',
    'في فلسفة العلوم',
    'الفن والتصوف',
    'الحقيقة بين المطلق والنسبي'
  ],
  'اللغة العربية': [
    'عصر الضعف والانحطاط',
    'الأدب الحديث والمعاصر',
    'ظاهرة الالتزام في الأدب العربي',
    'القواعد والبلاغة',
    'النقد الأدبي'
  ],
  'التاريخ والجغرافيا': [
    'بروز الصراع وتشكل العالم (الحرب الباردة)',
    'الأزمات الدولية في ظل الصراع',
    'الثورة التحريرية الكبرى (1954-1962)',
    'استعادة السيادة الوطنية وبناء الدولة',
    'واقع الاقتصاد العالمي',
    'القوى الاقتصادية الكبرى في العالم'
  ]
};

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export default function CourseSubject() {
  const { subjectName } = useParams<{ subjectName: string }>();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Custom states for completing lessons and user rewards
  const [completedVideoIds, setCompletedVideoIds] = useState<string[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userDiamonds, setUserDiamonds] = useState<number>(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch completed videos list
        const watchedSnap = await getDocs(
          query(collection(db, 'watched_videos'), where('user_id', '==', user.uid))
        );
        const ids = watchedSnap.docs.map(doc => doc.data().video_id);
        setCompletedVideoIds(ids);

        // Fetch user profile stats
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (profileSnap.exists()) {
          const pData = profileSnap.data();
          setUserPoints(pData.points || 0);
          setUserDiamonds(pData.diamonds !== undefined ? pData.diamonds : 15);
        }
      } catch (e) {
        console.error("Error loading user data in CourseSubject:", e);
      }
    };

    loadUserData();
  }, [selectedVideo]);

  const handleCompleteLesson = async (video: YouTubeVideo) => {
    const user = auth.currentUser;
    if (!user) {
      alert('الرجاء تسجيل الدخول أولاً لتسجيل إكمال الدرس وكسب النقاط!');
      return;
    }

    const videoId: string = (typeof video.id === 'string' ? video.id : video.id?.videoId) || '';
    if (!videoId) {
      alert('تعذر تحديد معرف الفيديو.');
      return;
    }

    if (completedVideoIds.includes(videoId)) {
      alert('لقد أكملت هذا الدرس بالفعل وحصلت على مكافأتك!');
      return;
    }

    setCompleting(true);
    try {
      // 1. Add to watched_videos so student stats are synced
      await addDoc(collection(db, 'watched_videos'), {
        user_id: user.uid,
        video_id: videoId,
        title: video.snippet?.title || 'عنوان غير معروف',
        channel: video.snippet?.channelTitle || '',
        thumbnail: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '',
        created_at: serverTimestamp()
      });

      // 2. Update profiles document with +20 XP points and +2 diamonds
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      let nextPoints = userPoints + 20;
      let nextDiamonds = userDiamonds + 2;

      if (profileSnap.exists()) {
        const pData = profileSnap.data();
        nextPoints = (pData.points || 0) + 20;
        nextDiamonds = (pData.diamonds !== undefined ? pData.diamonds : 15) + 2;
      }

      await setDoc(profileRef, {
        points: nextPoints,
        diamonds: nextDiamonds
      }, { merge: true });

      // 3. Update local states
      setCompletedVideoIds(prev => [...prev, videoId]);
      setUserPoints(nextPoints);
      setUserDiamonds(nextDiamonds);

      alert('🎉 مبروك! لقد أكملت درس اليوم بنجاح وربحت +20 XP و +2 جوهرة 💎!');
    } catch (e: any) {
      console.error("Error completing lesson:", e);
      alert('حدث خطأ أثناء حفظ تقدمك الدراسي: ' + (e.message || 'خطأ غير معروف'));
    } finally {
      setCompleting(false);
    }
  };

  const topics = subjectName ? (ANNUAL_PROGRAMS[subjectName] || ['دروس عامة']) : [];

  const fetchVideos = async (topic: string) => {
    setLoading(true);
    setError(null);
    setIsFromCache(false);

    try {
      // 1. Check Firestore Cache First
      const cacheId = `${subjectName}_${topic}`.replace(/\s+/g, '_');
      const cacheRef = doc(db, 'video_cache', cacheId);
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        // Cache valid for 7 days
        const isExpired = Date.now() - cacheData.updated_at.toMillis() > 7 * 24 * 60 * 60 * 1000;
        
        if (!isExpired) {
          setVideos(cacheData.videos);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }

      // 2. Fetch API Key from the same source as Video Analyzer
      const apiKey = await getApiKey('youtube', 'api_key');
      if (!apiKey) {
        throw new Error('مفتاح YouTube API غير متوفر. يرجى إضافته من لوحة التحكم.');
      }

      // 3. If not in cache or expired, fetch from YouTube
      const query = encodeURIComponent(`bac ${subjectName} ${topic} شرح درس`);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&type=video&videoEmbeddable=true&relevanceLanguage=ar&key=${apiKey}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch videos');
      }

      const fetchedVideos = data.items || [];
      setVideos(fetchedVideos);

      // 4. Save to Firestore Cache
      if (fetchedVideos.length > 0) {
        await setDoc(cacheRef, {
          videos: fetchedVideos,
          updated_at: serverTimestamp(),
          subject: subjectName,
          topic: topic
        });
      }
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(err.message || 'حدث خطأ أثناء جلب الفيديوهات');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    fetchVideos(topic);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => selectedTopic ? setSelectedTopic(null) : navigate('/courses')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">
                {subjectName} {selectedTopic && <span className="text-blue-600">/ {selectedTopic}</span>}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedTopic ? 'فيديوهات مختارة' : 'البرنامج السنوي للمادة'}
              </p>
            </div>
          </div>

          {/* Points display widget */}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{userPoints} XP</span>
              <span className="text-xs">⚡</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">{userDiamonds}</span>
              <span className="text-xs">💎</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!selectedTopic ? (
            <motion.div 
              key="topics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="col-span-full flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                <ListChecks className="text-blue-600" size={24} />
                <h2 className="text-lg font-black">اختر وحدة من البرنامج السنوي:</h2>
              </div>
              {topics.map((topic, index) => (
                <motion.button
                  key={topic}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleTopicClick(topic)}
                  className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all text-right group"
                  dir="rtl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                      {index + 1}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{topic}</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="videos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {isFromCache && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 w-fit px-3 py-1 rounded-full border border-green-100 dark:border-green-900/30">
                  <Database size={12} />
                  تم التحميل من الذاكرة السريعة (توفير API)
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden animate-pulse border border-gray-100 dark:border-gray-800">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-800" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-8 text-center space-y-4">
                  <X size={32} className="mx-auto text-red-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">حدث خطأ</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                  <button onClick={() => fetchVideos(selectedTopic)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">إعادة المحاولة</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => {
                    const isCompleted = completedVideoIds.includes(video.id.videoId);
                    const progressVal = isCompleted ? 100 : 0;
                    const strokeColor = isCompleted ? 'bg-emerald-500' : 'bg-blue-600';

                    return (
                      <motion.div 
                        key={video.id.videoId}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-800 group cursor-pointer transition-all flex flex-col justify-between"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="relative aspect-video">
                          <img src={video.snippet.thumbnails.high.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                            <span className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-center text-blue-600 font-bold hover:scale-115 transition-transform">
                              <Play size={18} fill="currentColor" className="mr-[2px]" />
                            </span>
                          </div>
                          
                          {/* Duration label badge */}
                          <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                            12:45m
                          </span>

                          {/* Completed Badge overlay */}
                          {isCompleted && (
                            <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <span>✓</span> مكتمل
                            </span>
                          )}
                        </div>
                        
                        <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <h4 className="font-black text-xs text-gray-900 dark:text-white line-clamp-2 leading-snug" dir="rtl">
                              {video.snippet.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold">{video.snippet.channelTitle}</p>
                          </div>

                          {/* Progress indicator matching the mockup's 65% visually */}
                          <div className="space-y-2 pt-2 border-t border-gray-100/80 dark:border-gray-800/80">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-extrabold text-gray-500 dark:text-gray-400">معدل التقدم</span>
                              <span className="font-black text-blue-600 dark:text-blue-400">{progressVal}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full ${strokeColor} rounded-full`} style={{ width: `${progressVal}%` }} />
                            </div>

                            {/* Rounded teacher avatar circle and indicator details */}
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs shadow-sm">
                                  👨‍🏫
                                </div>
                                <span className="text-[9px] font-extrabold text-gray-500 dark:text-gray-400">
                                  محتوى مميز للمراجعة
                                </span>
                              </div>
                              {isCompleted && (
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">تم كسب +20 XP</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedVideo(null)} />
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[32px] overflow-hidden shadow-2xl z-10 flex flex-col transition-all">
            {/* Header / Title bar */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <div className="text-right flex-1" dir="rtl">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">شرح فيديو للمادة</span>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white mt-1 line-clamp-1">{selectedVideo.snippet.title}</h3>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 rounded-full transition-colors"><X size={20} /></button>
            </div>

            {/* Video Iframe container */}
            <div className="w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>

            {/* Completion reward status bar */}
            <div className="p-6 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4" dir="rtl">
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">قناة: {selectedVideo.snippet.channelTitle}</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed max-w-lg line-clamp-2">
                  {selectedVideo.snippet.description || "شرح متميز ومفصل لوحدة مادتك الأساسية يساعدك في التحضير للبكالوريا DZ."}
                </p>
              </div>

              {completedVideoIds.includes(selectedVideo.id.videoId) ? (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30 px-5 py-3 rounded-2xl text-xs font-black">
                  <span className="text-lg">✅</span>
                  تم إكمال هذا الدرس بنجاح! (+20 XP و 2💎)
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCompleteLesson(selectedVideo)}
                  disabled={completing}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 transition-all disabled:opacity-55"
                >
                  <span>⚡</span>
                  {completing ? 'جاري تسجيل التقدم...' : 'إتمام الدرس وكسب 20 XP و 2💎'}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
