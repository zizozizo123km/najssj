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
import { db, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

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

  const topics = subjectName ? (ANNUAL_PROGRAMS[subjectName] || ['دروس عامة']) : [];

  const fetchVideos = async (topic: string) => {
    if (!API_KEY) {
      setError('YouTube API key is missing.');
      return;
    }

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

      // 2. If not in cache or expired, fetch from YouTube
      const query = encodeURIComponent(`bac ${subjectName} ${topic} شرح درس`);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&type=video&videoEmbeddable=true&relevanceLanguage=ar&key=${API_KEY}`
      );
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch videos');
      }

      const fetchedVideos = data.items || [];
      setVideos(fetchedVideos);

      // 3. Save to Firestore Cache
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
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
                  {videos.map((video) => (
                    <motion.div 
                      key={video.id.videoId}
                      whileHover={{ y: -5 }}
                      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group cursor-pointer transition-all"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative aspect-video">
                        <img src={video.snippet.thumbnails.high.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={32} className="text-white" fill="currentColor" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2" dir="rtl">{video.snippet.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-2">{video.snippet.channelTitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedVideo(null)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full"><X size={24} /></button>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}
