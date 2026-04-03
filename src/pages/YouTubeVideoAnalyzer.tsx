import { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, BrainCircuit, RotateCcw, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import VideoList from '../components/youtube/VideoList';
import VideoPlayer from '../components/youtube/VideoPlayer';
import VideoSummary from '../components/youtube/VideoSummary';
import QuizSection from '../components/youtube/QuizSection';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  description: string;
}

const SUBJECTS = [
  'الكل', 'رياضيات', 'فيزياء', 'لغة عربية', 'تاريخ وجغرافيا', 
  'تربية إسلامية', 'فلسفة', 'لغة ألمانية'
];

export default function YouTubeVideoAnalyzer() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('الكل');
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [quiz, setQuiz] = useState<any[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [rating, setRating] = useState(0);

  const handleSearch = async (searchQuery?: string) => {
    const activeQuery = searchQuery || query;
    if (!activeQuery.trim() && filter === 'الكل') return;
    
    setLoading(true);
    try {
      const finalQuery = filter === 'الكل' 
        ? activeQuery + " بكالوريا الجزائر" 
        : `درس ${filter} ${activeQuery} بكالوريا الجزائر`;
        
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(finalQuery)}`);
      const data = await res.json();
      if (data.items) {
        setVideos(data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description
        })));
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter !== 'الكل' || query) {
      handleSearch();
    }
  }, [filter]);

  const handleAnalyze = async (video: Video) => {
    setSelectedVideo(video);
    setAnalyzing(true);
    setAnalysis(null);
    setQuiz([]);
    setShowQuiz(false);
    setRating(0);

    try {
      const prompt = `Analyze this YouTube video for a Baccalaureate student in Algeria.
        IMPORTANT: Use the Algerian Arabic dialect (Darija) for the summary and notes to make it feel like a local tutor is explaining, but keep technical terms and educational content accurate for the Algerian Baccalaureate.
        
        Title: ${video.title}
        Description: ${video.description}
        Channel: ${video.channelTitle}
        
        Provide:
        1. A short educational summary in Algerian Darija (max 3 paragraphs).
        2. Key points (array of strings in Algerian Darija).
        3. Important notes for Bac students (array of strings in Algerian Darija).
        4. Timestamps of important moments (array of objects with 'time' and 'topic' in Arabic).
        
        Return as JSON with keys: summary, keyPoints, importantNotes, timestamps.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setAnalysis(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateQuiz = async () => {
    if (!analysis) return;
    setAnalyzing(true);
    try {
      const prompt = `Based on this video analysis:
        Summary: ${analysis.summary}
        Key Points: ${analysis.keyPoints.join(', ')}
        
        Generate a quiz for Bac students in Algeria.
        IMPORTANT: Use the Algerian Arabic dialect (Darija) for the questions and explanations to make it more relatable for students.
        
        Generate:
        - 2 Multiple Choice Questions (MCQ)
        - 2 True/False Questions
        - 1 Short Answer Question
        
        Return as JSON array of objects with keys: id, type ('mcq', 'true-false', 'short-answer'), question, options (for mcq), correctAnswer, explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setQuiz(JSON.parse(response.text || '[]'));
      setShowQuiz(true);
    } catch (error) {
      console.error("Quiz generation error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveNotes = () => {
    alert('تم حفظ التحليل في ملاحظاتك بنجاح!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans space-y-8">
      {/* Header */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold border border-red-100">
          <Sparkles size={18} />
          <span>محلل فيديوهات يوتيوب الذكي</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">حول أي فيديو إلى درس متكامل</h1>
        <p className="text-gray-500 max-w-xl mx-auto">ابحث عن أي موضوع دراسي وسيقوم الذكاء الاصطناعي بتحليل الفيديو، تلخيصه، واختبارك فيه.</p>
      </header>

      {/* Search Bar & Filters */}
      {!selectedVideo && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-white p-2 rounded-2xl shadow-xl border border-gray-100">
              <Search className="absolute left-6 text-gray-400" size={24} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ابحث عن درس (مثلاً: المتتاليات الحسابية)..."
                className="w-full pl-14 pr-6 py-4 bg-transparent outline-none text-gray-800 font-medium"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'بحث'}
              </button>
            </div>
          </div>

          {/* Subject Filters */}
          <div className="flex flex-wrap justify-center gap-2">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  filter === s 
                    ? 'bg-red-600 text-white border-red-500 shadow-md' 
                    : 'bg-white text-gray-600 border-gray-100 hover:border-red-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {!selectedVideo ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {videos.length > 0 ? (
              <VideoList videos={videos} onSelect={handleAnalyze} />
            ) : !loading && (
              <div className="text-center py-20 space-y-4">
                <div className="w-20 h-20 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Search size={40} />
                </div>
                <p className="text-gray-400 font-medium">ابدأ بالبحث عن موضوع دراسي لتظهر النتائج هنا</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 pb-20"
          >
            {/* Back Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors"
            >
              <ChevronLeft size={20} />
              <span>العودة للنتائج</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Video & Summary */}
              <div className="lg:col-span-8 space-y-8">
                <VideoPlayer videoId={selectedVideo.id} title={selectedVideo.title} />
                
                {analyzing && !analysis && (
                  <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center space-y-4">
                    <Loader2 className="animate-spin text-red-600 mx-auto" size={48} />
                    <p className="text-gray-500 font-bold animate-pulse">جاري تحليل محتوى الفيديو بذكاء...</p>
                  </div>
                )}

                {analysis && !showQuiz && (
                  <VideoSummary 
                    summary={analysis} 
                    onSave={handleSaveNotes} 
                    onRate={setRating} 
                    rating={rating} 
                  />
                )}

                {showQuiz && (
                  <QuizSection questions={quiz} onRestart={() => setShowQuiz(false)} />
                )}
              </div>

              {/* Right Column: Actions & Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-6 sticky top-8">
                  <h3 className="font-bold text-gray-900 border-b pb-3">إجراءات سريعة</h3>
                  
                  {!showQuiz ? (
                    <button
                      onClick={generateQuiz}
                      disabled={analyzing || !analysis}
                      className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white p-4 rounded-xl font-bold hover:bg-black disabled:opacity-50 transition-all shadow-lg active:scale-95 group"
                    >
                      <BrainCircuit size={24} className="group-hover:rotate-12 transition-transform" />
                      <span>اختبر معلوماتي (Test Me)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowQuiz(false)}
                      className="w-full flex items-center justify-center gap-3 bg-gray-100 text-gray-700 p-4 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                    >
                      <RotateCcw size={20} />
                      <span>العودة للتحليل</span>
                    </button>
                  )}

                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">فيديوهات مشابهة</p>
                    <div className="space-y-3">
                      {videos.filter(v => v.id !== selectedVideo.id).slice(0, 3).map(v => (
                        <div 
                          key={v.id} 
                          onClick={() => handleAnalyze(v)}
                          className="flex gap-3 cursor-pointer group"
                        >
                          <img src={v.thumbnail} className="w-20 h-12 object-cover rounded-lg shadow-sm group-hover:ring-2 ring-red-500 transition-all" referrerPolicy="no-referrer" />
                          <p className="text-xs font-bold text-gray-700 line-clamp-2 group-hover:text-red-600 transition-colors">{v.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
