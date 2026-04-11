import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Search, Volume2, VolumeX, Music } from 'lucide-react';

// Note: In a real app, use environment variables for API keys.
// Do not hardcode API keys in the source code.
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

interface Video {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { default: { url: string } };
  };
}

export default function ReelsApp() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [query, setQuery] = useState('بكالوريا الجزائر shorts');
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  
  const cache = useRef<{ [key: string]: { items: Video[], token: string | null } }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchVideos = async (q: string, isLoadMore = false) => {
    if (!isLoadMore && cache.current[q]) {
      setVideos(cache.current[q].items);
      setNextPageToken(cache.current[q].token);
      if (cache.current[q].items.length > 0) setActiveVideoId(cache.current[q].items[0].id.videoId);
      return;
    }

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const tokenParam = isLoadMore && nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(q)}&type=video&videoDuration=short&videoEmbeddable=true&key=${API_KEY}${tokenParam}`
      );
      const data = await response.json();
      
      if (data.items) {
        if (isLoadMore) {
          setVideos(prev => {
            const existingIds = new Set(prev.map(v => v.id.videoId));
            const uniqueNewVideos = data.items.filter((v: Video) => !existingIds.has(v.id.videoId));
            return [...prev, ...uniqueNewVideos];
          });
        } else {
          setVideos(data.items);
          cache.current[q] = { items: data.items, token: data.nextPageToken || null };
          if (data.items.length > 0) setActiveVideoId(data.items[0].id.videoId);
        }
        setNextPageToken(data.nextPageToken || null);
      } else throw new Error("API Limit or Error");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVideos(query);
  }, [query]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const videoId = entry.target.getAttribute('data-video-id');
            if (videoId) setActiveVideoId(videoId);

            // Check if it's one of the last 3 videos to trigger load more
            const index = videos.findIndex(v => v.id.videoId === videoId);
            if (index >= videos.length - 3 && !loadingMore && nextPageToken) {
              fetchVideos(query, true);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const currentRefs = videoRefs.current;
    Object.values(currentRefs).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(currentRefs).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [videos, loadingMore, nextPageToken, query]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setQuery(`${searchInput} shorts`);
    }
  };

  if (!API_KEY) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
        <h2 className="text-xl font-bold mb-4">مفتاح الـ API مفقود!</h2>
        <p className="text-sm opacity-70">يرجى إضافة VITE_YOUTUBE_API_KEY في إعدادات البيئة (Environment Variables) لكي تعمل صفحة الريلز.</p>
      </div>
    );
  }

  return (
    <div className="bg-black font-sans antialiased overflow-hidden h-screen flex justify-center">
      <div className="w-full max-w-[450px] bg-black h-screen relative shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <h1 className="text-white font-black text-xl italic tracking-tighter">REELS AI</h1>
          <div className="flex-1 mx-4 relative">
            <input
              type="text"
              placeholder="بحث..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-full py-1.5 px-10 text-white text-xs outline-none focus:bg-white/20 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search 
              className="absolute right-3 top-2 text-white/40 w-4 h-4 cursor-pointer hover:text-white" 
              onClick={handleSearch}
            />
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="text-white/70 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Reels Container */}
        <div ref={containerRef} className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-white">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold tracking-widest opacity-50 uppercase">جاري التحميل</p>
            </div>
          ) : (
            videos.map((item) => (
              <div 
                key={item.id.videoId} 
                data-video-id={item.id.videoId}
                ref={(el) => (videoRefs.current[item.id.videoId] = el)}
                className="h-screen snap-start relative bg-black"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${item.id.videoId}?enablejsapi=1&autoplay=${activeVideoId === item.id.videoId ? 1 : 0}&mute=${(isMuted || activeVideoId !== item.id.videoId) ? 1 : 0}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&loop=1&playlist=${item.id.videoId}`}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  title={item.snippet.title}
                ></iframe>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none"></div>

                {/* Actions */}
                <div className="absolute right-4 bottom-24 z-40 flex flex-col items-center space-y-6">
                  <div className="flex flex-col items-center text-white cursor-pointer group">
                    <div className="p-3 rounded-full bg-zinc-900/60 backdrop-blur-md mb-1"><Heart size={24} /></div>
                    <span className="text-[10px] font-bold">12K</span>
                  </div>
                  <div className="flex flex-col items-center text-white cursor-pointer">
                    <div className="p-3 rounded-full bg-zinc-900/60 backdrop-blur-md mb-1"><MessageCircle size={24} /></div>
                    <span className="text-[10px] font-bold">450</span>
                  </div>
                  <div className="flex flex-col items-center text-white cursor-pointer">
                    <div className="p-3 rounded-full bg-zinc-900/60 backdrop-blur-md mb-1"><Share2 size={24} /></div>
                    <span className="text-[10px] font-bold">مشاركة</span>
                  </div>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 w-full p-6 pb-12 z-40 text-white text-right" dir="rtl">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={item.snippet.thumbnails.default.url} className="w-10 h-10 rounded-full border-2 border-white/20" alt="channel" />
                    <span className="font-bold text-sm">@{item.snippet.channelTitle}</span>
                    <button className="bg-white text-black px-4 py-1 rounded-full text-[10px] font-black mr-auto">متابعة</button>
                  </div>
                  <p className="text-xs font-medium mb-4 line-clamp-2">{item.snippet.title}</p>
                  <div className="flex items-center text-[10px] bg-black/40 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/10">
                    <Music className="ml-2 animate-pulse w-3 h-3" />
                    <span>الصوت الأصلي - {item.snippet.channelTitle}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
