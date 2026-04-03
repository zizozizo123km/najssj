import { useState, useEffect, useRef } from 'react';
import { Filter, TrendingUp, Loader2, Sparkles, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReelCard from '../components/reels/ReelCard';

const SUBJECTS = [
  'الكل', 'رياضيات', 'فيزياء', 'لغة عربية', 'تاريخ وجغرافيا', 
  'تربية إسلامية', 'فلسفة', 'لغة ألمانية'
];

export default function Reels() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReels = async () => {
      setLoading(true);
      try {
        const query = filter === 'الكل' ? 'بكالوريا الجزائر shorts' : `درس ${filter} بكالوريا الجزائر shorts`;
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=10`);
        const data = await res.json();
        if (data.items) {
          setReels(data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            subject: filter === 'الكل' ? 'عام' : filter,
            likes: Math.floor(Math.random() * 5000) + 100,
            viewCount: Math.floor(Math.random() * 50000) + 1000,
            commentsCount: Math.floor(Math.random() * 200) + 10
          })));
        }
      } catch (error) {
        console.error("Fetch reels error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, [filter]);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollPos = containerRef.current.scrollTop;
      const height = containerRef.current.clientHeight;
      const idx = Math.round(scrollPos / height);
      if (idx !== activeIdx) {
        setActiveIdx(idx);
      }
    }
  };

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden font-sans">
      {/* Subject Filter Overlay */}
      <div className="absolute top-4 left-0 right-0 z-40 flex flex-col items-center gap-3 px-4 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/80 text-xs font-bold pointer-events-auto">
          <Sparkles size={14} className="text-blue-400" />
          <span>ريلز تعليمية للبكالوريا</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full max-w-md justify-center pointer-events-auto">
          {SUBJECTS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                filter === s 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'bg-black/40 text-white/70 border-white/10 hover:bg-black/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Feed */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full flex flex-col items-center justify-center space-y-4 text-white"
            >
              <div className="relative">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <Video className="absolute inset-0 m-auto text-white/20" size={20} />
              </div>
              <p className="text-sm font-bold animate-pulse text-white/60">جاري جلب أفضل الريلز التعليمية...</p>
            </motion.div>
          ) : (
            reels.map((reel, idx) => (
              <ReelCard 
                key={reel.id} 
                reel={reel} 
                isActive={idx === activeIdx} 
              />
            ))
          )}
        </AnimatePresence>

        {!loading && reels.length === 0 && (
          <div className="h-full w-full flex flex-col items-center justify-center text-white p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
              <Video size={40} className="text-white/20" />
            </div>
            <p className="text-gray-400 font-medium">لم نجد ريلز لهذا الموضوع حالياً. جرب مادة أخرى!</p>
            <button 
              onClick={() => setFilter('الكل')}
              className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm"
            >
              عرض الكل
            </button>
          </div>
        )}
      </div>

      {/* Trending Indicator */}
      <div className="absolute top-20 right-4 z-40 pointer-events-none">
        <div className="flex flex-col items-center gap-1 bg-black/20 backdrop-blur-md border border-white/10 p-2 rounded-xl text-white/60">
          <TrendingUp size={16} className="text-red-500" />
          <span className="text-[8px] font-bold uppercase tracking-tighter">Trending</span>
        </div>
      </div>
    </div>
  );
}
