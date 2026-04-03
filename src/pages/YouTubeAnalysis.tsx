import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function YouTubeAnalysis() {
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const [searchMode, setSearchMode] = useState<'url' | 'text'>('url');
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    let videoId = '';
    
    if (searchMode === 'url') {
      videoId = extractVideoId(url) || '';
      if (!videoId) {
        setLoading(false);
        return alert('رابط غير صالح');
      }
    } else {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        videoId = data.items[0].id.videoId;
      } else {
        setLoading(false);
        return alert('لم يتم العثور على فيديوهات');
      }
    }

    // 1. Fetch Video Details
    const res = await fetch(`/api/youtube/video-details?id=${videoId}`);
    const data = await res.json();
    const videoDetails = data.items[0];
    setVideo(videoDetails);

    // 2. Analyze with Gemini
    const prompt = `Analyze this YouTube video for a Baccalaureate student:
      Title: ${videoDetails.snippet.title}
      Description: ${videoDetails.snippet.description}
      Provide:
      1. A short educational summary.
      2. Key concepts (bullet points).
      3. Watch time recommendation (important parts based on description).
      Return as JSON with keys: summary, keyConcepts (array), watchTimeRecommendation (string).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    setAnalysis(JSON.parse(response.text || '{}'));
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold">تحليل فيديوهات يوتيوب</h1>
      <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setSearchMode('url')} className={`flex-1 p-2 rounded ${searchMode === 'url' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>بحث برابط</button>
          <button onClick={() => setSearchMode('text')} className={`flex-1 p-2 rounded ${searchMode === 'text' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>بحث بنص</button>
        </div>
        {searchMode === 'url' ? (
          <input type="text" placeholder="أدخل رابط الفيديو" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-3 border rounded" />
        ) : (
          <input type="text" placeholder="ابحث عن فيديو..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full p-3 border rounded" />
        )}
        <button onClick={handleSearch} disabled={loading} className="w-full bg-red-600 text-white p-3 rounded-lg font-bold">
          {loading ? 'جاري التحليل...' : 'تحليل الفيديو'}
        </button>
      </div>

      {video && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-bold">{video.snippet.title}</h2>
          <iframe className="w-full h-56 md:h-80 rounded-lg" src={`https://www.youtube.com/embed/${video.id}`} title="YouTube video player" allowFullScreen></iframe>
          <div className="text-sm text-gray-500">
            <p>القناة: {video.snippet.channelTitle}</p>
            <p>المشاهدات: {parseInt(video.statistics.viewCount).toLocaleString()}</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-bold">الملخص التعليمي</h2>
          <p>{analysis.summary}</p>
          <h3 className="font-bold">المفاهيم الأساسية:</h3>
          <ul className="list-disc pr-5 space-y-1">
            {analysis.keyConcepts?.map((c: string, i: number) => <li key={i}>{c}</li>)}
          </ul>
          <h3 className="font-bold">نصيحة وقت المشاهدة:</h3>
          <p className="bg-blue-50 p-3 rounded">{analysis.watchTimeRecommendation}</p>
        </div>
      )}
    </div>
  );
}
